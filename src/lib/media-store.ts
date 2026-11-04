import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp, { type Metadata } from "sharp";
import { getDb, UPLOADS_DIR } from "./db";
import type { Media } from "./types";
import { FILE_TYPES, fileMime } from "./file-types";

export { FILE_TYPES };

export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
export const MAX_FILE_BYTES = 30 * 1024 * 1024;

const IMAGE_WIDTHS = [480, 1200, 2000];

/**
 * Pixelgränsen i varje sharp()-anrop. 40 Mpx räcker gott för den största bredden (2000 px); sharps egen gräns, 268 Mpx,
 * är över 1 GB råpixlar – mer än maskinens minne – och en liten PNG kan ha sådana mått.
 */
const PIXEL_LIMIT = { limitInputPixels: 40e6 };
const TOO_MANY_PIXELS = "Bilden är för stor (max 40 megapixlar, t.ex. 8000 × 5000 pixlar). Förminska den och försök igen.";
const isPixelLimit = (err: unknown) => err instanceof Error && /exceeds pixel limit/i.test(err.message);

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

/** Filerna som hunnit skrivas när något senare i sparningen misslyckas – annars blev de kvar utan rad (SD-21). */
async function removeFiles(files: string[]) {
  await Promise.all(files.map((f) => fs.rm(f, { force: true })));
}

/**
 * Sparar en bild i flera bredder som WebP. Bilden roteras enligt EXIF och all
 * metadata (t.ex. GPS-position från mobilkameror) tas bort. Bilden avkodas en gång (ST-06).
 */
export async function storeImage(file: File, userId: number | null, alt = ""): Promise<Media> {
  if (file.size > MAX_IMAGE_BYTES) throw new MediaError("Bilden är för stor (max 25 MB).");
  const buffer = Buffer.from(await file.arrayBuffer());

  let meta: Metadata;
  try {
    meta = await sharp(buffer, { failOn: "error", ...PIXEL_LIMIT }).metadata();
  } catch (err) {
    throw new MediaError(isPixelLimit(err) ? TOO_MANY_PIXELS : "Filen kunde inte läsas som en bild.");
  }
  // sharps förbyggda binär saknar HEVC-avkodare: HEIC (iPhones standardformat) går att läsa mått från men inte avkoda.
  if (meta.format === "heif" && meta.compression === "hevc") {
    throw new MediaError("HEIC-bilder (iPhones standardformat) stöds inte. Spara bilden som JPG och försök igen.");
  }
  const rotated = (meta.orientation ?? 1) >= 5;
  const srcWidth = (rotated ? meta.height : meta.width) ?? 0;
  const srcHeight = (rotated ? meta.width : meta.height) ?? 0;
  if (!srcWidth || !srcHeight) throw new MediaError("Bilden saknar giltiga mått.");

  const widths = IMAGE_WIDTHS.filter((w) => w < srcWidth);
  widths.push(Math.min(srcWidth, IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1]));
  const unique = [...new Set(widths)].sort((a, b) => a - b);

  const base = newBase();
  const written: string[] = [];
  try {
    await fs.mkdir(path.join(UPLOADS_DIR, path.dirname(base)), { recursive: true });

    // En avkodning: roterad enligt EXIF och förminskad till den största bredden, som råa pixlar i en mellanbuffert.
    // De mindre bredderna och färgen tas ur den – inte ur originalet igen, och inte med .clone(), vars grenar avkodar
    // var för sig och körda parallellt höjer toppminnet (R-28).
    const { data, info } = await sharp(buffer, { animated: false, ...PIXEL_LIMIT })
      .rotate()
      .resize({ width: unique[unique.length - 1], withoutEnlargement: true })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const pixels = { raw: { width: info.width, height: info.height, channels: info.channels }, ...PIXEL_LIMIT };

    for (const w of unique) {
      const out = path.join(UPLOADS_DIR, `${base}-${w}.webp`);
      written.push(out);
      const img = sharp(data, pixels);
      await (w < info.width ? img.resize({ width: w }) : img).webp({ quality: w <= 480 ? 72 : 80, effort: 4 }).toFile(out);
    }

    // stats() räknar alltid på indata (sharps dokumentation) – här mellanbufferten. Den tidigare
    // sharp(buffer).rotate().resize(64).stats() avkodade därför hela originalet en gång till.
    const { dominant } = await sharp(data, pixels).stats();
    const color = `#${[dominant.r, dominant.g, dominant.b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;

    const db = getDb();
    return db.transaction(() => {
      const res = db
        .prepare(
          `INSERT INTO media (kind, path_base, ext, variants, original_name, mime, size, width, height, color, alt, uploaded_by)
           VALUES ('image', ?, 'webp', ?, ?, 'image/webp', ?, ?, ?, ?, ?, ?)`,
        )
        .run(base, unique.join(","), file.name.slice(0, 200), file.size, info.width, info.height, color, alt.slice(0, 300), userId);
      return db.prepare("SELECT * FROM media WHERE id = ?").get(res.lastInsertRowid) as Media;
    })();
  } catch (err) {
    await removeFiles(written);
    throw isPixelLimit(err) ? new MediaError(TOO_MANY_PIXELS) : err;
  }
}

export async function storeFile(file: File, userId: number | null): Promise<Media> {
  if (file.size > MAX_FILE_BYTES) throw new MediaError("Filen är för stor (max 30 MB).");
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  const mime = fileMime(ext);
  if (!mime) throw new MediaError(`Filtypen .${ext} stöds inte. Tillåtna: ${Object.keys(FILE_TYPES).join(", ")}.`);
  const buffer = Buffer.from(await file.arrayBuffer());
  if (ext === "pdf" && buffer.subarray(0, 5).toString() !== "%PDF-") {
    throw new MediaError("Filen ser inte ut att vara en giltig PDF.");
  }
  const base = newBase();
  const target = path.join(UPLOADS_DIR, `${base}.${ext}`);
  try {
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, buffer);
    const db = getDb();
    return db.transaction(() => {
      const res = db
        .prepare(
          `INSERT INTO media (kind, path_base, ext, variants, original_name, mime, size, uploaded_by)
           VALUES ('file', ?, ?, '', ?, ?, ?, ?)`,
        )
        .run(base, ext, file.name.slice(0, 200), mime, file.size, userId);
      return db.prepare("SELECT * FROM media WHERE id = ?").get(res.lastInsertRowid) as Media;
    })();
  } catch (err) {
    await removeFiles([target]);
    throw err;
  }
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
        (SELECT COUNT(*) FROM resources WHERE media_id = @id) +
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
