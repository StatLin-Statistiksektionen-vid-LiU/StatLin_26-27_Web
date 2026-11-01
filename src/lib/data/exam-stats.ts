import "server-only";
import { after } from "next/server";
import { cache } from "react";
import { getDb } from "@/lib/db";
import { isFail, type ExamModule, type ExamStats } from "@/lib/exam-stats";
import { readDb } from "./db";

/**
 * Tentastatistiken kommer från samma öppna API som liustats.se (paketet liu-tentor-package, MIT).
 * Svaren sparas i databasen – inte i Nexts minnescache, som töms när Fly-maskinen stängs av – och
 * hämtas om högst en gång per dygn. Sidorna väntar aldrig på källan när det redan finns något sparat.
 */
const SOURCE = (process.env.EXAM_STATS_URL ?? "https://liutentor.lukasabbe.com").replace(/\/$/, "");
const DAY = 24 * 60 * 60 * 1000;
const CODES_KEY = "exam_stats_codes";
const CODES_AT_KEY = "exam_stats_codes_at";

/** Hämtningar som pågår. Samtidiga besök på samma kurs väntar på samma svar i stället för att fråga källan igen. */
const inflight = new Map<string, Promise<unknown>>();

function once<T>(key: string, run: () => Promise<T>): Promise<T> {
  const running = inflight.get(key) as Promise<T> | undefined;
  if (running) return running;
  const promise = run().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

type SourceCourse = {
  courseCode: string;
  courseTitle?: { sv?: string; en?: string };
  lastUpdatedTimestamp?: string;
  modules?: {
    moduleCode: string;
    moduleTitle?: { sv?: string; en?: string };
    date: string;
    grades?: { grade: string; gradeOrder: number; quantity: number }[];
  }[];
};

const isStale = (iso: string | undefined) => !iso || Date.now() - Date.parse(iso) > DAY;

function parseJson<T>(value: string | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

async function fetchSource(path: string): Promise<Response | null> {
  try {
    return await fetch(`${SOURCE}${path}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
      headers: { Accept: "application/json", "User-Agent": "StatLin-web (Statistiksektionen i Linköping)" },
    });
  } catch {
    return null;
  }
}

/** Källans format → moment med tillfällen, nyast först och betygen från sämst till bäst. */
export function normalizeSource(raw: SourceCourse): ExamStats {
  const modules = new Map<string, ExamModule>();
  for (const entry of raw.modules ?? []) {
    let m = modules.get(entry.moduleCode);
    if (!m) {
      m = { code: entry.moduleCode, title: entry.moduleTitle?.sv || entry.moduleTitle?.en || entry.moduleCode, occasions: [] };
      modules.set(entry.moduleCode, m);
    }
    // gradeOrder 1 är det högsta betyget.
    const grades = [...(entry.grades ?? [])].sort((a, b) => b.gradeOrder - a.gradeOrder).map((g) => ({ grade: g.grade, count: g.quantity }));
    const total = grades.reduce((n, g) => n + g.count, 0);
    const passed = grades.reduce((n, g) => n + (isFail(g.grade) ? 0 : g.count), 0);
    m.occasions.push({ date: entry.date.slice(0, 10), grades, total, passed });
  }
  for (const m of modules.values()) m.occasions.sort((a, b) => b.date.localeCompare(a.date));
  const updated = Number(raw.lastUpdatedTimestamp);
  return {
    code: raw.courseCode.toUpperCase(),
    title: { sv: raw.courseTitle?.sv ?? "", en: raw.courseTitle?.en ?? "" },
    modules: [...modules.values()],
    sourceUpdatedAt: Number.isFinite(updated) && updated > 0 ? new Date(updated).toISOString() : null,
  };
}

/* ---------- Kodlistan ---------- */

function readCodes(): { codes: string[] | null; fetchedAt: string | undefined } {
  const rows = getDb().prepare("SELECT key, value FROM settings WHERE key IN (?, ?)").all(CODES_KEY, CODES_AT_KEY) as { key: string; value: string }[];
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { codes: parseJson<string[]>(map[CODES_KEY]), fetchedAt: map[CODES_AT_KEY] };
}

const refreshCodes = () => once("*", fetchCodes);

async function fetchCodes(): Promise<string[] | null> {
  try {
    const res = await fetchSource("/api/courses");
    if (!res?.ok) return null;
    const list = (await res.json()) as unknown;
    if (!Array.isArray(list)) return null;
    const codes = list.filter((c): c is string => typeof c === "string").map((c) => c.toUpperCase());
    const db = getDb();
    const upsert = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
    db.transaction(() => {
      upsert.run(CODES_KEY, JSON.stringify(codes));
      upsert.run(CODES_AT_KEY, new Date().toISOString());
    })();
    return codes;
  } catch {
    return null;
  }
}

/** Alla kurskoder som källan har statistik för (drygt 4 000). Hämtas en gång per dygn. */
export async function listExamCodes(): Promise<string[]> {
  await readDb();
  const { codes, fetchedAt } = readCodes();
  if (!codes) return (await refreshCodes()) ?? [];
  if (isStale(fetchedAt)) after(refreshCodes);
  return codes;
}

/* ---------- En kurs ---------- */

type Row = { course_code: string; data: string; fetched_at: string };

function store(code: string, stats: ExamStats | null) {
  getDb()
    .prepare(
      "INSERT INTO exam_stats (course_code, data, fetched_at) VALUES (?, ?, ?) ON CONFLICT(course_code) DO UPDATE SET data = excluded.data, fetched_at = excluded.fetched_at",
    )
    .run(code, JSON.stringify(stats), new Date().toISOString());
}

/** Hämtar och sparar en kurs. undefined = källan svarade inte, och det som redan finns sparat behålls. */
const refreshCourse = (code: string) => once(code, () => fetchCourse(code));

async function fetchCourse(code: string): Promise<ExamStats | null | undefined> {
  try {
    const res = await fetchSource(`/api/courses/${encodeURIComponent(code)}`);
    if (!res) return undefined;
    if (res.status === 404) {
      store(code, null);
      return null;
    }
    if (!res.ok) return undefined;
    const stats = normalizeSource((await res.json()) as SourceCourse);
    store(code, stats);
    return stats;
  } catch {
    return undefined;
  }
}

export type ExamStatsResult = { stats: ExamStats | null; fetchedAt: string | null; unavailable: boolean };

/**
 * Statistik för en kurs, vilken LiU-kurs som helst. Finns inget sparat hämtas den direkt – men bara
 * om koden finns i källans lista, så att påhittade koder inte fyller tabellen. cache() gör att sidan
 * och dess metadata delar på samma svar.
 */
export const getExamStats = cache(async (code: string): Promise<ExamStatsResult> => {
  const db = await readDb();
  const row = db.prepare("SELECT course_code, data, fetched_at FROM exam_stats WHERE course_code = ?").get(code) as Row | undefined;
  if (row) {
    if (isStale(row.fetched_at)) after(() => refreshCourse(code));
    return { stats: parseJson<ExamStats>(row.data), fetchedAt: row.fetched_at, unavailable: false };
  }
  const codes = await listExamCodes();
  // Ingen kodlista alls betyder att källan inte svarar – inte att kursen saknas.
  if (codes.length === 0) return { stats: null, fetchedAt: null, unavailable: true };
  if (!codes.includes(code)) return { stats: null, fetchedAt: null, unavailable: false };
  const stats = await refreshCourse(code);
  return { stats: stats ?? null, fetchedAt: stats ? new Date().toISOString() : null, unavailable: stats === undefined };
});
