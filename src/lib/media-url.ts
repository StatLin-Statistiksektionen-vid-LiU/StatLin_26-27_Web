import type { ImageRef, Media } from "./types";

export function variantWidths(m: Pick<Media, "variants">): number[] {
  return m.variants
    .split(",")
    .map(Number)
    .filter((n) => n > 0)
    .sort((a, b) => a - b);
}

export function toImageRef(m: Media | null | undefined): ImageRef | null {
  if (!m || m.kind !== "image") return null;
  const widths = variantWidths(m);
  if (widths.length === 0) return null;
  const url = (w: number) => `/media/${m.path_base}-${w}.webp`;
  const main = widths.find((w) => w >= 1200) ?? widths[widths.length - 1];
  return {
    id: m.id,
    src: url(main),
    srcSet: widths.map((w) => `${url(w)} ${w}w`).join(", "),
    thumb: url(widths[0]),
    width: m.width ?? 1200,
    height: m.height ?? 800,
    color: m.color ?? "#1b1b1b",
    alt: m.alt,
  };
}

export function fileHref(m: Pick<Media, "path_base" | "ext">): string {
  return `/media/${m.path_base}.${m.ext}`;
}

/** Tolkar json_object()-kolumner från SQLite till Media. */
export function parseMediaJson(json: string | null | undefined): Media | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as Media;
  } catch {
    return null;
  }
}

export const MEDIA_JSON_COLUMNS = (alias: string) =>
  `CASE WHEN ${alias}.id IS NULL THEN NULL ELSE json_object(
    'id', ${alias}.id, 'kind', ${alias}.kind, 'path_base', ${alias}.path_base, 'ext', ${alias}.ext,
    'variants', ${alias}.variants, 'original_name', ${alias}.original_name, 'mime', ${alias}.mime,
    'size', ${alias}.size, 'width', ${alias}.width, 'height', ${alias}.height, 'color', ${alias}.color,
    'alt', ${alias}.alt, 'uploaded_by', ${alias}.uploaded_by, 'created_at', ${alias}.created_at) END`;
