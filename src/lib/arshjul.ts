/**
 * Årshjulets regler: terminer, månader, vad som hamnar på översiktens kort och vilka datum som föreslås. Rena funktioner utan
 * databas, så att gränserna vid årsskiftet går att testa (tests/arshjul.test.mjs). Datum är "YYYY-MM-DD" i svensk tid (dates.ts).
 */
import { addDaysLocal, parts } from "@/lib/dates";

export type Term = "vt" | "ht";
export type WheelStatus = "oppen" | "planerad" | "klar" | "hoppad";

export const MONTHS = ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"] as const;
export const MONTHS_SHORT = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"] as const;
export const TERM_LABELS: Record<Term, string> = { vt: "VT", ht: "HT" };
export const TERM_NAMES: Record<Term, string> = { vt: "Vårterminen", ht: "Höstterminen" };

export interface WheelItem {
  id: number;
  title: string;
  description: string;
  responsible: string;
  month: number | null;
  term: Term | null;
  depends_on: string;
  template: string;
  owner_user_id: number | null;
  seed_key: string | null;
  updated_at: string;
}

/** Årets läge för en punkt. task_status är uppdragets status på tavlan, om uppdraget finns kvar. */
export interface WheelState {
  item_id: number;
  year: number;
  status: WheelStatus;
  task_id: number | null;
  task_status: string | null;
  project_plan_id: number | null;
}

/**
 * Terminerna delar kalenderåret mitt itu: januari–juni är VT och juli–december HT. Sommaren räknas till hösten eftersom det är då
 * mottagningen planeras. Eftersom en termin aldrig går över ett årsskifte räcker året för att säga vilken gång en punkt gäller.
 */
export const termOfMonth = (month: number): Term => (month <= 6 ? "vt" : "ht");

export const itemTerm = (item: Pick<WheelItem, "month" | "term">): Term => (item.month !== null ? termOfMonth(item.month) : (item.term ?? "vt"));

/** Månaden efter dagens datum. I december är det januari nästa år, och då gäller nästa års läge för punkten. */
export function nextMonthOf(today: string): { year: number; month: number } {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

export function currentTermOf(today: string): { year: number; term: Term } {
  return { year: Number(today.slice(0, 4)), term: termOfMonth(Number(today.slice(5, 7))) };
}

/**
 * Läget som gäller just nu. "Planerad" kräver att uppdraget eller planen finns kvar: tas de bort nollas referensen, och då ska punkten
 * bli öppen igen i stället för att se planerad ut för evigt. Ett uppdrag som är klart på tavlan gör punkten klar, om ingen plan finns.
 */
export function effectiveStatus(state: WheelState | undefined): WheelStatus {
  if (!state) return "oppen";
  if (state.status === "klar" || state.status === "hoppad") return state.status;
  if (state.task_id !== null && state.task_status === "klar" && state.project_plan_id === null) return "klar";
  return state.task_id !== null || state.project_plan_id !== null ? "planerad" : "oppen";
}

export interface WheelCardItem {
  item: WheelItem;
  year: number;
  state: WheelState | undefined;
  status: WheelStatus;
  /** Månaden har redan passerat, och punkten står fortfarande kvar att planera. */
  late: boolean;
}

/**
 * Översiktens två kort. "Nästa månad" är punkterna den månaden som inte är avklarade det året. "Att planera in" är terminens punkter
 * som beror på andra eller saknar månad och inte är planerade än. En punkt står bara på ett kort: nästa månad går först, eftersom den
 * är mest bråttom.
 */
export function wheelCards(items: WheelItem[], stateOf: (itemId: number, year: number) => WheelState | undefined, today: string) {
  const next = nextMonthOf(today);
  const current = currentTermOf(today);
  const currentMonth = Number(today.slice(5, 7));

  const nextMonth: WheelCardItem[] = [];
  const toPlan: WheelCardItem[] = [];
  for (const item of items) {
    if (item.month === next.month) {
      const state = stateOf(item.id, next.year);
      const status = effectiveStatus(state);
      if (status !== "klar" && status !== "hoppad") {
        nextMonth.push({ item, year: next.year, state, status, late: false });
        continue;
      }
    }
    if (itemTerm(item) !== current.term || !(item.depends_on || item.month === null)) continue;
    const state = stateOf(item.id, current.year);
    const status = effectiveStatus(state);
    if (status === "oppen") toPlan.push({ item, year: current.year, state, status, late: item.month !== null && item.month < currentMonth });
  }
  // Det sektionen själv har lagt in står före förslagen, det nyaste först, så att det inte hamnar under "Alla" på kortet.
  const ownFirst = (a: WheelCardItem, b: WheelCardItem) => (b.item.seed_key === null ? b.item.id : 0) - (a.item.seed_key === null ? a.item.id : 0);
  nextMonth.sort(ownFirst);
  // Det som hunnit passera står först, och sedan i kalenderordning. Punkter utan månad står sist.
  toPlan.sort((a, b) => (a.item.month ?? 13) - (b.item.month ?? 13) || ownFirst(a, b));
  return { next, current, nextMonth, toPlan };
}

const firstOfMonth = (year: number, month: number) => `${year}-${String(month).padStart(2, "0")}-01`;
const addDays = (date: string, days: number) => addDaysLocal(date, days).slice(0, 10);

/**
 * Förfallodatum när en punkt läggs på tavlan. En punkt med månad ska vara klar när månaden börjar, och en som beror på andra en månad
 * tidigare, eftersom andra behöver framförhållning. Har datumet redan passerat får uppdraget en vecka på sig. Utan månad: två veckor,
 * men aldrig efter terminens slut.
 */
export function suggestedDueDate(item: Pick<WheelItem, "month" | "term" | "depends_on">, year: number, today: string): string {
  if (item.month !== null) {
    const due = item.depends_on
      ? item.month === 1
        ? firstOfMonth(year - 1, 12)
        : firstOfMonth(year, item.month - 1)
      : firstOfMonth(year, item.month);
    return due < today ? addDays(today, 7) : due;
  }
  const termEnd = itemTerm(item) === "vt" ? `${year}-06-30` : `${year}-12-31`;
  const due = addDays(today, 14);
  return due > termEnd && today <= termEnd ? termEnd : due;
}

/** Datumet en plan från punkten börjar med: mitt i månaden, eller om sex veckor när månaden saknas eller redan passerat. */
export function suggestedPlanDate(item: Pick<WheelItem, "month">, year: number, today: string): string {
  const date = item.month !== null ? `${year}-${String(item.month).padStart(2, "0")}-15` : null;
  return date && date >= today ? date : addDays(today, 42);
}

/** Är användaren punktens eller planens ansvariga post? Jämför med posten och med utskottets korta namn. */
export function matchesResponsible(user: { post: string; committee_name: string | null }, responsible: string): boolean {
  const wanted = responsible.trim().toLowerCase();
  if (!wanted) return false;
  return user.post.trim().toLowerCase() === wanted || user.committee_name?.trim().toLowerCase() === wanted;
}

/** Var punkten ligger i året, i klartext: "September", "VT" eller "Oktober · HT". */
export function placementLabel(item: Pick<WheelItem, "month" | "term">): string {
  return item.month !== null ? MONTHS[item.month - 1] : TERM_LABELS[item.term ?? "vt"];
}

/** Var på hjulet dagen ligger, i grader medurs från klockan tolv. Varje månad är 30° oavsett antal dagar. */
export function wheelAngle(today: string): number {
  const { month, day, year } = parts(today);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return (month - 1 + (day - 1) / daysInMonth) * 30;
}

/** Vilka år som går att visa och planera: i fjol, i år och nästa år. */
export const yearInRange = (year: number, today: string) => Math.abs(year - Number(today.slice(0, 4))) <= 1;

/** Månaden ur adressen, eller null. */
export function monthParam(value: unknown): number | null {
  return typeof value === "string" && /^([1-9]|1[0-2])$/.test(value) ? Number(value) : null;
}
