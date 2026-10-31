"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { type FormState, formObject, invalid, zCheckbox, zOptionalId, zOptionalLocalDateTime, zRequired, zText } from "@/lib/admin/form";
import { audit, canUseImage, nowIso, revalidateSite, uniqueSlug } from "@/lib/admin/helpers";
import { canEditImages, canEditOwned, isEditor } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { deleteMediaIfUnused } from "@/lib/media-store";

const schema = z.object({
  title: zRequired(160, "Rubriken"),
  slug: zText(90),
  excerpt: zText(320, "Ingressen"),
  body_md: zText(40000, "Texten"),
  committee_id: zOptionalId,
  cover_media_id: zOptionalId,
  published: zCheckbox,
  pinned: zCheckbox,
  published_at: zOptionalLocalDateTime,
});

const badCover: FormState = { error: "Omslagsbilden kan inte användas. Ladda upp en ny bild." };

/** Lokal Stockholmstid "YYYY-MM-DDTHH:mm" → ISO (UTC). */
function stockholmToIso(local: string): string {
  // Prova båda möjliga UTC-förskjutningarna (CET/CEST) och välj den som formaterar tillbaka till samma lokala tid.
  for (const offset of ["+01:00", "+02:00"]) {
    const d = new Date(`${local}:00${offset}`);
    const back = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Stockholm",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .format(d)
      .replace(" ", "T");
    if (back === local) return d.toISOString();
  }
  return new Date(`${local}:00+01:00`).toISOString();
}

export async function saveNews(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const id = Number(fd.get("id")) || null;
  const parsed = schema.safeParse(formObject(fd));
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;
  const committeeId = isEditor(user) ? d.committee_id : user.committee_id;
  const pinned = isEditor(user) ? d.pinned : 0;
  const publishedAt = d.published_at ? stockholmToIso(d.published_at) : nowIso();
  const db = getDb();

  if (id) {
    const existing = db.prepare("SELECT id, committee_id, pinned, cover_media_id FROM news WHERE id = ?").get(id) as
      | { id: number; committee_id: number | null; pinned: number; cover_media_id: number | null }
      | undefined;
    if (!existing) return { error: "Nyheten finns inte längre." };
    if (!canEditOwned(user, existing)) return { error: "Du har inte behörighet att ändra den här nyheten." };
    if (d.cover_media_id !== existing.cover_media_id && !canUseImage(user, d.cover_media_id)) return badCover;
    const slug = uniqueSlug("news", d.slug || d.title, id);
    db.prepare(
      `UPDATE news SET title=@title, slug=@slug, excerpt=@excerpt, body_md=@body_md, committee_id=@committee_id,
        cover_media_id=@cover_media_id, published=@published, pinned=@pinned, published_at=@published_at, updated_at=@updated_at WHERE id=@id`,
    ).run({ ...d, slug, committee_id: committeeId, pinned: isEditor(user) ? pinned : existing.pinned, published_at: publishedAt, updated_at: nowIso(), id });
    if (existing.cover_media_id !== d.cover_media_id) await deleteMediaIfUnused(existing.cover_media_id);
    audit(user.id, "update", "news", id, d.title);
    revalidateSite();
    return { ok: true, message: d.published ? "Sparat och publicerat." : "Sparat som utkast." };
  }

  if (!isEditor(user) && !user.committee_id) return { error: "Ditt konto är inte kopplat till något utskott." };
  if (!canUseImage(user, d.cover_media_id)) return badCover;
  const slug = uniqueSlug("news", d.slug || d.title);
  const res = db
    .prepare(
      `INSERT INTO news (title, slug, excerpt, body_md, committee_id, cover_media_id, published, pinned, published_at, author_id)
       VALUES (@title, @slug, @excerpt, @body_md, @committee_id, @cover_media_id, @published, @pinned, @published_at, @author_id)`,
    )
    .run({ ...d, slug, committee_id: committeeId, pinned, published_at: publishedAt, author_id: user.id });
  audit(user.id, "create", "news", Number(res.lastInsertRowid), d.title);
  revalidateSite();
  redirect(`/admin/nyheter/${res.lastInsertRowid}?skapad=1`);
}

export async function deleteNews(fd: FormData) {
  const user = await requireUser();
  const id = Number(fd.get("id"));
  const db = getDb();
  const existing = db.prepare("SELECT id, committee_id, title, cover_media_id FROM news WHERE id = ?").get(id) as
    | { id: number; committee_id: number | null; title: string; cover_media_id: number | null }
    | undefined;
  if (!existing || !canEditOwned(user, existing)) redirect("/admin/nyheter");
  db.prepare("DELETE FROM news WHERE id = ?").run(id);
  await deleteMediaIfUnused(existing.cover_media_id);
  audit(user.id, "delete", "news", id, existing.title);
  revalidateSite();
  redirect("/admin/nyheter?raderad=1");
}

/** Bara omslaget, från sidan Bilder och redigeringsläget – även för grafiskt ansvarig, på alla nyheter. */
export async function setNewsCover(newsId: number, mediaId: number | null) {
  const user = await requireUser();
  const db = getDb();
  const item = db.prepare("SELECT id, committee_id, title, cover_media_id FROM news WHERE id = ?").get(newsId) as
    | { id: number; committee_id: number | null; title: string; cover_media_id: number | null }
    | undefined;
  if (!item || !canEditImages(user, item) || !canUseImage(user, mediaId)) throw new Error("Saknar behörighet.");
  if (mediaId === item.cover_media_id) return;
  db.prepare("UPDATE news SET cover_media_id = ?, updated_at = ? WHERE id = ?").run(mediaId, nowIso(), newsId);
  await deleteMediaIfUnused(item.cover_media_id);
  audit(user.id, "cover", "news", newsId, item.title);
  revalidateSite();
}
