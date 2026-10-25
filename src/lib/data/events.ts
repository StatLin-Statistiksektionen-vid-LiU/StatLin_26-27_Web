import "server-only";
import { readDb } from "./db";
import { nowLocal } from "@/lib/dates";
import { MEDIA_JSON_COLUMNS, parseMediaJson, toImageRef } from "@/lib/media-url";
import type { EventImage, EventItem, Media } from "@/lib/types";

type Row = Omit<EventItem, "committee" | "cover"> & { committee_json: string | null; cover_json: string | null };

const SELECT = `
  SELECT e.*,
    CASE WHEN c.id IS NULL THEN NULL ELSE json_object(
      'id', c.id, 'slug', c.slug, 'name', c.name, 'short_name', c.short_name, 'logo_url', c.logo_url, 'accent', c.accent
    ) END AS committee_json,
    ${MEDIA_JSON_COLUMNS("m")} AS cover_json,
    (SELECT COUNT(*) FROM event_images ei WHERE ei.event_id = e.id) AS image_count
  FROM events e
  LEFT JOIN committees c ON c.id = e.committee_id
  LEFT JOIN media m ON m.id = e.cover_media_id`;

function map(r: Row): EventItem {
  const { committee_json, cover_json, ...rest } = r;
  return {
    ...rest,
    committee: committee_json ? JSON.parse(committee_json) : null,
    cover: toImageRef(parseMediaJson(cover_json)),
  };
}

/** Kommande = ej avslutade (pågående räknas som kommande). */
export async function listUpcomingEvents(limit = 50, committeeId?: number): Promise<EventItem[]> {
  const db = await readDb();
  const now = nowLocal();
  const rows = db
    .prepare(
      `${SELECT}
       WHERE e.published = 1 AND COALESCE(e.ends_at, substr(e.starts_at, 1, 10) || 'T23:59') >= @now
       ${committeeId ? "AND e.committee_id = @committeeId" : ""}
       ORDER BY e.starts_at ASC LIMIT @limit`,
    )
    .all({ now, limit, committeeId: committeeId ?? null }) as Row[];
  return rows.map(map);
}

export async function listPastEvents(limit = 24, committeeId?: number): Promise<EventItem[]> {
  const db = await readDb();
  const now = nowLocal();
  const rows = db
    .prepare(
      `${SELECT}
       WHERE e.published = 1 AND COALESCE(e.ends_at, substr(e.starts_at, 1, 10) || 'T23:59') < @now
       ${committeeId ? "AND e.committee_id = @committeeId" : ""}
       ORDER BY e.starts_at DESC LIMIT @limit`,
    )
    .all({ now, limit, committeeId: committeeId ?? null }) as Row[];
  return rows.map(map);
}

export async function listEventsBetween(fromDate: string, toDate: string): Promise<EventItem[]> {
  const db = await readDb();
  const rows = db
    .prepare(
      `${SELECT}
       WHERE e.published = 1 AND e.starts_at < @to AND COALESCE(e.ends_at, e.starts_at) >= @from
       ORDER BY e.starts_at ASC`,
    )
    .all({ from: fromDate, to: toDate }) as Row[];
  return rows.map(map);
}

export async function listAllPublishedEvents(): Promise<EventItem[]> {
  const db = await readDb();
  return (db.prepare(`${SELECT} WHERE e.published = 1 ORDER BY e.starts_at DESC`).all() as Row[]).map(map);
}

export async function getEventBySlug(slug: string, includeDrafts = false): Promise<EventItem | null> {
  const db = await readDb();
  const row = db
    .prepare(`${SELECT} WHERE e.slug = ? ${includeDrafts ? "" : "AND e.published = 1"}`)
    .get(slug) as Row | undefined;
  return row ? map(row) : null;
}

export async function getEventById(id: number): Promise<EventItem | null> {
  const db = await readDb();
  const row = db.prepare(`${SELECT} WHERE e.id = ?`).get(id) as Row | undefined;
  return row ? map(row) : null;
}

export async function listEventsForAdmin(committeeId: number | null): Promise<EventItem[]> {
  const db = await readDb();
  const rows = db
    .prepare(`${SELECT} ${committeeId ? "WHERE e.committee_id = ?" : ""} ORDER BY e.starts_at DESC`)
    .all(...(committeeId ? [committeeId] : [])) as Row[];
  return rows.map(map);
}

export async function listEventImages(eventId: number): Promise<EventImage[]> {
  const db = await readDb();
  const rows = db
    .prepare(
      `SELECT ei.id, ei.event_id, ei.caption, ei.sort_order, ${MEDIA_JSON_COLUMNS("m")} AS media_json
       FROM event_images ei JOIN media m ON m.id = ei.media_id
       WHERE ei.event_id = ? ORDER BY ei.sort_order, ei.id`,
    )
    .all(eventId) as (Omit<EventImage, "image"> & { media_json: string })[];
  return rows.flatMap(({ media_json, ...r }) => {
    const image = toImageRef(parseMediaJson(media_json));
    return image ? [{ ...r, image }] : [];
  });
}

export interface GalleryAlbum {
  event: EventItem;
  preview: EventImage["image"][];
}

export async function listGalleryAlbums(): Promise<GalleryAlbum[]> {
  const db = await readDb();
  const rows = db
    .prepare(
      `${SELECT} WHERE e.published = 1 AND EXISTS (SELECT 1 FROM event_images ei WHERE ei.event_id = e.id)
       ORDER BY e.starts_at DESC`,
    )
    .all() as Row[];
  const previewStmt = db.prepare(
    `SELECT m.* FROM event_images ei JOIN media m ON m.id = ei.media_id
     WHERE ei.event_id = ? ORDER BY ei.sort_order, ei.id LIMIT 4`,
  );
  return rows.map((r) => {
    const event = map(r);
    const preview = (previewStmt.all(event.id) as Media[]).map((m) => toImageRef(m)!).filter(Boolean);
    return { event, preview };
  });
}
