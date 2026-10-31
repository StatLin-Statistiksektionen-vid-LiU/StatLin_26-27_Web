import "server-only";
import { readDb } from "./db";
import type { Course, LinkItem, Program } from "@/lib/types";

/* ---------- Länkar ---------- */

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

/* ---------- Kurser ---------- */

export async function listCourses(opts: { activeOnly?: boolean; program?: Program } = {}): Promise<Course[]> {
  const db = await readDb();
  const where = [opts.activeOnly && "active = 1", opts.program && "program = ?"].filter(Boolean);
  const stmt = db.prepare(`SELECT * FROM courses ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY program, term, sort_order, code`);
  return (opts.program ? stmt.all(opts.program) : stmt.all()) as Course[];
}

export async function getCourse(id: number): Promise<Course | null> {
  const db = await readDb();
  return (db.prepare("SELECT * FROM courses WHERE id = ?").get(id) as Course) ?? null;
}

export async function getCourseByCode(code: string): Promise<Course | null> {
  const db = await readDb();
  return (db.prepare("SELECT * FROM courses WHERE code = ? AND active = 1").get(code) as Course) ?? null;
}
