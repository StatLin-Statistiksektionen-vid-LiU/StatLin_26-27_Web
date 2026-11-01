import "server-only";
import { readDb } from "./db";
import type { LinkItem } from "@/lib/types";

export async function listLinks(opts: { activeOnly?: boolean } = {}): Promise<LinkItem[]> {
  const db = await readDb();
  return db.prepare(`SELECT * FROM links ${opts.activeOnly ? "WHERE active = 1" : ""} ORDER BY sort_order, label`).all() as LinkItem[];
}

export async function listFeaturedLinks(): Promise<LinkItem[]> {
  const db = await readDb();
  return db.prepare("SELECT * FROM links WHERE active = 1 AND featured = 1 ORDER BY sort_order, label LIMIT 8").all() as LinkItem[];
}

export async function getLink(id: number): Promise<LinkItem | null> {
  const db = await readDb();
  return (db.prepare("SELECT * FROM links WHERE id = ?").get(id) as LinkItem) ?? null;
}
