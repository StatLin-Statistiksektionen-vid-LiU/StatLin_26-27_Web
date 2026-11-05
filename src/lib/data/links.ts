import "server-only";
import { readDb } from "./db";
import type { LinkItem } from "@/lib/types";

type LinkRow = Omit<LinkItem, "featured" | "active"> & { featured: number; active: number };
const mapLink = (r: LinkRow): LinkItem => ({ ...r, featured: Boolean(r.featured), active: Boolean(r.active) });

export async function listLinks(opts: { activeOnly?: boolean } = {}): Promise<LinkItem[]> {
  const db = await readDb();
  const rows = db.prepare(`SELECT * FROM links ${opts.activeOnly ? "WHERE active = 1" : ""} ORDER BY sort_order, label`).all() as LinkRow[];
  return rows.map(mapLink);
}

export async function listFeaturedLinks(): Promise<LinkItem[]> {
  const db = await readDb();
  const rows = db.prepare("SELECT * FROM links WHERE active = 1 AND featured = 1 ORDER BY sort_order, label LIMIT 8").all() as LinkRow[];
  return rows.map(mapLink);
}

export async function getLink(id: number): Promise<LinkItem | null> {
  const db = await readDb();
  const row = db.prepare("SELECT * FROM links WHERE id = ?").get(id) as LinkRow | undefined;
  return row ? mapLink(row) : null;
}
