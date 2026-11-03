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
  zLocalDateTime,
  zOptionalId,
  zOptionalLocalDateTime,
  zRequired,
  zText,
  zUrl,
} from "@/lib/admin/form";
import { audit, canUseImage, nowIso, revalidateSite, uniqueSlug } from "@/lib/admin/helpers";
import { canEditImages, canEditOwned, canReviewEvents, isEditor } from "@/lib/auth/permissions";
import { actionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { deleteMediaIfUnused } from "@/lib/media-store";
import type { SessionUser } from "@/lib/types";

const schema = z
  .object({
    title: zRequired(140, "Titeln"),
    slug: zText(90),
    summary: zText(300, "Sammanfattningen"),
    body_md: zText(20000, "Beskrivningen"),
    starts_at: zLocalDateTime("Starttid"),
    ends_at: zOptionalLocalDateTime,
    all_day: zCheckbox,
    location: zText(160, "Platsen"),
    location_url: zUrl,
    committee_id: zOptionalId,
    cover_media_id: zOptionalId,
    signup_url: zUrl,
    price: zText(80, "Priset"),
    published: zCheckbox,
  })
  .refine((d) => !d.ends_at || d.ends_at >= d.starts_at, { message: "Sluttiden måste vara efter starttiden.", path: ["ends_at"] });

const badCover: FormState = { error: "Omslagsbilden kan inte användas. Ladda upp en ny bild." };

type EventOwner = { id: number; committee_id: number | null; title: string; cover_media_id: number | null };

function loadEvent(id: number): EventOwner | undefined {
  return getDb().prepare("SELECT id, committee_id, title, cover_media_id FROM events WHERE id = ?").get(id) as EventOwner | undefined;
}

/** Utskottskonton får bara skapa/flytta evenemang till sitt eget utskott. */
function resolveCommittee(user: SessionUser, requested: number | null): number | null {
  if (isEditor(user)) return requested;
  return user.committee_id;
}

export async function saveEvent(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await actionUser();
  if ("error" in user) return user;
  const id = Number(fd.get("id")) || null;
  const parsed = schema.safeParse(formObject(fd));
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;
  // Det som publiceras syns för alla – ett evenemang med bara en rubrik (t.ex. efter ett Enter i rubriken) publiceras inte.
  if (d.published && !d.summary && !d.body_md) {
    return {
      error: "Skriv en kort sammanfattning eller en beskrivning innan evenemanget publiceras – eller spara det som utkast.",
      fieldErrors: { summary: "Fyll i en sammanfattning eller en beskrivning för att publicera." },
    };
  }
  const committeeId = resolveCommittee(user, d.committee_id);
  const db = getDb();

  if (id) {
    const existing = loadEvent(id);
    if (!existing) return { error: "Evenemanget finns inte längre." };
    if (!canEditOwned(user, existing)) return { error: "Du har inte behörighet att ändra det här evenemanget." };
    const slug = uniqueSlug("events", d.slug || d.title, id);
    // Omslaget kan också ha valts i galleriet efter att sidan laddades – rör det bara om fältet ändrats, och bara om
    // omslaget i databasen fortfarande är det som fältet laddades med.
    const coverMediaId = changedId(fd, "cover_media_id", d.cover_media_id, existing.cover_media_id);
    if (coverMediaId !== existing.cover_media_id && !canUseImage(user, coverMediaId, id)) return badCover;
    // Ändringar från andra än administratörer ska granskas på nytt.
    const uncheck = canReviewEvents(user) ? "" : ", checked_at=NULL, checked_by=NULL";
    // Bara om evenemanget inte sparats sedan formuläret laddades – annars skrev en gammal flik över en nyare version.
    const res = db.prepare(
      `UPDATE events SET title=@title, slug=@slug, summary=@summary, body_md=@body_md, starts_at=@starts_at, ends_at=@ends_at,
        all_day=@all_day, location=@location, location_url=@location_url, committee_id=@committee_id, cover_media_id=@cover_media_id,
        signup_url=@signup_url, price=@price, published=@published, updated_at=@updated_at${uncheck} WHERE id=@id AND updated_at=@version`,
    ).run({ ...d, slug, committee_id: committeeId, cover_media_id: coverMediaId, updated_at: nowIso(), id, version: formVersion(fd) });
    if (res.changes === 0) return STALE;
    if (existing.cover_media_id !== coverMediaId) await deleteMediaIfUnused(existing.cover_media_id);
    audit(user.id, "update", "event", id, d.title);
    revalidateSite();
    return { ok: true, message: d.published ? "Sparat och publicerat." : "Sparat som utkast." };
  }

  if (!isEditor(user) && !user.committee_id) return { error: "Ditt konto är inte kopplat till något utskott." };
  if (!canUseImage(user, d.cover_media_id)) return badCover;
  const slug = uniqueSlug("events", d.slug || d.title);
  // Det en administratör skapar räknas som granskat direkt.
  const reviewed = canReviewEvents(user);
  const res = db
    .prepare(
      `INSERT INTO events (title, slug, summary, body_md, starts_at, ends_at, all_day, location, location_url, committee_id,
        cover_media_id, signup_url, price, published, created_by, checked_at, checked_by)
       VALUES (@title, @slug, @summary, @body_md, @starts_at, @ends_at, @all_day, @location, @location_url, @committee_id,
        @cover_media_id, @signup_url, @price, @published, @created_by, @checked_at, @checked_by)`,
    )
    .run({
      ...d,
      slug,
      committee_id: committeeId,
      created_by: user.id,
      checked_at: reviewed ? nowIso() : null,
      checked_by: reviewed ? user.id : null,
    });
  audit(user.id, "create", "event", Number(res.lastInsertRowid), d.title);
  revalidateSite();
  redirect(`/admin/evenemang/${res.lastInsertRowid}?skapad=1`);
}

export async function deleteEvent(fd: FormData) {
  const user = await actionUser();
  if ("error" in user) return;
  const id = Number(fd.get("id"));
  const existing = loadEvent(id);
  if (!existing || !canEditOwned(user, existing)) redirect("/admin/evenemang");
  const db = getDb();
  const media = db
    .prepare("SELECT media_id FROM event_images WHERE event_id = ? UNION SELECT cover_media_id FROM events WHERE id = ?")
    .all(id, id) as { media_id: number | null }[];
  db.prepare("DELETE FROM events WHERE id = ?").run(id);
  for (const m of media) await deleteMediaIfUnused(m.media_id);
  audit(user.id, "delete", "event", id, existing.title);
  revalidateSite();
  redirect("/admin/evenemang?raderad=1");
}

/** Administratörernas granskningsbock. Rör aldrig om evenemanget är publicerat. */
export async function setEventChecked(fd: FormData) {
  const user = await actionUser();
  if ("error" in user) return;
  const id = Number(fd.get("id"));
  const existing = loadEvent(id);
  if (!existing || !canReviewEvents(user)) redirect("/admin/evenemang");
  const checked = fd.get("checked") === "1";
  getDb()
    .prepare("UPDATE events SET checked_at = ?, checked_by = ? WHERE id = ?")
    .run(checked ? nowIso() : null, checked ? user.id : null, id);
  audit(user.id, checked ? "check" : "uncheck", "event", id, existing.title);
  revalidateSite();
}

/* ---------- Galleri och omslag (även grafiskt ansvarig, på alla evenemang) ---------- */

/** null när sessionen saknas – då görs ingenting. */
async function authorizeImage(imageId: number) {
  const user = await actionUser();
  if ("error" in user) return null;
  const row = getDb()
    .prepare("SELECT ei.id, ei.event_id, ei.media_id, e.committee_id FROM event_images ei JOIN events e ON e.id = ei.event_id WHERE ei.id = ?")
    .get(imageId) as { id: number; event_id: number; media_id: number; committee_id: number | null } | undefined;
  if (!row || !canEditImages(user, row)) throw new Error("Saknar behörighet.");
  return { user, row };
}

export async function updateImageCaption(imageId: number, caption: string) {
  if (!(await authorizeImage(imageId))) return;
  getDb().prepare("UPDATE event_images SET caption = ? WHERE id = ?").run(caption.trim().slice(0, 300), imageId);
  revalidateSite();
}

export async function deleteEventImage(imageId: number) {
  const auth = await authorizeImage(imageId);
  if (!auth) return;
  const { user, row } = auth;
  const db = getDb();
  db.prepare("DELETE FROM event_images WHERE id = ?").run(imageId);
  db.prepare("UPDATE events SET cover_media_id = NULL WHERE id = ? AND cover_media_id = ?").run(row.event_id, row.media_id);
  await deleteMediaIfUnused(row.media_id);
  audit(user.id, "delete", "event_image", imageId, loadEvent(row.event_id)?.title ?? "");
  revalidateSite();
}

export async function reorderEventImages(eventId: number, imageIds: number[]) {
  const user = await actionUser();
  if ("error" in user) return;
  const event = loadEvent(eventId);
  if (!event || !canEditImages(user, event)) throw new Error("Saknar behörighet.");
  const db = getDb();
  const stmt = db.prepare("UPDATE event_images SET sort_order = ? WHERE id = ? AND event_id = ?");
  db.transaction(() => imageIds.forEach((imgId, i) => stmt.run(i, imgId, eventId)))();
  revalidateSite();
}

/** Från stjärnan i galleriet och från sidan Bilder. Ett nytt omslag ska granskas på nytt, precis som andra ändringar. */
export async function setEventCover(eventId: number, mediaId: number | null) {
  const user = await actionUser();
  if ("error" in user) return;
  const event = loadEvent(eventId);
  if (!event || !canEditImages(user, event) || !canUseImage(user, mediaId, eventId)) throw new Error("Saknar behörighet.");
  if (mediaId === event.cover_media_id) return;
  const uncheck = canReviewEvents(user) ? "" : ", checked_at=NULL, checked_by=NULL";
  // updated_at skrivs inte: stjärnan ligger på samma sida som evenemangets formulär, som skriver omslaget bara via
  // changedId. Versionen tillhör formulärets egen sparning – annars laddades formuläret om och osparad text försvann (SD-06).
  getDb().prepare(`UPDATE events SET cover_media_id = ?${uncheck} WHERE id = ?`).run(mediaId, eventId);
  await deleteMediaIfUnused(event.cover_media_id);
  audit(user.id, "cover", "event", eventId, event.title);
  revalidateSite();
}
