/**
 * Sökmotorn bakom sökfliken. Rena funktioner som körs i webbläsaren, så träffarna kommer medan man skriver. Indexet byggs på servern
 * (src/lib/data/search-index.ts) och hämtas en gång per besök.
 *
 * Så söker den:
 * - Texten jämförs i förenklad form: gemener, utan accenter och prickar, så "arshjul" hittar "Årshjul".
 * - Alla sökord måste finnas i träffen. Rubriken väger tyngst, sedan nyckelord och raden under rubriken, sist brödtexten.
 *   Ett helt ord ger mer än början av ett ord, som ger mer än mitten av ett ord.
 * - Stavfel: ett sökord som inte finns någonstans i indexet rättas till de närmaste orden som finns. Ett fel tillåts i ord med fyra
 *   till sju bokstäver och två i längre ord. Det sista ordet räknas som påbörjat medan man skriver.
 */

export type SearchKind = "sida" | "evenemang" | "nytt" | "utskott" | "styrelse" | "dokument" | "lank" | "hjalpmedel" | "foretag" | "kurs";

export const KIND_LABELS: Record<SearchKind, string> = {
  sida: "Sida",
  evenemang: "Evenemang",
  nytt: "Nytt",
  utskott: "Utskott",
  styrelse: "Styrelsen",
  dokument: "Dokument",
  lank: "Länk",
  hjalpmedel: "Hjälpmedel",
  foretag: "Företag",
  kurs: "Tentastatistik",
};

export interface SearchEntry {
  /** Vart träffen leder. Interna adresser börjar med /. */
  href: string;
  kind: SearchKind;
  title: string;
  /** Kort rad under rubriken, till exempel datum, post eller kategori. */
  meta?: string;
  /** Söks men visas inte: synonymer och nyckelord. */
  keywords?: string;
  /** Brödtext utan markdown. Ger träffar inne i texten och utdraget under rubriken. */
  text?: string;
  /** Öppnas i en ny flik. */
  external?: boolean;
  /** Vid lika poäng kommer högre först, till exempel kommande evenemang före gamla. */
  boost?: number;
}

export interface SearchHit {
  entry: SearchEntry;
  score: number;
  /** Sökorden står bara i brödtexten. Då visas ett utdrag runt dem under rubriken. */
  inText: boolean;
}

export interface SearchResult {
  hits: SearchHit[];
  /** Sökorden i jämförelseform, för markeringen. */
  terms: string[];
  /** Rättade ord som gav träffar. De markeras bara som hela ord. */
  corrected: string[];
  /** Frågan med de rättade orden, när något ord behövde rättas. */
  suggestion?: string;
}

/** En post där texterna redan är förenklade, så att varje tangenttryck bara behöver jämföra strängar. */
export interface PreparedEntry {
  entry: SearchEntry;
  title: string;
  extra: string;
  text: string;
}

interface Correction {
  word: string;
  cost: number;
}

interface FuzzyIndex {
  /** Varje ord i indexet och var det står: postens nummer gånger 8 plus fälten (1 rubrik, 2 nyckelord och rad, 4 brödtext). */
  postings: Map<string, number[]>;
  words: string[];
}

export interface PreparedIndex {
  entries: PreparedEntry[];
  /** Ordlistan för stavfel. Byggs först när ett ord behöver rättas, så att sidan inte väntar på den. */
  fuzzy?: FuzzyIndex;
  /** Rättningar per sökord, så att samma ord inte jämförs med hela ordlistan vid varje tangenttryck. */
  corrections: Map<string, Correction[]>;
}

export const MAX_QUERY_LENGTH = 100;
export const MAX_HITS = 60;
const MAX_CORRECTIONS = 12;

/**
 * Ett tecken i den form sökningen jämför: gemener, utan accenter och prickar (å blir a, é blir e), och allt som inte är bokstav
 * eller siffra blir mellanslag. Ett fristående accenttecken försvinner, precis som i fold().
 */
function foldChar(c: string): string {
  const code = c.charCodeAt(0);
  if ((code >= 97 && code <= 122) || (code >= 48 && code <= 57)) return c;
  if (code >= 65 && code <= 90) return String.fromCharCode(code + 32);
  if (code < 128) return " ";
  const f = c.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (f === "") return "";
  return /^[a-z0-9]+$/.test(f) ? f : " ";
}

/** Texten i jämförelseform, plus var i originalet varje tecken kom ifrån (för att kunna markera träffen i originaltexten). */
export function foldWithMap(s: string): { folded: string; map: number[] } {
  let folded = "";
  const map: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const f = foldChar(s[i]);
    folded += f;
    for (let j = 0; j < f.length; j++) map.push(i);
  }
  return { folded, map };
}

/** Snabb variant utan positioner, för indexet och sökorden. Flera skiljetecken i rad blir ett mellanslag. */
export function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ");
}

/** Sökorden i jämförelseform. Tomt om frågan bara består av skiljetecken. */
export function queryTerms(query: string): string[] {
  const terms = fold(query.slice(0, MAX_QUERY_LENGTH)).split(" ").filter(Boolean);
  return [...new Set(terms)].slice(0, 8);
}

export function prepareIndex(entries: SearchEntry[]): PreparedIndex {
  return {
    entries: entries.map((entry) => ({
      entry,
      title: " " + fold(entry.title).trim() + " ",
      extra: " " + fold(`${entry.meta ?? ""} ${entry.keywords ?? ""} ${KIND_LABELS[entry.kind]}`).trim() + " ",
      text: " " + fold(entry.text ?? "").trim() + " ",
    })),
    corrections: new Map(),
  };
}

/**
 * Poäng för ett ord i ett fält: helt ord > början av ett ord > slutet av ett ord > mitt i ett ord. Slutet väger nästan som början,
 * eftersom svenska sätter ihop ord: en "höstsittning" är en sittning. Korta ord måste stå först i ett ord.
 */
function fieldScore(field: string, term: string, whole: number, start: number, end: number, inside: number): number {
  if (field.includes(" " + term + " ")) return whole;
  if (field.includes(" " + term)) return start;
  if (term.length < 3) return 0;
  if (field.includes(term + " ")) return end;
  if (field.includes(term)) return inside;
  return 0;
}

function buildFuzzy(entries: PreparedEntry[]): FuzzyIndex {
  const postings = new Map<string, number[]>();
  entries.forEach((p, at) => {
    const fields = new Map<string, number>();
    const add = (folded: string, field: number) => {
      for (const word of folded.split(" ")) {
        if (word.length < 3 || /^\d+$/.test(word)) continue;
        fields.set(word, (fields.get(word) ?? 0) | field);
      }
    };
    add(p.title, 1);
    add(p.extra, 2);
    add(p.text, 4);
    for (const [word, field] of fields) {
      const list = postings.get(word);
      if (list) list.push(at * 8 + field);
      else postings.set(word, [at * 8 + field]);
    }
  });
  return { postings, words: [...postings.keys()] };
}

let rowA = new Int32Array(64);
let rowB = new Int32Array(64);
let rowC = new Int32Array(64);

/**
 * Antal ändringar mellan sökordet och ett ord i indexet: byta, lägga till eller ta bort en bokstav, eller kasta om två bokstäver
 * bredvid varandra. Svarar högst max + 1. Med prefix jämförs sökordet med början av ordet, för ordet man håller på att skriva.
 */
export function distance(a: string, b: string, max: number, prefix = false): number {
  const m = a.length;
  const n = prefix ? Math.min(b.length, m + max) : b.length;
  if (prefix ? n < m - max : Math.abs(m - n) > max) return max + 1;
  if (rowA.length <= n) {
    rowA = new Int32Array(n + 1);
    rowB = new Int32Array(n + 1);
    rowC = new Int32Array(n + 1);
  }
  let older = rowA;
  let prev = rowB;
  let cur = rowC;
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    const ca = a.charCodeAt(i - 1);
    cur[0] = i;
    let rowMin = i;
    for (let j = 1; j <= n; j++) {
      const cb = b.charCodeAt(j - 1);
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca === cb ? 0 : 1));
      if (i > 1 && j > 1 && ca === b.charCodeAt(j - 2) && a.charCodeAt(i - 2) === cb) v = Math.min(v, older[j - 2] + 1);
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    const spare = older;
    older = prev;
    prev = cur;
    cur = spare;
  }
  if (!prefix) return Math.min(prev[n], max + 1);
  let best = max + 1;
  for (let j = Math.max(0, m - max); j <= n; j++) if (prev[j] < best) best = prev[j];
  return best;
}

/** De närmaste orden i indexet för ett sökord som inte finns där. Tomt när ordet finns, även inne i ett längre ord. */
function correctionsFor(prep: PreparedIndex, term: string, typing: boolean): Correction[] {
  const key = (typing ? "+" : "=") + term;
  const cached = prep.corrections.get(key);
  if (cached) return cached;
  let found: Correction[] = [];
  if (term.length >= 4 && !/\d/.test(term)) {
    const fuzzy = (prep.fuzzy ??= buildFuzzy(prep.entries));
    if (!fuzzy.words.some((w) => w.includes(term))) {
      const max = term.length >= 8 ? 2 : 1;
      const prefix = typing && term.length >= 5;
      for (const word of fuzzy.words) {
        const cost = distance(term, word, max, prefix);
        if (cost <= max) found.push({ word, cost });
      }
      found.sort((x, y) => x.cost - y.cost || fuzzy.postings.get(y.word)!.length - fuzzy.postings.get(x.word)!.length);
      found = found.slice(0, MAX_CORRECTIONS);
    }
  }
  prep.corrections.set(key, found);
  return found;
}

/** Hur ett rättat ord skrivs i texten, med å, ä och ö, för raden "Visar träffar för". */
function displayForm(prep: PreparedIndex, word: string): string {
  const first = prep.fuzzy?.postings.get(word)?.[0];
  if (first === undefined) return word;
  const { entry } = prep.entries[first >> 3];
  for (const source of [entry.title, entry.meta ?? "", entry.keywords ?? "", KIND_LABELS[entry.kind], entry.text ?? ""]) {
    const { folded, map } = foldWithMap(source);
    let from = 0;
    for (;;) {
      const at = folded.indexOf(word, from);
      if (at === -1) break;
      const end = at + word.length;
      if ((at === 0 || folded[at - 1] === " ") && (end === folded.length || folded[end] === " ")) {
        return source.slice(map[at], map[end - 1] + 1).toLowerCase();
      }
      from = at + 1;
    }
  }
  return word;
}

/** Ett stycke runt första träffen i brödtexten, avkortat vid hela ord. */
export function makeSnippet(text: string, terms: string[], before = 60, length = 170): string | undefined {
  if (!text) return undefined;
  const { folded, map } = foldWithMap(text);
  let first = -1;
  for (const term of terms) {
    const at = folded.indexOf(term);
    if (at !== -1 && (first === -1 || at < first)) first = at;
  }
  if (first === -1) return undefined;
  const pos = map[first];
  let start = Math.max(0, pos - before);
  if (start > 0) {
    const space = text.indexOf(" ", start);
    start = space !== -1 && space < pos ? space + 1 : start;
  }
  let end = Math.min(text.length, start + length);
  if (end < text.length) {
    const space = text.lastIndexOf(" ", end);
    end = space > pos ? space : end;
  }
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}

/** Tentastatistik: kurskoder som börjar med det man skrivit, när frågan ser ut som en kurskod (tre till sex tecken med siffror). */
export function courseEntries(query: string, codes: string[], max = 5): SearchEntry[] {
  const q = query.replace(/[\s-]+/g, "").toUpperCase();
  if (q.length < 3 || q.length > 6 || !/\d/.test(q) || !/^[A-Z0-9]+$/.test(q)) return [];
  const hits = codes.filter((c) => c.startsWith(q));
  return hits.slice(0, max).map((code) => ({
    href: `/tentastatistik/${code}`,
    kind: "kurs" as const,
    title: code,
    meta: "Betyg per tentatillfälle",
    boost: code === q ? 10 : 0,
  }));
}

/** Alla sökord måste finnas i träffen, exakt eller rättat. Sorteras efter poäng, sedan boost och sist rubrik. */
export function search(prep: PreparedIndex, query: string, codes: string[] = []): SearchResult {
  const terms = queryTerms(query);
  if (terms.length === 0) return { hits: [], terms, corrected: [] };
  // Utan mellanslag på slutet håller man fortfarande på med sista ordet.
  const typing = /[a-z0-9]$/.test(fold(query.slice(-2)));
  const fixes = terms.map((term, k) => correctionsFor(prep, term, typing && k === terms.length - 1));

  const fuzzyScores = fixes.map((list) => {
    if (list.length === 0 || !prep.fuzzy) return null;
    const scores = new Map<number, { score: number; textOnly: boolean }>();
    for (const { word, cost } of list) {
      const factor = cost === 1 ? 0.6 : 0.4;
      for (const posting of prep.fuzzy.postings.get(word) ?? []) {
        const at = posting >> 3;
        const field = posting & 7;
        const score = Math.max(1, Math.round(((field & 1 ? 30 : 0) + (field & 2 ? 9 : 0) + (field & 4 ? 3 : 0)) * factor));
        const old = scores.get(at);
        if (!old || score > old.score) scores.set(at, { score, textOnly: field === 4 });
      }
    }
    return scores;
  });

  const phrase = terms.join(" ");
  const hits: SearchHit[] = [];
  entries: for (let at = 0; at < prep.entries.length; at++) {
    const p = prep.entries[at];
    let score = 0;
    let inText = false;
    for (let k = 0; k < terms.length; k++) {
      const term = terms[k];
      const t = fieldScore(p.title, term, 30, 20, 18, 12);
      const e = fieldScore(p.extra, term, 9, 7, 6, 4);
      const b = fieldScore(p.text, term, 3, 2, 2, 1);
      if (t + e + b > 0) {
        if (t === 0 && e === 0) inText = true;
        score += t + e + b;
        continue;
      }
      const fuzzy = fuzzyScores[k]?.get(at);
      if (!fuzzy) continue entries;
      if (fuzzy.textOnly) inText = true;
      score += fuzzy.score;
    }
    // Hela frågan i rubriken: som fras när den har flera ord, annars som helt ord, början eller slutet av ett ord.
    if (terms.length > 1 ? p.title.includes(" " + phrase) : fieldScore(p.title, phrase, 1, 1, 1, 0) > 0) score += terms.length > 1 ? 25 : 10;
    if (p.title.startsWith(" " + phrase)) score += 8;
    if (p.entry.kind === "sida") score += 4;
    hits.push({ entry: p.entry, score, inText });
  }

  for (const entry of courseEntries(query, codes)) hits.push({ entry, score: 40 + (entry.boost ?? 0), inText: false });

  hits.sort(
    (a, b) =>
      b.score - a.score || (b.entry.boost ?? 0) - (a.entry.boost ?? 0) || a.entry.title.localeCompare(b.entry.title, "sv"),
  );

  const corrected = [...new Set(fixes.flat().map((c) => c.word))];
  let suggestion: string | undefined;
  if (corrected.length > 0) {
    const best = new Map<string, string>();
    terms.forEach((term, k) => {
      if (fixes[k][0]) best.set(term, displayForm(prep, fixes[k][0].word));
    });
    suggestion = query
      .trim()
      .split(/\s+/)
      .map((word) => best.get(fold(word).trim()) ?? word)
      .join(" ");
  }
  return { hits: hits.slice(0, MAX_HITS), terms, corrected, suggestion };
}

/**
 * Delar texten i bitar där sökorden är markerade, för <mark> i träfflistan. Bygger aldrig HTML. Rättade ord (whole) markeras bara
 * som hela ord.
 */
export function highlight(text: string, terms: string[], whole: string[] = []): { text: string; hit: boolean }[] {
  if (!text || terms.length + whole.length === 0) return [{ text, hit: false }];
  const { folded, map } = foldWithMap(text);
  const ranges: [number, number][] = [];
  const mark = (term: string, wholeOnly: boolean) => {
    let from = 0;
    while (from <= folded.length) {
      const at = folded.indexOf(term, from);
      if (at === -1) break;
      const end = at + term.length;
      const starts = at === 0 || folded[at - 1] === " ";
      const ends = end === folded.length || folded[end] === " ";
      // Korta ord markeras bara i början av ett ord, samma regel som när träffarna räknas.
      if (wholeOnly ? starts && ends : term.length >= 3 || starts) ranges.push([map[at], map[end - 1] + 1]);
      from = end;
    }
  };
  for (const term of terms) mark(term, false);
  for (const word of whole) mark(word, true);
  if (ranges.length === 0) return [{ text, hit: false }];
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([r[0], r[1]]);
  }
  const parts: { text: string; hit: boolean }[] = [];
  let pos = 0;
  for (const [a, b] of merged) {
    if (a > pos) parts.push({ text: text.slice(pos, a), hit: false });
    parts.push({ text: text.slice(a, b), hit: true });
    pos = b;
  }
  if (pos < text.length) parts.push({ text: text.slice(pos), hit: false });
  return parts;
}
