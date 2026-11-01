import type { LinkCategory, Program } from "./types";

/** Länksidans grupper, i den ordning de visas. */
export const LINK_CATEGORIES: { value: LinkCategory; label: string }[] = [
  { value: "studier", label: "Studier" },
  { value: "tentor", label: "Tentor" },
  { value: "it", label: "IT och konton" },
  { value: "campus", label: "Campus och bibliotek" },
  { value: "stod", label: "Hjälp och stöd" },
  { value: "statlin", label: "StatLin" },
];

export const categoryLabel = (c: LinkCategory) => LINK_CATEGORIES.find((x) => x.value === c)?.label ?? c;

/** Ikonerna som går att välja för en länk. Namnet sparas i links.icon. */
export const LINK_ICONS = [
  { value: "link", label: "Länk" },
  { value: "calendar", label: "Kalender" },
  { value: "door", label: "Dörr" },
  { value: "map", label: "Karta" },
  { value: "printer", label: "Skrivare" },
  { value: "pen", label: "Penna" },
  { value: "mail", label: "Mejl" },
  { value: "chart", label: "Diagram" },
  { value: "file", label: "Dokument" },
  { value: "users", label: "Personer" },
  { value: "key", label: "Nyckel" },
  { value: "clock", label: "Klocka" },
] as const;

export const PROGRAMS: { value: Program; label: string; name: string }[] = [
  { value: "kandidat", label: "Kandidat", name: "Statistik och dataanalys" },
  { value: "master", label: "Master", name: "Statistics and Machine Learning" },
];

/** Gemener utan diakritiska tecken, så att "tenta", "Tenta" och "téntå" hittar samma sak. */
export const normalizeSearch = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export const isExternalUrl = (url: string) => /^https?:\/\//i.test(url);
