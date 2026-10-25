"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  type FormState,
  formObject,
  invalid,
  zCheckbox,
  zLocalDateTime,
  zOptionalId,
  zOptionalLocalDateTime,
  zRequired,
  zText,
  zUrl,
} from "@/lib/admin/form";
import { audit, canUseImage, nowIso, revalidateSite, uniqueSlug } from "@/lib/admin/helpers";
import { canEditOwned, isEditor } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
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
  const user = await requireUser();
  const id = Number(fd.get("id")) || null;
  const parsed = schema.safeParse(formObject(fd));
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;
  const committeeId = resolveCommittee(user, d.committee_id);
  const db = getDb();

  if (id) {
    const existing = loadEvent(id);
    if (!existing) return { error: "Evenemanget finns inte längre." };
    if (!canEditOwned(user, existing)) return { error: "Du har inte behörighet att ändra det här evenemanget." };
    const slug = uniqueSlug("events", d.slug || d.title, id);
    // Omslaget kan också ha valts i galleriet efter att sidan laddades – rör det bara om fältet ändrats.
    const coverMediaId = fd.get("cover_media_id__changed") === "1" ? d.cover_media_id : existing.cover_media_id;
    if (coverMediaId !== existing.cover_media_id && !canUseImage(user, coverMediaId, id)) return badCover;
    db.prepare(
      `UPDATE events SET title=@title, slug=@slug, summary=@summary, body_md=@body_md, starts_at=@starts_at, ends_at=@ends_at,
        all_day=@all_day, location=@location, location_url=@location_url, committee_id=@committee_id, cover_media_id=@cover_media_id,
        signup_url=@signup_url, price=@price, published=@published, updated_at=@updated_at WHERE id=@id`,
    ).run({ ...d, slug, committee_id: committeeId, cover_media_id: coverMediaId, updated_at: nowIso(), id });
    if (existing.cover_media_id !== coverMediaId) await deleteMediaIfUnused(existing.cover_media_id);
    audit(user.id, "update", "event", id, d.title);
    revalidateSite();
    return { ok: true, message: d.published ? "Sparat och publicerat." : "Sparat som utkast." };
  }

  if (!isEditor(user) && !user.committee_id) return { error: "Ditt konto är inte kopplat till något utskott." };
  if (!canUseImage(user, d.cover_media_id)) return badCover;
  const slug = uniqueSlug("events", d.slug || d.title);
  const res = db
    .prepare(
      `INSERT INTO events (title, slug, summary, body_md, starts_at, ends_at, all_day, location, location_url, committee_id,
        cover_media_id, signup_url, price, published, created_by)
       VALUES (@title, @slug, @summary, @body_md, @starts_at, @ends_at, @all_day, @location, @location_url, @committee_id,
        @cover_media_id, @signup_url, @price, @published, @created_by)`,
    )
    .run({ ...d, slug, committee_id: committeeId, created_by: user.id });
  audit(user.id, "create", "event", Number(res.lastInsertRowid), d.title);
  revalidateSite();
  redirect(`/admin/evenemang/${res.lastInsertRowid}?skapad=1`);
}

export async function deleteEvent(fd: FormData) {
  const user = await requireUser();
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

/* ---------- Galleri ---------- */

async function authorizeImage(imageId: number) {
  const user = await requireUser();
  const row = getDb()
    .prepare("SELECT ei.id, ei.event_id, ei.media_id, e.committee_id FROM event_images ei JOIN events e ON e.id = ei.event_id WHERE ei.id = ?")
    .get(imageId) as { id: number; event_id: number; media_id: number; committee_id: number | null } | undefined;
  if (!row || !canEditOwned(user, row)) throw new Error("Saknar behörighet.");
  return { user, row };
}

export async function updateImageCaption(imageId: number, caption: string) {
  await authorizeImage(imageId);
  getDb().prepare("UPDATE event_images SET caption = ? WHERE id = ?").run(caption.trim().slice(0, 300), imageId);
  revalidateSite();
}

export async function deleteEventImage(imageId: number) {
  const { user, row } = await authorizeImage(imageId);
  const db = getDb();
  db.prepare("DELETE FROM event_images WHERE id = ?").run(imageId);
  db.prepare("UPDATE events SET cover_media_id = NULL WHERE id = ? AND cover_media_id = ?").run(row.event_id, row.media_id);
  await deleteMediaIfUnused(row.media_id);
  audit(user.id, "delete", "event_image", imageId, loadEvent(row.event_id)?.title ?? "");
  revalidateSite();
}

export async function reorderEventImages(eventId: number, imageIds: number[]) {
  const user = await requireUser();
  const event = loadEvent(eventId);
  if (!event || !canEditOwned(user, event)) throw new Error("Saknar behörighet.");
  const db = getDb();
  const stmt = db.prepare("UPDATE event_images SET sort_order = ? WHERE id = ? AND event_id = ?");
  db.transaction(() => imageIds.forEach((imgId, i) => stmt.run(i, imgId, eventId)))();
  revalidateSite();
}

export async function setEventCover(eventId: number, mediaId: number | null) {
  const user = await requireUser();
  const event = loadEvent(eventId);
  if (!event || !canEditOwned(user, event) || !canUseImage(user, mediaId, eventId)) throw new Error("Saknar behörighet.");
  getDb().prepare("UPDATE events SET cover_media_id = ?, updated_at = ? WHERE id = ?").run(mediaId, nowIso(), eventId);
  revalidateSite();
}
