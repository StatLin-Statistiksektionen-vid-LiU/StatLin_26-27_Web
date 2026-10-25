import "server-only";
import { revalidatePath } from "next/cache";
import { isEditor } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db";
import type { SessionUser } from "@/lib/types";
import { slugify } from "@/lib/utils";

export function audit(userId: number, action: string, entity: string, entityId: string | number | null, summary = "") {
  getDb()
    .prepare("INSERT INTO audit_log (user_id, action, entity, entity_id, summary) VALUES (?, ?, ?, ?, ?)")
    .run(userId, action, entity, entityId === null ? null : String(entityId), summary.slice(0, 300));
}

/**
 * Får användaren välja bilden som omslag? Bilden måste finnas. Utskottskonton får bara välja bilder
 * de själva laddat upp eller som ligger i evenemangets galleri – annars kunde de koppla och sedan
 * radera andras bilder (de raderas när omslaget byts eller inlägget tas bort).
 */
export function canUseImage(user: SessionUser, mediaId: number | null, eventId?: number): boolean {
  if (mediaId === null) return true;
  const db = getDb();
  const m = db.prepare("SELECT kind, uploaded_by FROM media WHERE id = ?").get(mediaId) as { kind: string; uploaded_by: number | null } | undefined;
  if (!m || m.kind !== "image") return false;
  if (isEditor(user) || m.uploaded_by === user.id) return true;
  return eventId !== undefined && !!db.prepare("SELECT 1 FROM event_images WHERE event_id = ? AND media_id = ?").get(eventId, mediaId);
}

/** Unik slug i tabellen (lägger till -2, -3 … vid krock). */
export function uniqueSlug(table: "events" | "news" | "committees", input: string, excludeId?: number): string {
  const base = slugify(input) || "inlagg";
  const db = getDb();
  const exists = db.prepare(`SELECT 1 FROM ${table} WHERE slug = ? AND id != ?`);
  let slug = base;
  let n = 2;
  while (exists.get(slug, excludeId ?? -1)) slug = `${base}-${n++}`;
  return slug;
}

/** Innehållet visas dynamiskt – töm routerns cache så att ändringen syns överallt direkt. */
export function revalidateSite() {
  revalidatePath("/", "layout");
}

export function nowIso() {
  return new Date().toISOString();
}
