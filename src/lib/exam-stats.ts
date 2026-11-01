/**
 * Tentastatistik: typer och beräkningar som både servern och diagrammen i webbläsaren använder.
 * Datan kommer från samma öppna källa som liustats.se (se src/lib/data/exam-stats.ts).
 */

export type GradeCount = { grade: string; count: number };
export type ExamOccasion = { date: string; grades: GradeCount[]; total: number; passed: number };
export type ExamModule = { code: string; title: string; occasions: ExamOccasion[] };
export type ExamStats = {
  code: string;
  title: { sv: string; en: string };
  /** Nyast först inom varje moment. Betygen i ordning från sämst till bäst. */
  modules: ExamModule[];
  sourceUpdatedAt: string | null;
};

/** Tillfällen med färre resultat visas inte – för små grupper säger statistiken lite och kan peka ut enskilda. */
export const MIN_RESULTS = 5;

const FAIL = new Set(["U", "F", "FX"]);
export const isFail = (grade: string) => FAIL.has(grade.toUpperCase());

/** "732g33 " → "732G33". Null om det inte ser ut som en LiU-kurskod. */
export function normalizeCourseCode(raw: string): string | null {
  const code = raw.replace(/\s+/g, "").toUpperCase();
  return /^[A-Z0-9]{4,6}$/.test(code) ? code : null;
}

/**
 * Strängare än normalizeCourseCode, för att känna igen en kurskod i fritext som "tata24" i sökrutan.
 * LiU:s koder har sex tecken med både bokstäver och minst två siffror, så "schema" räknas inte.
 */
export function looksLikeCourseCode(raw: string): string | null {
  const code = normalizeCourseCode(raw);
  return code && /^(?=(?:.*\d){2})(?=.*[A-Z])[A-Z0-9]{6}$/.test(code) ? code : null;
}

/**
 * Betygens färger, i samma ordning som betygen (sämst först). Underkänt är rött och de godkända betygen
 * en grå skala som mörknar mot det högsta. Paren är kontrollerade för färgblindhet och kontrast med
 * dataviz-skillens validator; de ljusaste gråa ligger under 3:1 och kräver därför synliga etiketter och
 * tabellvyn, som diagrammen har.
 */
const PASS_RAMPS = [
  ["#0a0a0a"],
  ["#6a665f", "#0a0a0a"],
  ["#a19d95", "#6a665f", "#0a0a0a"],
  ["#8f8b84", "#6a665f", "#3d3a35", "#0a0a0a"],
  ["#b3afa7", "#8f8b84", "#6a665f", "#3d3a35", "#0a0a0a"],
];
/** U eller F, sedan Fx. */
const FAIL_COLORS = ["#d40000", "#ec7468"];

export function gradeColors(grades: string[]): string[] {
  const passes = grades.filter((g) => !isFail(g)).length;
  const ramp = PASS_RAMPS[Math.min(passes, PASS_RAMPS.length) - 1] ?? [];
  let fail = 0;
  let pass = 0;
  // Skalan räknas från det högsta betyget, så att bästa betyget alltid är svart.
  return grades.map((g) => (isFail(g) ? FAIL_COLORS[Math.min(fail++, 1)] : ramp[Math.max(0, ramp.length - (passes - pass++))]));
}

/** Tillfällen som har tillräckligt många resultat för att visas. */
export const visibleOccasions = (m: ExamModule) => m.occasions.filter((o) => o.total >= MIN_RESULTS);

/** Nyckeltalen räknas på de senaste tre åren – äldre tentor säger lite om kursen som den ges i dag. */
const RECENT_YEARS = 3;

function recentOccasions(m: ExamModule, now: Date): ExamOccasion[] {
  const cutoff = new Date(now);
  cutoff.setFullYear(cutoff.getFullYear() - RECENT_YEARS);
  const iso = cutoff.toISOString().slice(0, 10);
  return visibleOccasions(m).filter((o) => o.date >= iso);
}

const resultCount = (list: ExamOccasion[]) => list.reduce((n, o) => n + o.total, 0);

/**
 * Momentet som sammanfattar kursen: en tentamen före laborationer och inlämningar, och bland
 * tentorna den med flest resultat de senaste åren. Kurser byter ibland momentkod (TENT blir DAT1),
 * och då ska den nya koden vinna även om den gamla har fler resultat totalt.
 */
export function primaryModule(stats: ExamStats, now = new Date()): ExamModule | null {
  const shown = stats.modules.filter((m) => visibleOccasions(m).length > 0);
  if (shown.length === 0) return null;
  const isExam = (m: ExamModule) => /tentamen|tenta|skriftlig|examination/i.test(m.title) || /^(TEN|DAT|TEA)/.test(m.code);
  const recent = (m: ExamModule) => resultCount(recentOccasions(m, now));
  const all = (m: ExamModule) => resultCount(visibleOccasions(m));
  return [...shown].sort((a, b) => Number(isExam(b)) - Number(isExam(a)) || recent(b) - recent(a) || all(b) - all(a))[0];
}

/**
 * Slår ihop betygsordningen från flera tillfällen, så att en summering över år behåller ordningen
 * sämst → bäst även om skalan har bytts (U/G/VG till U/3/4/5).
 */
export function mergeGradeOrder(lists: string[][]): string[] {
  const order: string[] = [];
  for (const list of lists) {
    let at = 0;
    for (const g of list) {
      const i = order.indexOf(g);
      if (i >= 0) at = i + 1;
      else order.splice(at++, 0, g);
    }
  }
  return order;
}

export type ModuleSummary = {
  latest: ExamOccasion;
  /** Tillfällena som nyckeltalen bygger på: de senaste tre åren, eller alla om kursen inte getts sedan dess. */
  from: string;
  to: string;
  recent: boolean;
  /** Andel godkända av alla skrivningar under perioden, 0–1. */
  passRate: number;
  total: number;
  /** Betygen summerade över perioden, sämst först. */
  grades: GradeCount[];
  /** Vanligaste betyget bland de godkända. */
  commonGrade: string | null;
};

export function summarizeModule(m: ExamModule, now = new Date()): ModuleSummary | null {
  const shown = visibleOccasions(m);
  if (shown.length === 0) return null;
  const recent = recentOccasions(m, now);
  const pool = recent.length ? recent : shown;
  const total = resultCount(pool);
  const passed = pool.reduce((n, o) => n + o.passed, 0);
  const byGrade = new Map<string, number>();
  for (const o of pool) for (const g of o.grades) byGrade.set(g.grade, (byGrade.get(g.grade) ?? 0) + g.count);
  const grades = mergeGradeOrder(pool.map((o) => o.grades.map((g) => g.grade))).map((grade) => ({ grade, count: byGrade.get(grade) ?? 0 }));
  const commonGrade = grades.filter((g) => !isFail(g.grade)).sort((a, b) => b.count - a.count)[0]?.grade ?? null;
  return {
    latest: shown[0],
    from: pool[pool.length - 1].date,
    to: pool[0].date,
    recent: recent.length > 0,
    passRate: passed / total,
    total,
    grades,
    commonGrade,
  };
}

export type YearPassRate = {
  year: string;
  occasions: number;
  total: number;
  passed: number;
  /** Medeldatumet för årets tillfällen, i millisekunder – där året ritas på en tidsaxel. */
  at: number;
};

/** Årets alla skrivningar sammanslagna, äldst först. Ett tillfälle väger alltså efter hur många som skrev. */
export function passRateByYear(occasions: ExamOccasion[]): YearPassRate[] {
  const years = new Map<string, ExamOccasion[]>();
  for (const o of occasions) {
    const year = o.date.slice(0, 4);
    years.set(year, [...(years.get(year) ?? []), o]);
  }
  return [...years.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, list]) => ({
      year,
      occasions: list.length,
      total: resultCount(list),
      passed: list.reduce((n, o) => n + o.passed, 0),
      at: list.reduce((n, o) => n + Date.parse(o.date), 0) / list.length,
    }));
}

/** "78 %" med hårt mellanslag, så att procenttecknet aldrig hamnar ensamt på nästa rad. */
export const formatPercent = (share: number) => `${Math.round(share * 100)} %`;
