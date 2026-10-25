export { clsx as cn } from "clsx";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/å|ä/g, "a")
    .replace(/ö/g, "o")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} kB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Deterministisk hash → används för generativ grafik (omslag, avatarer). */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function stripMarkdown(md: string, max = 180): string {
  const text = md
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text;
}

export function safeExternalUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url, "https://example.invalid");
    if (u.origin === "https://example.invalid") return url.startsWith("/") ? url : null;
    return ["http:", "https:", "mailto:"].includes(u.protocol) ? u.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Teckenstorlek för stora rubriker som anpassas efter längsta ordet, så att
 * långa svenska sammansättningar ("Mottagningsgasque") inte bryts mitt i ordet.
 * charWidth = ungefärlig teckenbredd i em för typsnittet (Archivo Expanded ≈ 0.86).
 */
export function fitHeading(text: string, opts: { maxRem: number; maxVw: number; charWidth?: number; usableVw?: number }) {
  const longest = Math.max(4, ...text.split(/\s+/).map((w) => w.length));
  const vw = Math.min(opts.maxVw, (opts.usableVw ?? 88) / (longest * (opts.charWidth ?? 0.86)));
  return { fontSize: `clamp(1.4rem, ${vw.toFixed(2)}vw, ${opts.maxRem}rem)` };
}
