/**
 * Tider lagras som "naiv" lokal tid i Stockholm: "YYYY-MM-DDTHH:mm".
 * Vid formatering tolkas strängen som UTC och formateras med timeZone UTC,
 * så att visningen aldrig förskjuts av serverns tidszon.
 */
export const TZ = "Europe/Stockholm";

const pad = (n: number) => String(n).padStart(2, "0");

export function nowLocal(): string {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function todayLocal(): string {
  return nowLocal().slice(0, 10);
}

function asUtc(local: string): Date {
  const [d, t = "00:00"] = local.split("T");
  return new Date(`${d}T${t.slice(0, 5)}:00Z`);
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("sv-SE", { timeZone: "UTC", ...opts });

const weekdayLong = fmt({ weekday: "long" });
const weekdayShort = fmt({ weekday: "short" });
const monthShort = fmt({ month: "short" });
const monthLong = fmt({ month: "long" });
const dayMonth = fmt({ day: "numeric", month: "long" });
const dayMonthYear = fmt({ day: "numeric", month: "long", year: "numeric" });

export function parts(local: string) {
  const d = asUtc(local);
  return {
    day: d.getUTCDate(),
    month: d.getUTCMonth() + 1,
    year: d.getUTCFullYear(),
    weekday: weekdayLong.format(d),
    weekdayShort: weekdayShort.format(d).replace(".", ""),
    monthShort: monthShort.format(d).replace(".", ""),
    monthLong: monthLong.format(d),
    time: local.length > 10 ? local.slice(11, 16) : "",
  };
}

/** "12 jan 2024" – för diagram och tabeller, där det är trångt. */
export function formatDateShort(local: string): string {
  const p = parts(local);
  return `${p.day} ${p.monthShort} ${p.year}`;
}

export function formatDate(local: string, withYear = false): string {
  const d = asUtc(local);
  return (withYear ? dayMonthYear : dayMonth).format(d);
}

export function formatDateLong(local: string): string {
  const p = parts(local);
  const thisYear = Number(todayLocal().slice(0, 4));
  const base = `${capitalize(p.weekday)} ${p.day} ${p.monthLong}`;
  return p.year === thisYear ? base : `${base} ${p.year}`;
}

export function formatTimeRange(start: string, end: string | null, allDay: boolean): string {
  if (allDay) return "Heldag";
  const s = start.slice(11, 16);
  if (!end) return s;
  if (end.slice(0, 10) === start.slice(0, 10)) return `${s}–${end.slice(11, 16)}`;
  return `${s} – ${formatDate(end)} ${end.slice(11, 16)}`;
}

export function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "om 3 dagar", "i morgon", "i dag" – relativt dagens datum i Stockholm. */
export function relativeDay(local: string): string {
  const today = asUtc(todayLocal());
  const target = asUtc(local.slice(0, 10));
  const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return "I dag";
  if (diff === 1) return "I morgon";
  if (diff === -1) return "I går";
  if (diff > 1 && diff < 7) return `Om ${diff} dagar`;
  if (diff >= 7 && diff < 14) return "Nästa vecka";
  if (diff >= 14 && diff < 60) return `Om ${Math.round(diff / 7)} veckor`;
  if (diff < 0) return "Har varit";
  return `Om ${Math.round(diff / 30)} mån`;
}

/** ISO-veckonumret för ett datum, "YYYY-MM-DD". Vecka 1 är veckan med årets första torsdag. */
export function isoWeek(local: string): number {
  const d = asUtc(local.slice(0, 10));
  const weekday = d.getUTCDay() || 7;
  // Torsdagen i samma vecka avgör vilket år veckan hör till.
  d.setUTCDate(d.getUTCDate() + 4 - weekday);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7);
}

export function addDaysLocal(local: string, days: number): string {
  const d = asUtc(local);
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** Månadsrutnät (måndag först) för kalendervyn. */
export function monthGrid(year: number, month: number) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const start = new Date(first);
  start.setUTCDate(1 - offset);
  const days: { date: string; inMonth: boolean }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    days.push({
      date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
      inMonth: d.getUTCMonth() === month - 1,
    });
  }
  // Ta bort en sista helt tom vecka.
  if (!days.slice(35).some((d) => d.inMonth)) days.splice(35);
  return days;
}

export function monthLabel(year: number, month: number) {
  return capitalize(monthLong.format(new Date(Date.UTC(year, month - 1, 1)))) + " " + year;
}

export function isoUtc(): string {
  return new Date().toISOString();
}

/** Formaterar ISO-tidsstämplar (UTC, från databasen) i svensk tid. */
export function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
