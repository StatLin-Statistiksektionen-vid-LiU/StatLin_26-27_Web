import "server-only";
import { readDb } from "./db";
import { isoUtc } from "@/lib/dates";
import { MEDIA_JSON_COLUMNS, parseMediaJson, toImageRef } from "@/lib/media-url";
import type { NewsItem } from "@/lib/types";

type Row = Omit<NewsItem, "committee" | "cover"> & { committee_json: string | null; cover_json: string | null };

const SELECT = `
  SELECT n.*, u.name AS author_name, u.post AS author_post,
    CASE WHEN c.id IS NULL THEN NULL ELSE json_object(
      'id', c.id, 'slug', c.slug, 'name', c.name, 'short_name', c.short_name, 'logo_url', c.logo_url, 'accent', c.accent
    ) END AS committee_json,
    ${MEDIA_JSON_COLUMNS("m")} AS cover_json
  FROM news n
  LEFT JOIN users u ON u.id = n.author_id
  LEFT JOIN committees c ON c.id = n.committee_id
  LEFT JOIN media m ON m.id = n.cover_media_id`;

function map(r: Row): NewsItem {
  const { committee_json, cover_json, ...rest } = r;
  return {
    ...rest,
    committee: committee_json ? JSON.parse(committee_json) : null,
    cover: toImageRef(parseMediaJson(cover_json)),
  };
}

export async function listNews(limit = 30, offset = 0): Promise<NewsItem[]> {
  const db = await readDb();
  const rows = db
    .prepare(
      `${SELECT} WHERE n.published = 1 AND n.published_at <= ?
       ORDER BY n.pinned DESC, n.published_at DESC LIMIT ? OFFSET ?`,
    )
    .all(isoUtc(), limit, offset) as Row[];
  return rows.map(map);
}

export async function countNews(): Promise<number> {
  const db = await readDb();
  return (db.prepare("SELECT COUNT(*) AS n FROM news WHERE published = 1 AND published_at <= ?").get(isoUtc()) as { n: number }).n;
}

export async function getNewsBySlug(slug: string, includeDrafts = false): Promise<NewsItem | null> {
  const db = await readDb();
  const row = (
    includeDrafts
      ? db.prepare(`${SELECT} WHERE n.slug = ?`).get(slug)
      : db.prepare(`${SELECT} WHERE n.slug = ? AND n.published = 1 AND n.published_at <= ?`).get(slug, isoUtc())
  ) as Row | undefined;
  return row ? map(row) : null;
}

export async function getNewsById(id: number): Promise<NewsItem | null> {
  const db = await readDb();
  const row = db.prepare(`${SELECT} WHERE n.id = ?`).get(id) as Row | undefined;
  return row ? map(row) : null;
}

export async function listNewsForAdmin(committeeId: number | null): Promise<NewsItem[]> {
  const db = await readDb();
  const rows = db
    .prepare(`${SELECT} ${committeeId ? "WHERE n.committee_id = ?" : ""} ORDER BY n.published_at DESC`)
    .all(...(committeeId ? [committeeId] : [])) as Row[];
  return rows.map(map);
}

export async function listNewsForCommittee(committeeId: number, limit = 6): Promise<NewsItem[]> {
  const db = await readDb();
  const rows = db
    .prepare(
      `${SELECT} WHERE n.published = 1 AND n.published_at <= ? AND n.committee_id = ?
       ORDER BY n.published_at DESC LIMIT ?`,
    )
    .all(isoUtc(), committeeId, limit) as Row[];
  return rows.map(map);
}
