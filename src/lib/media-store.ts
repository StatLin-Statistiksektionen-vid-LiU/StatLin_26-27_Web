import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp, { type Metadata } from "sharp";
import { getDb, UPLOADS_DIR } from "./db";
import type { Media } from "./types";
import { FILE_TYPES } from "./file-types";

export { FILE_TYPES };

export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
export const MAX_FILE_BYTES = 30 * 1024 * 1024;

const IMAGE_WIDTHS = [480, 1200, 2000];

const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/heic", "image/heif"]);



export class MediaError extends Error {}

function newBase(): string {
  const now = new Date();
  const dir = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return `${dir}/${crypto.randomUUID()}`;
}

export function isImageUpload(file: File): boolean {
  return IMAGE_MIME.has(file.type) || /\.(jpe?g|png|webp|gif|avif|heic|heif)$/i.test(file.name);
}

/**
 * Sparar en bild i flera bredder som WebP. Bilden roteras enligt EXIF och all
 * metadata (t.ex. GPS-position från mobilkameror) tas bort.
 */
export async function storeImage(file: File, userId: number | null, alt = ""): Promise<Media> {
  if (file.size > MAX_IMAGE_BYTES) throw new MediaError("Bilden är för stor (max 25 MB).");
  const buffer = Buffer.from(await file.arrayBuffer());

  let meta: Metadata;
  try {
    meta = await sharp(buffer, { failOn: "error" }).metadata();
  } catch {
    throw new MediaError("Filen kunde inte läsas som en bild.");
  }
  const rotated = (meta.orientation ?? 1) >= 5;
  const srcWidth = (rotated ? meta.height : meta.width) ?? 0;
  const srcHeight = (rotated ? meta.width : meta.height) ?? 0;
  if (!srcWidth || !srcHeight) throw new MediaError("Bilden saknar giltiga mått.");

  const widths = IMAGE_WIDTHS.filter((w) => w < srcWidth);
  widths.push(Math.min(srcWidth, IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1]));
  const unique = [...new Set(widths)].sort((a, b) => a - b);

  const base = newBase();
  await fs.mkdir(path.join(UPLOADS_DIR, path.dirname(base)), { recursive: true });

  let outW = srcWidth;
  let outH = srcHeight;
  for (const w of unique) {
    const info = await sharp(buffer, { animated: false })
      .rotate()
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: w <= 480 ? 72 : 80, effort: 4 })
      .toFile(path.join(UPLOADS_DIR, `${base}-${w}.webp`));
    outW = info.width;
    outH = info.height;
  }

  const { dominant } = await sharp(buffer).rotate().resize(64).stats();
  const color = `#${[dominant.r, dominant.g, dominant.b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;

  const db = getDb();
  const res = db
    .prepare(
      `INSERT INTO media (kind, path_base, ext, variants, original_name, mime, size, width, height, color, alt, uploaded_by)
       VALUES ('image', ?, 'webp', ?, ?, 'image/webp', ?, ?, ?, ?, ?, ?)`,
    )
    .run(base, unique.join(","), file.name.slice(0, 200), file.size, outW, outH, color, alt.slice(0, 300), userId);
  return db.prepare("SELECT * FROM media WHERE id = ?").get(res.lastInsertRowid) as Media;
}

export async function storeFile(file: File, userId: number | null): Promise<Media> {
  if (file.size > MAX_FILE_BYTES) throw new MediaError("Filen är för stor (max 30 MB).");
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const mime = FILE_TYPES[ext];
  if (!mime) throw new MediaError(`Filtypen .${ext} stöds inte. Tillåtna: ${Object.keys(FILE_TYPES).join(", ")}.`);
  const buffer = Buffer.from(await file.arrayBuffer());
  if (ext === "pdf" && buffer.subarray(0, 5).toString() !== "%PDF-") {
    throw new MediaError("Filen ser inte ut att vara en giltig PDF.");
  }
  const base = newBase();
  await fs.mkdir(path.join(UPLOADS_DIR, path.dirname(base)), { recursive: true });
  await fs.writeFile(path.join(UPLOADS_DIR, `${base}.${ext}`), buffer);
  const db = getDb();
  const res = db
    .prepare(
      `INSERT INTO media (kind, path_base, ext, variants, original_name, mime, size, uploaded_by)
       VALUES ('file', ?, ?, '', ?, ?, ?, ?)`,
    )
    .run(base, ext, file.name.slice(0, 200), mime, file.size, userId);
  return db.prepare("SELECT * FROM media WHERE id = ?").get(res.lastInsertRowid) as Media;
}

/** Tar bort mediefilen om den inte längre används någonstans. */
export async function deleteMediaIfUnused(mediaId: number | null | undefined) {
  if (!mediaId) return;
  const db = getDb();
  const used = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM event_images WHERE media_id = @id) +
        (SELECT COUNT(*) FROM events WHERE cover_media_id = @id) +
        (SELECT COUNT(*) FROM news WHERE cover_media_id = @id) +
        (SELECT COUNT(*) FROM board_members WHERE photo_media_id = @id) +
        (SELECT COUNT(*) FROM partners WHERE logo_media_id = @id) +
        (SELECT COUNT(*) FROM documents WHERE media_id = @id) +
        (SELECT COUNT(*) FROM committees WHERE logo_url LIKE '%' || (SELECT path_base FROM media WHERE id = @id) || '%') AS n`,
    )
    .get({ id: mediaId }) as { n: number };
  if (used.n > 0) return;
  const m = db.prepare("SELECT * FROM media WHERE id = ?").get(mediaId) as Media | undefined;
  if (!m) return;
  db.prepare("DELETE FROM media WHERE id = ?").run(mediaId);
  const files =
    m.kind === "image"
      ? m.variants.split(",").filter(Boolean).map((w) => `${m.path_base}-${w}.webp`)
      : [`${m.path_base}.${m.ext}`];
  await Promise.all(files.map((f) => fs.rm(path.join(UPLOADS_DIR, f), { force: true })));
}
