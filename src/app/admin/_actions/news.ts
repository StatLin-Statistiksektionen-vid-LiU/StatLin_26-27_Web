"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  changedId,
  type FormState,
  formObject,
  formVersion,
  invalid,
  STALE,
  zCheckbox,
  zOptionalId,
  zOptionalLocalDateTime,
  zRequired,
  zText,
} from "@/lib/admin/form";
import { audit, canUseImage, nowIso, revalidateSite, uniqueSlug } from "@/lib/admin/helpers";
import { TEXT_LIMITS } from "@/lib/admin/limits";
import { canEditImages, canEditOwned, isEditor } from "@/lib/auth/permissions";
import { actionUser, renewSessionIfDue } from "@/lib/auth/session";
import { isoToLocal, localToIso } from "@/lib/dates";
import { getDb } from "@/lib/db";
import { deleteMediaIfUnused } from "@/lib/media-store";

const schema = z.object({
  title: zRequired(160, "Rubriken"),
  slug: zText(90),
  excerpt: zText(320, "Ingressen"),
  body_md: zText(TEXT_LIMITS.news, "Texten"),
  committee_id: zOptionalId,
  cover_media_id: zOptionalId,
  published: zCheckbox,
  pinned: zCheckbox,
  published_at: zOptionalLocalDateTime("Publiceringsdatumet"),
});

const badCover: FormState = { error: "Omslagsbilden kan inte användas. Ladda upp en ny bild." };

/**
 * Publiceringsdatumet när en befintlig nyhet sparas (SB-33). Fältet har bara minuter och den sparade tiden sekunder, så de
 * jämförs i fältets form. En vanlig sparning av en publicerad nyhet ändrar inte datumet, och den flyttar den inte heller
 * upp i listan. Ett utkast som publiceras får dagens datum, om det inte är schemalagt eller om ett annat datum valts.
 */
function nextPublishedAt(existing: { published: number; published_at: string }, d: { published: number; published_at: string | null }): string {
  const stored = existing.published_at;
  const scheduled = Date.parse(stored) > Date.now();
  if (d.published_at && d.published_at !== isoToLocal(stored)) return localToIso(d.published_at);
  if (d.published_at && scheduled) return stored;
  if (d.published && !existing.published) return nowIso();
  // Ett tömt fält tar bort schemaläggningen.
  return !d.published_at && scheduled ? nowIso() : stored;
}

export async function saveNews(_prev: FormState, fd: FormData): Promise<FormState> {
  // Sessionen förlängs först när sparningen gått igenom (renewSessionIfDue nedan): kakan renderar om sidan.
  const user = await actionUser({ renew: false });
  if ("error" in user) return user;
  const id = Number(fd.get("id")) || null;
  const parsed = schema.safeParse(formObject(fd));
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;
  // Det som publiceras syns för alla – en nyhet med bara en rubrik (t.ex. efter ett Enter i rubriken) publiceras inte.
  if (d.published && !d.excerpt && !d.body_md) {
    return {
      error: "Skriv en ingress eller en text innan nyheten publiceras – eller spara den som utkast.",
      fieldErrors: { excerpt: "Fyll i en ingress eller en text för att publicera." },
    };
  }
  const committeeId = isEditor(user) ? d.committee_id : user.committee_id;
  const pinned = isEditor(user) ? d.pinned : 0;
  const db = getDb();

  if (id) {
    const existing = db.prepare("SELECT id, committee_id, pinned, cover_media_id, published, published_at FROM news WHERE id = ?").get(id) as
      | { id: number; committee_id: number | null; pinned: number; cover_media_id: number | null; published: number; published_at: string }
      | undefined;
    if (!existing) return { error: "Nyheten finns inte längre." };
    if (!canEditOwned(user, existing)) return { error: "Du har inte behörighet att ändra den här nyheten." };
    // Omslaget kan också ha bytts på sidan Bilder eller i redigeringsläget efter att sidan laddades – rör det bara om fältet
    // ändrats, och bara om omslaget i databasen fortfarande är det som fältet laddades med.
    const coverMediaId = changedId(fd, "cover_media_id", d.cover_media_id, existing.cover_media_id);
    if (coverMediaId === undefined) return STALE;
    if (coverMediaId !== existing.cover_media_id && !canUseImage(user, coverMediaId)) return badCover;
    const slug = uniqueSlug("news", d.slug || d.title, id);
    // Bara om nyheten inte sparats sedan formuläret laddades – annars skrev en gammal flik över en nyare version.
    const updatedAt = nowIso();
    const res = db.prepare(
      `UPDATE news SET title=@title, slug=@slug, excerpt=@excerpt, body_md=@body_md, committee_id=@committee_id,
        cover_media_id=@cover_media_id, published=@published, pinned=@pinned, published_at=@published_at, updated_at=@updated_at
       WHERE id=@id AND updated_at=@version`,
    ).run({
      ...d,
      slug,
      committee_id: committeeId,
      cover_media_id: coverMediaId,
      pinned: isEditor(user) ? pinned : existing.pinned,
      published_at: nextPublishedAt(existing, d),
      updated_at: updatedAt,
      id,
      version: formVersion(fd),
    });
    if (res.changes === 0) return STALE;
    if (existing.cover_media_id !== coverMediaId) await deleteMediaIfUnused(existing.cover_media_id);
    audit(user.id, "update", "news", id, d.title);
    await renewSessionIfDue();
    revalidateSite();
    return { ok: true, message: d.published ? "Sparat och publicerat." : "Sparat som utkast.", data: { updated_at: updatedAt } };
  }

  if (!isEditor(user) && !user.committee_id) return { error: "Ditt konto är inte kopplat till något utskott." };
  if (!canUseImage(user, d.cover_media_id)) return badCover;
  const slug = uniqueSlug("news", d.slug || d.title);
  const res = db
    .prepare(
      `INSERT INTO news (title, slug, excerpt, body_md, committee_id, cover_media_id, published, pinned, published_at, author_id)
       VALUES (@title, @slug, @excerpt, @body_md, @committee_id, @cover_media_id, @published, @pinned, @published_at, @author_id)`,
    )
    .run({ ...d, slug, committee_id: committeeId, pinned, published_at: d.published_at ? localToIso(d.published_at) : nowIso(), author_id: user.id });
  audit(user.id, "create", "news", Number(res.lastInsertRowid), d.title);
  await renewSessionIfDue();
  revalidateSite();
  redirect(`/admin/nyheter/${res.lastInsertRowid}?skapad=1`);
}

export async function deleteNews(fd: FormData) {
  const user = await actionUser();
  if ("error" in user) return;
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
  const user = await actionUser();
  // Felet går tillbaka till omslagsfältet, som annars visade "Sparat" fast inget sparats.
  if ("error" in user) return user;
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
