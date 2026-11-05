import "server-only";
import { readDb } from "./db";
import { isEditor } from "@/lib/auth/permissions";
import { getDb } from "@/lib/db";
import { MEDIA_JSON_COLUMNS, parseMediaJson, toImageRef } from "@/lib/media-url";
import { PUBLIC_WISH_STATUSES, type LectureWish, type StarCompany } from "@/lib/naringsliv";
import type { StarIntresse } from "@/lib/star-intresse";
import type { SessionUser } from "@/lib/types";

/** STAR och lunchföreläsningarna: administratörer, redaktörer och kontot som hör till SASU. */
export function canManageNaringsliv(user: Pick<SessionUser, "role" | "committee_id">): boolean {
  if (isEditor(user)) return true;
  if (user.role !== "committee" || user.committee_id === null) return false;
  const sasu = getDb().prepare("SELECT id FROM committees WHERE slug = 'sasu'").get() as { id: number } | undefined;
  return sasu?.id === user.committee_id;
}

/* ---------- STAR-företagen ---------- */

type CompanyRow = Omit<StarCompany, "logo"> & { logo_json: string | null };

export async function listStarCompanies(opts: { activeOnly?: boolean } = {}): Promise<StarCompany[]> {
  const db = await readDb();
  const rows = db
    .prepare(
      `SELECT c.*, ${MEDIA_JSON_COLUMNS("m")} AS logo_json
       FROM star_companies c LEFT JOIN media m ON m.id = c.logo_media_id
       ${opts.activeOnly ? "WHERE c.active = 1" : ""}
       ORDER BY CASE c.role WHEN 'huvudsponsor' THEN 0 WHEN 'sponsor' THEN 1 ELSE 2 END, c.sort_order, c.name`,
    )
    .all() as CompanyRow[];
  return rows.map(({ logo_json, ...c }) => ({ ...c, logo: toImageRef(parseMediaJson(logo_json)) }));
}

/* ---------- Lunchönskemålen ---------- */

const WISH_SELECT = `SELECT w.*, e.slug AS event_slug, e.title AS event_title
  FROM lecture_wishes w LEFT JOIN events e ON e.id = w.event_id AND e.published = 1`;

/** Det som syns på sajten, flest stjärnor först. Vid lika ligger det äldsta överst, så att ordningen inte hoppar. */
export async function listPublicWishes(): Promise<LectureWish[]> {
  const db = await readDb();
  const statuses = PUBLIC_WISH_STATUSES.map((s) => `'${s}'`).join(",");
  return db.prepare(`${WISH_SELECT} WHERE w.status IN (${statuses}) ORDER BY w.votes DESC, w.id ASC`).all() as LectureWish[];
}

export async function listWishesForAdmin(): Promise<LectureWish[]> {
  const db = await readDb();
  return db.prepare(`${WISH_SELECT} ORDER BY w.id DESC`).all() as LectureWish[];
}

export async function countNewInterest(): Promise<number> {
  const db = await readDb();
  return (db.prepare("SELECT COUNT(*) AS n FROM star_intresse WHERE status = 'ny'").get() as { n: number }).n;
}

export async function listStarInterest(): Promise<StarIntresse[]> {
  const db = await readDb();
  const rows = db.prepare("SELECT * FROM star_intresse ORDER BY created_at DESC, id DESC").all() as (Omit<StarIntresse, "vill_boka_mote"> & { vill_boka_mote: number })[];
  return rows.map((r) => ({ ...r, vill_boka_mote: r.vill_boka_mote === 1 }));
}

/** Koden i inbjudningslänken. Läses för sig och inte via getSettings, så att den inte kan följa med inställningarna någonstans. */
export async function getStarInviteCode(): Promise<string> {
  const db = await readDb();
  const row = db.prepare("SELECT value FROM settings WHERE key = 'star_inbjudan_kod'").get() as { value: string } | undefined;
  return row?.value ?? "";
}

export async function countNewWishes(): Promise<number> {
  const db = await readDb();
  return (db.prepare("SELECT COUNT(*) AS n FROM lecture_wishes WHERE status = 'ny'").get() as { n: number }).n;
}
