import "server-only";
import { fileHref, MEDIA_JSON_COLUMNS, parseMediaJson, variantWidths } from "@/lib/media-url";
import type { ResourceItem } from "@/lib/types";
import { readDb } from "./db";

type ResourceRow = Omit<ResourceItem, "file"> & { media_json: string | null };

const SELECT = `SELECT r.*, ${MEDIA_JSON_COLUMNS("m")} AS media_json FROM resources r LEFT JOIN media m ON m.id = r.media_id`;

function toItem({ media_json, ...r }: ResourceRow): ResourceItem {
  const m = parseMediaJson(media_json);
  if (!m) return { ...r, file: null };
  // Bilder sparas i flera bredder. Den som öppnar en fusklapp vill kunna läsa den, så länken går till den största.
  const href = m.kind === "image" ? `/media/${m.path_base}-${variantWidths(m).at(-1)}.webp` : fileHref(m);
  return { ...r, file: { href, size: m.size, ext: m.ext, image: m.kind === "image" } };
}

/** Senast tillagda först. Den publika sidan grupperar dem själv, se groupResources. */
export async function listResources(): Promise<ResourceItem[]> {
  const db = await readDb();
  return (db.prepare(`${SELECT} ORDER BY r.created_at DESC, r.id DESC`).all() as ResourceRow[]).map(toItem);
}

export async function getResource(id: number): Promise<ResourceItem | null> {
  const db = await readDb();
  const row = db.prepare(`${SELECT} WHERE r.id = ?`).get(id) as ResourceRow | undefined;
  return row ? toItem(row) : null;
}
