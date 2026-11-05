import "server-only";
import type Database from "better-sqlite3";
import { todayLocal } from "@/lib/dates";
import type { PublicBox } from "@/lib/fragelada";
import { readDb } from "./db";

export const FRAGELADA_SETTING = "fragelada_oppen";

/** Avstängd tills en administratör slår på den (U-04). Saknas inställningen är lådan stängd. */
export function frageladaIsOpen(db: Database.Database): boolean {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(FRAGELADA_SETTING) as { value: string } | undefined;
  return row?.value === "1";
}

/** Lådan om den tar emot frågor just nu: funktionen är på, och lådan har en aktiv ägare och är inte stängd. Annars null. */
export function findOpenBox(db: Database.Database, by: { code: string } | { slug: string }): (PublicBox & { id: number }) | null {
  if (!frageladaIsOpen(db)) return null;
  const column = "code" in by ? "b.code" : "b.slug";
  const value = "code" in by ? by.code : by.slug;
  const row = db
    .prepare(
      `SELECT b.id, b.slug, b.code, b.title, b.description
       FROM question_boxes b JOIN users u ON u.id = b.owner_id AND u.active = 1
       WHERE ${column} = ? AND b.closed = 0 AND (b.closes_on IS NULL OR b.closes_on >= ?)`,
    )
    .get(value, todayLocal()) as (PublicBox & { id: number }) | undefined;
  return row ?? null;
}

/** Fasta lådor som går att skriva till nu. Tom lista när funktionen är avstängd. */
export async function listOpenFixedBoxes(): Promise<PublicBox[]> {
  const db = await readDb();
  return ["ubu", "amo"].map((slug) => findOpenBox(db, { slug })).filter((b): b is PublicBox & { id: number } => b !== null);
}

export type OwnBox = {
  id: number;
  slug: string | null;
  code: string | null;
  title: string;
  description: string;
  owner_id: number | null;
  closes_on: string | null;
  closed: number;
  updated_at: string;
  total: number;
  unseen: number;
  unhandled: number;
};

const COUNTS = `
  (SELECT COUNT(*) FROM box_questions q WHERE q.box_id = b.id) AS total,
  (SELECT COUNT(*) FROM box_questions q WHERE q.box_id = b.id AND q.seen = 0) AS unseen,
  (SELECT COUNT(*) FROM box_questions q WHERE q.box_id = b.id AND q.handled = 0) AS unhandled`;

export async function listOwnBoxes(userId: number): Promise<OwnBox[]> {
  const db = await readDb();
  return db.prepare(`SELECT b.*, ${COUNTS} FROM question_boxes b WHERE b.owner_id = ? ORDER BY b.slug IS NULL, b.created_at DESC`).all(userId) as OwnBox[];
}

/** Lådan, bara för kontot som äger den. Alla andra får null, administratörer också. */
export async function getOwnBox(id: number, userId: number): Promise<OwnBox | null> {
  const db = await readDb();
  return (db.prepare(`SELECT b.*, ${COUNTS} FROM question_boxes b WHERE b.id = ? AND b.owner_id = ?`).get(id, userId) as OwnBox | undefined) ?? null;
}

export type BoxQuestion = { id: number; body: string; month: string; seen: number; handled: number };

/** Frågorna i kontots egen låda. Ägaren står i själva frågan, så att ingen annan väg kan läsa dem. */
export async function listOwnQuestions(boxId: number, userId: number): Promise<BoxQuestion[]> {
  const db = await readDb();
  return db
    .prepare(
      `SELECT q.id, q.body, q.month, q.seen, q.handled
       FROM box_questions q JOIN question_boxes b ON b.id = q.box_id
       WHERE q.box_id = ? AND b.owner_id = ?
       ORDER BY q.handled, q.month DESC, q.id`,
    )
    .all(boxId, userId) as BoxQuestion[];
}

export async function countUnseenQuestions(userId: number): Promise<number> {
  const db = await readDb();
  const row = db
    .prepare("SELECT COUNT(*) AS n FROM box_questions q JOIN question_boxes b ON b.id = q.box_id WHERE b.owner_id = ? AND q.seen = 0")
    .get(userId) as { n: number };
  return row.n;
}

/** Administratörens vy: titlar, ägare och antal. Inga frågor och inga koder. */
export type BoxOverview = { id: number; slug: string | null; title: string; owner_id: number | null; owner_label: string | null; total: number };

export async function listBoxOverview(): Promise<BoxOverview[]> {
  const db = await readDb();
  return db
    .prepare(
      `SELECT b.id, b.slug, b.title, b.owner_id, COALESCE(NULLIF(u.post, ''), u.name) AS owner_label,
         (SELECT COUNT(*) FROM box_questions q WHERE q.box_id = b.id) AS total
       FROM question_boxes b LEFT JOIN users u ON u.id = b.owner_id
       ORDER BY b.slug IS NULL, b.created_at DESC`,
    )
    .all() as BoxOverview[];
}

/** Konton som kan äga en fast låda. */
export async function listBoxOwnerCandidates(): Promise<{ id: number; label: string }[]> {
  const db = await readDb();
  return db.prepare("SELECT id, COALESCE(NULLIF(post, ''), name) AS label FROM users WHERE active = 1 ORDER BY label").all() as { id: number; label: string }[];
}

/** Lådans läge i ord, för ägarens lista och lådans sida. */
export function boxStateLabel(box: Pick<OwnBox, "slug" | "closed" | "closes_on">, today: string): { open: boolean; label: string } {
  if (box.slug !== null) return { open: true, label: "Fast låda" };
  if (box.closed) return { open: false, label: "Stängd" };
  if (box.closes_on && box.closes_on < today) return { open: false, label: "Stängningsdatumet har passerat" };
  return { open: true, label: box.closes_on ? `Öppen till ${box.closes_on}` : "Öppen" };
}
