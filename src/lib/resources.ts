import type { Program, ResourceCategory, ResourceItem, ResourceProgram } from "./types";
import { formatBytes } from "./utils";

/** Hjälpmedlens etiketter och terminer. Inga databasanrop, så att både sidan och formuläret kan använda filen. */

export const RESOURCE_CATEGORIES: Record<ResourceCategory, string> = {
  fusklapp: "Fusklapp",
  kod: "Kod",
  guide: "Guide",
  ovrigt: "Övrigt",
};

export const RESOURCE_PROGRAMS: Record<ResourceProgram, string> = {
  kandidat: "Kandidat",
  master: "Master",
  bada: "Båda",
};

export const TERMS = [1, 2, 3, 4, 5, 6];

/** Kandidaten har sex terminer och mastern fyra, så det som gäller båda programmen kan ligga på termin 1–4. */
export const LAST_TERM: Record<ResourceProgram, number> = { kandidat: 6, master: 4, bada: 4 };

export const termYear = (term: number) => Math.ceil(term / 2);

/** Båda programmen börjar på hösten, så udda terminer är hösttermin. */
export const termSeason = (term: number) => (term % 2 === 1 ? "Hösttermin" : "Vårtermin");

export const termLabel = (term: number | null) => (term === null ? "Hela programmet" : `År ${termYear(term)} · Termin ${term}`);

export const fileLabel = (file: NonNullable<ResourceItem["file"]>) => (file.image ? "Bild" : `${file.ext.toUpperCase()} · ${formatBytes(file.size)}`);

/** "github.com" för en länk till en annan webbplats, annars tomt. */
export function linkHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export type ResourceYear = { year: number; terms: { term: number; items: ResourceItem[] }[] };

/** Ett programs hjälpmedel per årskurs och termin, i bokstavsordning. Bara år och terminer med innehåll tas med. */
export function groupResources(resources: ResourceItem[], program: Program): { years: ResourceYear[]; whole: ResourceItem[] } {
  const shown = resources.filter((r) => r.program === program || r.program === "bada").sort((a, b) => a.title.localeCompare(b.title, "sv"));
  const years: ResourceYear[] = [];
  for (const term of TERMS) {
    const items = shown.filter((r) => r.term === term);
    if (items.length === 0) continue;
    const year = termYear(term);
    const last = years[years.length - 1];
    if (last?.year === year) last.terms.push({ term, items });
    else years.push({ year, terms: [{ term, items }] });
  }
  return { years, whole: shown.filter((r) => r.term === null) };
}
