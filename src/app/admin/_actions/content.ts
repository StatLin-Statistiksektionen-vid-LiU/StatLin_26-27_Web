"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  type FormState,
  formObject,
  invalid,
  zCheckbox,
  zOptionalEmail,
  zOptionalId,
  zRequired,
  zText,
  zUrl,
} from "@/lib/admin/form";
import { audit, canUseImage, nowIso, revalidateSite } from "@/lib/admin/helpers";
import { canEditCommittee, canEditImages, canManageDocument, canManageDocuments, canManageSettings, isEditor } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/data/content";
import { deleteMediaIfUnused, MediaError, storeFile } from "@/lib/media-store";
import { renderMarkdown } from "@/lib/markdown";
import { toImageRef } from "@/lib/media-url";
import type { DocumentCategory, Media } from "@/lib/types";

const forbidden: FormState = { error: "Du har inte behörighet att göra det här." };

/* ---------- Markdown-förhandsvisning ---------- */

export async function previewMarkdown(md: string): Promise<string> {
  await requireUser();
  return renderMarkdown(md.slice(0, 50000));
}

/* ---------- Styrelsen ---------- */

const boardSchema = z.object({
  post: zRequired(80, "Posten"),
  name: zText(120, "Namnet"),
  email: zOptionalEmail,
  bio: zText(400, "Beskrivningen"),
  photo_media_id: zOptionalId,
  committee_id: zOptionalId,
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
});

export async function saveBoardMember(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!isEditor(user)) return forbidden;
  const id = Number(fd.get("id")) || null;
  const parsed = boardSchema.safeParse(formObject(fd));
  if (!parsed.success) return invalid(parsed.error);
  const db = getDb();
  if (id) {
    const old = db.prepare("SELECT photo_media_id FROM board_members WHERE id = ?").get(id) as { photo_media_id: number | null } | undefined;
    if (!old) return { error: "Posten finns inte längre." };
    db.prepare(
      `UPDATE board_members SET post=@post, name=@name, email=@email, bio=@bio, photo_media_id=@photo_media_id,
        committee_id=@committee_id, sort_order=@sort_order WHERE id=@id`,
    ).run({ ...parsed.data, id });
    if (old.photo_media_id !== parsed.data.photo_media_id) await deleteMediaIfUnused(old.photo_media_id);
    audit(user.id, "update", "board", id, parsed.data.post);
    revalidateSite();
    return { ok: true, message: "Posten är sparad." };
  }
  const res = db
    .prepare(
      `INSERT INTO board_members (post, name, email, bio, photo_media_id, committee_id, sort_order)
       VALUES (@post, @name, @email, @bio, @photo_media_id, @committee_id, @sort_order)`,
    )
    .run(parsed.data);
  audit(user.id, "create", "board", Number(res.lastInsertRowid), parsed.data.post);
  revalidateSite();
  redirect("/admin/styrelsen?sparad=1");
}

export async function deleteBoardMember(fd: FormData) {
  const user = await requireUser();
  if (!isEditor(user)) redirect("/admin");
  const id = Number(fd.get("id"));
  const db = getDb();
  const row = db.prepare("SELECT post, photo_media_id FROM board_members WHERE id = ?").get(id) as { post: string; photo_media_id: number | null } | undefined;
  if (row) {
    db.prepare("DELETE FROM board_members WHERE id = ?").run(id);
    await deleteMediaIfUnused(row.photo_media_id);
    audit(user.id, "delete", "board", id, row.post);
    revalidateSite();
  }
  redirect("/admin/styrelsen?raderad=1");
}

export async function moveBoardMember(id: number, direction: -1 | 1) {
  const user = await requireUser();
  if (!isEditor(user)) throw new Error("Saknar behörighet.");
  const db = getDb();
  const rows = db.prepare("SELECT id FROM board_members ORDER BY sort_order, id").all() as { id: number }[];
  const idx = rows.findIndex((r) => r.id === id);
  const swap = idx + direction;
  if (idx < 0 || swap < 0 || swap >= rows.length) return;
  [rows[idx], rows[swap]] = [rows[swap], rows[idx]];
  const stmt = db.prepare("UPDATE board_members SET sort_order = ? WHERE id = ?");
  db.transaction(() => rows.forEach((r, i) => stmt.run(i * 10, r.id)))();
  revalidateSite();
}

/* ---------- Utskott ---------- */

const committeeSchema = z.object({
  name: zRequired(120, "Namnet"),
  short_name: zRequired(30, "Förkortningen"),
  tagline: zText(200, "Slogan"),
  description_md: zText(20000, "Beskrivningen"),
  logo_media_id: zOptionalId,
  logo_url: zText(300),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Ange en färg som #RRGGBB.").default("#ff0707"),
  email: zOptionalEmail,
  instagram: zUrl,
  visible: zCheckbox,
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
});

export async function saveCommittee(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const id = Number(fd.get("id"));
  if (!id || !canEditCommittee(user, id)) return forbidden;
  const parsed = committeeSchema.safeParse(formObject(fd));
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;
  const db = getDb();
  let logoUrl = d.logo_url || null;
  if (d.logo_media_id) {
    const m = db.prepare("SELECT * FROM media WHERE id = ?").get(d.logo_media_id) as Media | undefined;
    logoUrl = toImageRef(m)?.src ?? logoUrl;
  }
  // Utskottskonton får inte dölja sitt utskott eller ändra sorteringen.
  const extra = isEditor(user) ? { visible: d.visible, sort_order: d.sort_order } : (db.prepare("SELECT visible, sort_order FROM committees WHERE id = ?").get(id) as { visible: number; sort_order: number });
  db.prepare(
    `UPDATE committees SET name=@name, short_name=@short_name, tagline=@tagline, description_md=@description_md, logo_url=@logo_url,
      accent=@accent, email=@email, instagram=@instagram, visible=@visible, sort_order=@sort_order, updated_at=@updated_at WHERE id=@id`,
  ).run({ ...d, ...extra, logo_url: logoUrl, updated_at: nowIso(), id });
  audit(user.id, "update", "committee", id, d.short_name);
  revalidateSite();
  return { ok: true, message: "Utskottet är sparat." };
}

/** Bara loggan, från sidan Bilder – även för grafiskt ansvarig, på alla utskott. */
export async function setCommitteeLogo(committeeId: number, mediaId: number | null) {
  const user = await requireUser();
  const db = getDb();
  const committee = db.prepare("SELECT id, short_name, logo_url FROM committees WHERE id = ?").get(committeeId) as
    | { id: number; short_name: string; logo_url: string | null }
    | undefined;
  if (!committee || !canEditImages(user, { committee_id: committee.id }) || !canUseImage(user, mediaId)) throw new Error("Saknar behörighet.");
  const media = mediaId ? (db.prepare("SELECT * FROM media WHERE id = ?").get(mediaId) as Media | undefined) : undefined;
  const logoUrl = toImageRef(media)?.src ?? null;
  if (logoUrl === committee.logo_url) return;
  // Loggan sparas som adress. En uppladdad logga som ersätts tas bort om inget annat använder den.
  const old = committee.logo_url?.startsWith("/media/")
    ? (db.prepare("SELECT id FROM media WHERE ? LIKE '/media/' || path_base || '-%'").get(committee.logo_url) as { id: number } | undefined)
    : undefined;
  db.prepare("UPDATE committees SET logo_url = ?, updated_at = ? WHERE id = ?").run(logoUrl, nowIso(), committeeId);
  await deleteMediaIfUnused(old?.id);
  audit(user.id, "logo", "committee", committeeId, committee.short_name);
  revalidateSite();
}

/* ---------- Sidor ---------- */

export async function savePage(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!isEditor(user)) return forbidden;
  const parsed = z
    .object({ slug: z.string(), title: zRequired(120, "Titeln"), lead: zText(500, "Ingressen"), body_md: zText(60000, "Texten") })
    .safeParse(formObject(fd));
  if (!parsed.success) return invalid(parsed.error);
  const res = getDb()
    .prepare("UPDATE pages SET title=@title, lead=@lead, body_md=@body_md, updated_at=@updated_at, updated_by=@updated_by WHERE slug=@slug")
    .run({ ...parsed.data, updated_at: nowIso(), updated_by: user.id });
  if (res.changes === 0) return { error: "Sidan finns inte." };
  audit(user.id, "update", "page", parsed.data.slug, parsed.data.title);
  revalidateSite();
  return { ok: true, message: "Sidan är sparad och publicerad." };
}

/* ---------- Dokument ---------- */

const docSchema = z.object({
  title: zRequired(160, "Titeln"),
  category: z.enum(["styrdokument", "protokoll", "grafiskt", "ovrigt"]),
  description: zText(300, "Beskrivningen"),
  url: zUrl,
  doc_date: z
    .string()
    .optional()
    .transform((v) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)),
  published: zCheckbox,
});

export async function saveDocument(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!canManageDocuments(user)) return forbidden;
  const id = Number(fd.get("id")) || null;
  const parsed = docSchema.safeParse(formObject(fd));
  if (!parsed.success) return invalid(parsed.error);
  // Grafiskt ansvarig lägger bara upp grafiskt material, vad formuläret än skickar.
  const d = isEditor(user) ? parsed.data : { ...parsed.data, category: "grafiskt" as const };
  const db = getDb();
  const old = id
    ? (db.prepare("SELECT media_id, category FROM documents WHERE id = ?").get(id) as { media_id: number | null; category: DocumentCategory } | undefined)
    : undefined;
  if (id && !old) return { error: "Dokumentet finns inte längre." };
  if (old && !canManageDocument(user, old.category)) return forbidden;

  let mediaId: number | null = null;
  const file = fd.get("file");
  if (file instanceof File && file.size > 0) {
    try {
      mediaId = (await storeFile(file, user.id)).id;
    } catch (err) {
      return { error: err instanceof MediaError ? err.message : "Filen kunde inte sparas.", fieldErrors: { file: "Kontrollera filen." } };
    }
  }

  if (id && old) {
    const nextMedia = mediaId ?? (fd.get("remove_file") === "on" ? null : old.media_id);
    db.prepare(
      "UPDATE documents SET title=@title, category=@category, description=@description, url=@url, doc_date=@doc_date, published=@published, media_id=@media_id WHERE id=@id",
    ).run({ ...d, media_id: nextMedia, id });
    if (old.media_id !== nextMedia) await deleteMediaIfUnused(old.media_id);
    audit(user.id, "update", "document", id, d.title);
    revalidateSite();
    return { ok: true, message: "Dokumentet är sparat." };
  }

  if (!mediaId && !d.url) return { error: "Ladda upp en fil eller ange en länk.", fieldErrors: { file: "Välj en fil eller ange en länk." } };
  db.prepare(
    "INSERT INTO documents (title, category, description, url, doc_date, published, media_id) VALUES (@title, @category, @description, @url, @doc_date, @published, @media_id)",
  ).run({ ...d, media_id: mediaId });
  audit(user.id, "create", "document", null, d.title);
  revalidateSite();
  redirect("/admin/dokument?sparad=1");
}

export async function deleteDocument(fd: FormData) {
  const user = await requireUser();
  if (!canManageDocuments(user)) redirect("/admin");
  const id = Number(fd.get("id"));
  const db = getDb();
  const row = db.prepare("SELECT title, media_id, category FROM documents WHERE id = ?").get(id) as
    | { title: string; media_id: number | null; category: DocumentCategory }
    | undefined;
  if (row && canManageDocument(user, row.category)) {
    db.prepare("DELETE FROM documents WHERE id = ?").run(id);
    await deleteMediaIfUnused(row.media_id);
    audit(user.id, "delete", "document", id, row.title);
    revalidateSite();
  }
  redirect("/admin/dokument?raderad=1");
}

/* ---------- Partners ---------- */

const partnerSchema = z.object({
  name: zRequired(120, "Namnet"),
  url: zUrl,
  description: zText(300),
  logo_media_id: zOptionalId,
  tier: z.enum(["huvudpartner", "partner"]).default("partner"),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
  active: zCheckbox,
});

export async function savePartner(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!isEditor(user)) return forbidden;
  const id = Number(fd.get("id")) || null;
  const parsed = partnerSchema.safeParse(formObject(fd));
  if (!parsed.success) return invalid(parsed.error);
  const db = getDb();
  if (id) {
    const old = db.prepare("SELECT logo_media_id FROM partners WHERE id = ?").get(id) as { logo_media_id: number | null } | undefined;
    if (!old) return { error: "Partnern finns inte längre." };
    db.prepare(
      "UPDATE partners SET name=@name, url=@url, description=@description, logo_media_id=@logo_media_id, tier=@tier, sort_order=@sort_order, active=@active WHERE id=@id",
    ).run({ ...parsed.data, id });
    if (old.logo_media_id !== parsed.data.logo_media_id) await deleteMediaIfUnused(old.logo_media_id);
    audit(user.id, "update", "partner", id, parsed.data.name);
    revalidateSite();
    return { ok: true, message: "Partnern är sparad." };
  }
  db.prepare(
    "INSERT INTO partners (name, url, description, logo_media_id, tier, sort_order, active) VALUES (@name, @url, @description, @logo_media_id, @tier, @sort_order, @active)",
  ).run(parsed.data);
  audit(user.id, "create", "partner", null, parsed.data.name);
  revalidateSite();
  redirect("/admin/partners?sparad=1");
}

export async function deletePartner(fd: FormData) {
  const user = await requireUser();
  if (!isEditor(user)) redirect("/admin");
  const id = Number(fd.get("id"));
  const db = getDb();
  const row = db.prepare("SELECT name, logo_media_id FROM partners WHERE id = ?").get(id) as { name: string; logo_media_id: number | null } | undefined;
  if (row) {
    db.prepare("DELETE FROM partners WHERE id = ?").run(id);
    await deleteMediaIfUnused(row.logo_media_id);
    audit(user.id, "delete", "partner", id, row.name);
    revalidateSite();
  }
  redirect("/admin/partners?raderad=1");
}

/* ---------- Inställningar ---------- */

const settingsSchema = z.object({
  contact_email: z.string().trim().toLowerCase().email("Ange en giltig e-postadress."),
  instagram: zUrl,
  facebook: zUrl,
  linkedin: zUrl,
  address: zText(200),
  sektionsrum: zText(200),
  org_number: zText(40),
  tagline: zText(200),
  hero_kicker: zText(80, "Kickern"),
  hero_title: zRequired(140, "Rubriken"),
  hero_text: zText(300, "Underrubriken"),
  home_intro: zRequired(400, "Texten"),
  announcement: zText(200),
  announcement_url: zUrl,
});

/** Sparar bara fälten som finns i formuläret, så att delformulär (t.ex. bara startsidan) inte tömmer resten. */
export async function saveSettings(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!canManageSettings(user)) return forbidden;
  const raw = formObject(fd);
  type Key = keyof typeof settingsSchema.shape;
  const present = Object.keys(settingsSchema.shape).filter((k) => k in raw) as Key[];
  if (present.length === 0) return { error: "Inget att spara." };
  const mask = Object.fromEntries(present.map((k) => [k, true])) as { [K in Key]?: true };
  const parsed = settingsSchema.pick(mask).safeParse(raw);
  if (!parsed.success) return invalid(parsed.error);
  const db = getDb();
  const stmt = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
  db.transaction(() => {
    for (const [k, v] of Object.entries(parsed.data)) if (k in DEFAULT_SETTINGS) stmt.run(k, v);
  })();
  audit(user.id, "update", "settings", null, present.some((k) => k.startsWith("hero_") || k === "home_intro") ? "Startsidan" : "Webbplatsinställningar");
  revalidateSite();
  return { ok: true, message: "Inställningarna är sparade." };
}
