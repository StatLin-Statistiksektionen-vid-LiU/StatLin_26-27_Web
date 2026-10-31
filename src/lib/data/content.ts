import "server-only";
import { readDb } from "./db";
import { fileHref, MEDIA_JSON_COLUMNS, parseMediaJson, toImageRef } from "@/lib/media-url";
import type { BoardMember, Committee, DocumentItem, Page, Partner, SiteSettings } from "@/lib/types";

/* ---------- Inställningar ---------- */

export const DEFAULT_SETTINGS: SiteSettings = {
  contact_email: "styrelsen@statlin.se",
  instagram: "",
  facebook: "",
  linkedin: "",
  address: "Linköpings universitet, Campus Valla, 581 83 Linköping",
  sektionsrum: "",
  org_number: "",
  tagline: "Sektionen för dig som läser statistik och dataanalys eller Statistics and Machine Learning vid Linköpings universitet.",
  hero_kicker: "Statistiksektionen i Linköping",
  hero_title: "Sektionen för *statistik*, dataanalys och maskininlärning vid LiU",
  hero_text: "Sittningar, pubar, idrott, studiebevakning och kontakt med arbetslivet – drivet av studenter, för studenter.",
  home_intro: "Vi är statistikstudenternas sektion i Linköping. Här möts *gemenskap*, *utbildning* och vägen ut i *arbetslivet*.",
  announcement: "",
  announcement_url: "",
};

export async function getSettings(): Promise<SiteSettings> {
  const db = await readDb();
  const rows = db.prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const s = { ...DEFAULT_SETTINGS };
  for (const r of rows) if (r.key in s) (s as Record<string, string>)[r.key] = r.value;
  return s;
}

/* ---------- Utskott ---------- */

export async function listCommittees(opts: { visibleOnly?: boolean } = {}): Promise<Committee[]> {
  const db = await readDb();
  return db
    .prepare(
      `SELECT * FROM committees ${opts.visibleOnly ? "WHERE visible = 1" : ""} ORDER BY sort_order, name`,
    )
    .all() as Committee[];
}

export async function getCommitteeBySlug(slug: string): Promise<Committee | null> {
  const db = await readDb();
  return (db.prepare("SELECT * FROM committees WHERE slug = ?").get(slug) as Committee) ?? null;
}

export async function getCommitteeById(id: number): Promise<Committee | null> {
  const db = await readDb();
  return (db.prepare("SELECT * FROM committees WHERE id = ?").get(id) as Committee) ?? null;
}

/* ---------- Styrelse ---------- */

type BoardRow = Omit<BoardMember, "photo"> & { photo_json: string | null };

const mapBoard = (r: BoardRow): BoardMember => {
  const { photo_json, ...rest } = r;
  return { ...rest, photo: toImageRef(parseMediaJson(photo_json)) };
};

export async function listBoard(): Promise<BoardMember[]> {
  const db = await readDb();
  const rows = db
    .prepare(
      `SELECT b.*, ${MEDIA_JSON_COLUMNS("m")} AS photo_json
       FROM board_members b LEFT JOIN media m ON m.id = b.photo_media_id
       ORDER BY b.sort_order, b.id`,
    )
    .all() as BoardRow[];
  return rows.map(mapBoard);
}

export async function getBoardMember(id: number): Promise<BoardMember | null> {
  const db = await readDb();
  const row = db
    .prepare(
      `SELECT b.*, ${MEDIA_JSON_COLUMNS("m")} AS photo_json
       FROM board_members b LEFT JOIN media m ON m.id = b.photo_media_id WHERE b.id = ?`,
    )
    .get(id) as BoardRow | undefined;
  return row ? mapBoard(row) : null;
}

/* ---------- Sidor ---------- */

export async function getPage(slug: string): Promise<Page | null> {
  const db = await readDb();
  return (db.prepare("SELECT * FROM pages WHERE slug = ?").get(slug) as Page) ?? null;
}

export async function listPages(): Promise<Page[]> {
  const db = await readDb();
  return db.prepare("SELECT * FROM pages ORDER BY title").all() as Page[];
}

/* ---------- Partners ---------- */

type PartnerRow = Omit<Partner, "logo"> & { logo_json: string | null };

export async function listPartners(opts: { activeOnly?: boolean } = {}): Promise<Partner[]> {
  const db = await readDb();
  const rows = db
    .prepare(
      `SELECT p.*, ${MEDIA_JSON_COLUMNS("m")} AS logo_json
       FROM partners p LEFT JOIN media m ON m.id = p.logo_media_id
       ${opts.activeOnly ? "WHERE p.active = 1" : ""}
       ORDER BY CASE p.tier WHEN 'huvudpartner' THEN 0 ELSE 1 END, p.sort_order, p.name`,
    )
    .all() as PartnerRow[];
  return rows.map(({ logo_json, ...p }) => ({ ...p, logo: toImageRef(parseMediaJson(logo_json)) }));
}

/* ---------- Dokument ---------- */

type DocRow = Omit<DocumentItem, "file"> & { media_json: string | null };

export async function listDocuments(opts: { publishedOnly?: boolean } = {}): Promise<DocumentItem[]> {
  const db = await readDb();
  const rows = db
    .prepare(
      `SELECT d.*, ${MEDIA_JSON_COLUMNS("m")} AS media_json
       FROM documents d LEFT JOIN media m ON m.id = d.media_id
       ${opts.publishedOnly ? "WHERE d.published = 1" : ""}
       ORDER BY d.category, d.sort_order, COALESCE(d.doc_date, d.created_at) DESC`,
    )
    .all() as DocRow[];
  return rows.map(({ media_json, ...d }) => {
    const m = parseMediaJson(media_json);
    return { ...d, file: m ? { href: fileHref(m), size: m.size, ext: m.ext } : null };
  });
}
