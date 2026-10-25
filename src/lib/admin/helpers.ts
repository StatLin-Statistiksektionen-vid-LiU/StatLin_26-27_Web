import "server-only";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { slugify } from "@/lib/utils";

export function audit(userId: number, action: string, entity: string, entityId: string | number | null, summary = "") {
  getDb()
    .prepare("INSERT INTO audit_log (user_id, action, entity, entity_id, summary) VALUES (?, ?, ?, ?, ?)")
    .run(userId, action, entity, entityId === null ? null : String(entityId), summary.slice(0, 300));
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
