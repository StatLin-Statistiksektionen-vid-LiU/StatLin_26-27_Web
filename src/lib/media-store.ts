import crypto from "node:crypto";
import { renameSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import type Database from "better-sqlite3";
import sharp, { type Metadata } from "sharp";
import { getDb, ORIGINALS_DIR, UPLOADS_DIR } from "./db";
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

/** Filändelsen för originalet efter formatet sharp läste, inte efter filnamnet. */
function originalExt(meta: Metadata): string {
  if (meta.format === "jpeg") return "jpg";
  if (meta.format === "heif") return meta.compression === "av1" ? "avif" : "heic";
  return meta.format ?? "bin";
}

/** Filerna som hunnit skrivas när något senare i sparningen misslyckas – annars blev de kvar utan rad (SD-21). */
async function removeFiles(files: string[]) {
  await Promise.all(files.map((f) => fs.rm(f, { force: true })));
}

/**
 * Sparar en bild i flera bredder som WebP. Bilden roteras enligt EXIF och all
 * metadata (t.ex. GPS-position från mobilkameror) tas bort. Bilden avkodas en gång (ST-06).
 * Originalet sparas orört (med sin metadata) i ORIGINALS_DIR/<base>.<ext>, utanför /media/ (SD-30).
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

  // Största storleken: högst 2000 px bred, och höjden följer med.
  let largest = Math.min(srcWidth, IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1]);
  // Mellanbufferten har en egen gräns: 12 Mpx × 4 B = 48 MB råpixlar per uppladdning, tre parallella ≈ 150 MB. En hög bild
  // godtas, men dess största storlek blir smalare än 2000 px – så smal att ytan blir ≈ 12 Mpx med bildens proportioner
  // (1000 × 20 000 → 774 × 15 480).
  if (largest * Math.round((srcHeight * largest) / srcWidth) > 12e6) largest = Math.floor(Math.sqrt((12e6 * srcWidth) / srcHeight));
  const outH = Math.round((srcHeight * largest) / srcWidth);
  // WebP klarar högst 16 383 px. En bild som fortfarande är för hög efter gränsen (500 × 20 000) nekas här, före avkodningen,
  // i stället för att fela i sharp efter en stor allokering.
  if (outH > 16383) throw new MediaError("Bilden är för hög (högst 16 383 pixlar efter förminskning). Beskär den och försök igen.");
  const widths = IMAGE_WIDTHS.filter((w) => w < largest);
  widths.push(largest);
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
      .resize({ width: largest, withoutEnlargement: true })
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
    const { dominant, isOpaque } = await sharp(data, pixels).stats();
    // En bild med genomskinliga delar (en logga) får ingen färg bakom sig: efter förminskningen har de genomskinliga
    // pixlarna RGB 0, och den "dominanta" färgen blev nästan svart.
    const color = isOpaque ? `#${[dominant.r, dominant.g, dominant.b].map((c) => c.toString(16).padStart(2, "0")).join("")}` : "transparent";

    // Huvudkopian: de publicerade storlekarna är förlustkomprimerade och högst 2000 px, så utan den går en bild inte att
    // trycka eller generera om i efterhand.
    const original = path.join(ORIGINALS_DIR, `${base}.${originalExt(meta)}`);
    await fs.mkdir(path.dirname(original), { recursive: true });
    written.push(original);
    await fs.writeFile(original, buffer);

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

const fileExt = (file: File) => (file.name.split(".").pop() ?? "").toLowerCase();

/** Kontrollerna för ett dokument: storlek, tillåten filändelse och PDF-huvud. */
async function readDocument(file: File): Promise<{ ext: string; mime: string; buffer: Buffer }> {
  if (file.size > MAX_FILE_BYTES) throw new MediaError("Filen är för stor (max 30 MB).");
  const ext = fileExt(file);
  const mime = fileMime(ext);
  if (!mime) throw new MediaError(`Filtypen .${ext} stöds inte. Tillåtna: ${Object.keys(FILE_TYPES).join(", ")}.`);
  const buffer = Buffer.from(await file.arrayBuffer());
  if (ext === "pdf" && buffer.subarray(0, 5).toString() !== "%PDF-") {
    throw new MediaError("Filen ser inte ut att vara en giltig PDF.");
  }
  return { ext, mime, buffer };
}

export async function storeFile(file: File, userId: number | null): Promise<Media> {
  const { ext, mime, buffer } = await readDocument(file);
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

/**
 * Samma fil som raden redan har – namn och storlek (SD-35)? Filväljaren skickar den igen vid nästa sparning om den inte
 * tömts, och då ska den inte laddas upp på nytt.
 */
export function isSameUpload(m: Pick<Media, "original_name" | "size">, file: File): boolean {
  return m.original_name === file.name.slice(0, 200) && m.size === file.size;
}

/**
 * Ersätter dokumentet bakom en befintlig rad (SD-35). Med samma filändelse skrivs filen över och adressen består, så länkar
 * som redan delats – i nyhetsbrev, på Lisam, i protokoll – leder till den nya versionen. Med en annan filändelse, eller när
 * raden är en bild, blir det en ny rad med ny adress, som förut.
 */
export async function replaceFile(old: Media, file: File, userId: number | null): Promise<Media> {
  if (old.kind !== "file" || old.ext !== fileExt(file)) return storeFile(file, userId);
  const { ext, mime, buffer } = await readDocument(file);
  // turbopackIgnore: renameSync nedan får annars bygget att spåra hela projektet in i .next/standalone (.claude, .git, Dockerfile, ...).
  const target = path.join(/* turbopackIgnore: true */ UPLOADS_DIR, `${old.path_base}.${ext}`);
  // Den nya filen skrivs bredvid och byter sedan plats med den gamla, så att ingen laddar ner en halvskriven fil. Blir den
  // kvar efter ett avbrott är den en fil utan rad, som gallringen tar bort.
  const temp = path.join(/* turbopackIgnore: true */ path.dirname(target), `${crypto.randomUUID()}.${ext}`);
  try {
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(temp, buffer);
    const db = getDb();
    return db.transaction(() => {
      const res = db
        .prepare("UPDATE media SET original_name = ?, mime = ?, size = ?, uploaded_by = ? WHERE id = ?")
        .run(file.name.slice(0, 200), mime, file.size, userId, old.id);
      // Raderades dokumentet medan filen skrevs finns ingen rad att ersätta – då läggs ingen fil på den gamla adressen.
      if (res.changes === 0) throw new MediaError("Filen har tagits bort under tiden – ladda upp den igen.");
      // I transaktionen: misslyckas bytet rullas raden tillbaka.
      renameSync(temp, target);
      return db.prepare("SELECT * FROM media WHERE id = ?").get(old.id) as Media;
    })();
  } catch (err) {
    await removeFiles([temp]);
    throw err;
  }
}

/** Kolumnerna som pekar på en rad i media med dess id. */
const ID_COLUMNS = [
  ["event_images", "media_id"],
  ["events", "cover_media_id"],
  ["news", "cover_media_id"],
  ["board_members", "photo_media_id"],
  ["partners", "logo_media_id"],
  ["documents", "media_id"],
  ["resources", "media_id"],
] as const;
const USED_BY_ID = `SELECT ${ID_COLUMNS.map(([t, c]) => `(SELECT COUNT(*) FROM ${t} WHERE ${c} = @id)`).join(" + ")} AS n`;
/** Alla id som kolumnerna pekar på, för gallringen: en fråga i stället för en per rad. */
const REFERENCED_IDS = ID_COLUMNS.map(([t, c]) => `SELECT ${c} FROM ${t} WHERE ${c} IS NOT NULL`).join(" UNION ");

/**
 * Ställena där adressen (/media/<path_base>…) kan stå i stället för id:t (SD-09): utskottens loggor, som sparas som adress,
 * Markdown-texterna – där redigeraren lägger in bilder – och länkfälten som godtar adresser som börjar med / (zUrl), samt
 * uppdragens texter och inställningarna (meddelandets länk).
 */
const USED_BY_ADDRESS = `SELECT
  (SELECT COUNT(*) FROM committees WHERE logo_url LIKE @pattern OR description_md LIKE @pattern OR instagram LIKE @pattern) +
  (SELECT COUNT(*) FROM news WHERE body_md LIKE @pattern) +
  (SELECT COUNT(*) FROM events WHERE body_md LIKE @pattern OR signup_url LIKE @pattern OR location_url LIKE @pattern) +
  (SELECT COUNT(*) FROM pages WHERE body_md LIKE @pattern) +
  (SELECT COUNT(*) FROM links WHERE url LIKE @pattern) +
  (SELECT COUNT(*) FROM resources WHERE url LIKE @pattern) +
  (SELECT COUNT(*) FROM documents WHERE url LIKE @pattern) +
  (SELECT COUNT(*) FROM partners WHERE url LIKE @pattern) +
  (SELECT COUNT(*) FROM tasks WHERE description LIKE @pattern) +
  (SELECT COUNT(*) FROM task_comments WHERE body LIKE @pattern) +
  (SELECT COUNT(*) FROM settings WHERE value LIKE @pattern) AS n`;

/** Frågorna förbereds en gång per databashandtag, inte en gång per rad. */
const usageStatements = new WeakMap<Database.Database, { byId: Database.Statement; byAddress: Database.Statement }>();

/** Används bilden eller filen någonstans – med id eller med sin adress? Samma räkning gäller borttagning och gallring. */
function mediaInUse(m: Pick<Media, "id" | "path_base">): boolean {
  const db = getDb();
  let s = usageStatements.get(db);
  if (!s) usageStatements.set(db, (s = { byId: db.prepare(USED_BY_ID), byAddress: db.prepare(USED_BY_ADDRESS) }));
  if ((s.byId.get({ id: m.id }) as { n: number }).n > 0) return true;
  // path_base är "ÅÅÅÅ/MM/<uuid>" (newBase): siffror, a–f, - och /. LIKE:s jokertecken % och _ kan inte förekomma, och
  // gjorde de det skulle mönstret bara träffa fler rader – bilden räknades då som använd och stod kvar.
  return (s.byAddress.get({ pattern: `%${m.path_base}%` }) as { n: number }).n > 0;
}

/** Originalet till en bild: ORIGINALS_DIR/<base>.<ext>. Filändelsen står inte i raden, så det hittas på namnet. */
async function originalFiles(base: string): Promise<string[]> {
  const dir = path.join(ORIGINALS_DIR, path.dirname(base));
  const names = await fs.readdir(dir).catch(() => [] as string[]);
  return names.filter((n) => n.startsWith(`${path.basename(base)}.`)).map((n) => path.join(dir, n));
}

/**
 * Raden, filerna och originalet. Anroparen har kontrollerat att inget använder dem, i samma synkrona steg som raden tas bort
 * här. Svarar false om raden redan var borta (då har den som tog bort den också tagit filerna).
 */
async function removeMedia(m: Media): Promise<boolean> {
  if (getDb().prepare("DELETE FROM media WHERE id = ?").run(m.id).changes === 0) return false;
  const files =
    m.kind === "image"
      ? m.variants.split(",").filter(Boolean).map((w) => `${m.path_base}-${w}.webp`)
      : [`${m.path_base}.${m.ext}`];
  await removeFiles([...files.map((f) => path.join(UPLOADS_DIR, f)), ...(await originalFiles(m.path_base))]);
  return true;
}

/** Tar bort mediefilen om den inte längre används någonstans – varken med id eller med adressen i en text eller länk. */
export async function deleteMediaIfUnused(mediaId: number | null | undefined) {
  if (!mediaId) return;
  const m = getDb().prepare("SELECT * FROM media WHERE id = ?").get(mediaId) as Media | undefined;
  if (!m || mediaInUse(m)) return;
  await removeMedia(m);
}

/** En uppladdad fil: ÅÅÅÅ/MM/<uuid>, med -<bredd> för bilderna, och en filändelse – samma mönster som /media/-rutten. */
const UPLOAD_NAME = /^(\d{4}\/\d{2}\/[0-9a-f-]{36})(?:-\d{2,5})?\.[a-z0-9]{2,5}$/;

/**
 * Gallring (ST-17): rader som inget använder (mediaInUse, samma räkning som deleteMediaIfUnused) och filer i uploads/ som
 * saknar rad – båda först när de är äldre än olderThanDays. En bild laddas upp så fort den väljs i ett formulär, så
 * åldersgränsen skyddar det någon håller på med. Originalen gallras med sina rader, aldrig på egen hand.
 */
export async function pruneOrphanMedia({ olderThanDays = 7 }: { olderThanDays?: number } = {}): Promise<{ rows: number; files: number }> {
  const db = getDb();
  const cutoff = Date.now() - olderThanDays * 86_400_000;
  // Det som någon kolumn pekade på när gallringen började står kvar. Övriga rader räknas på nytt (mediaInUse) i samma
  // synkrona steg som de tas bort, så en sparning som hinner peka på en rad under gallringen syns.
  const referenced = new Set(db.prepare(REFERENCED_IDS).pluck().all() as number[]);
  let rows = 0;
  for (const m of db.prepare("SELECT * FROM media WHERE created_at < ? ORDER BY id").all(new Date(cutoff).toISOString()) as Media[]) {
    // Händelseloopen släpps mellan raderna, så att sajten svarar medan en lång gallring pågår.
    await new Promise((resolve) => setImmediate(resolve));
    if (referenced.has(m.id) || mediaInUse(m)) continue;
    if (await removeMedia(m)) rows++;
  }
  const known = new Set((db.prepare("SELECT path_base FROM media").all() as { path_base: string }[]).map((r) => r.path_base));
  let files = 0;
  // Relativa sökvägar (readdir med recursive, Node 20.1+); Dirent.parentPath finns först i Node 20.12.
  const entries = await fs.readdir(UPLOADS_DIR, { recursive: true }).catch(() => [] as string[]);
  for (const rel of entries) {
    // Bara filer med uppladdningarnas namn – något annat i katalogen har sajten inte lagt dit. Windows ger \ i sökvägen.
    const base = UPLOAD_NAME.exec(rel.split(path.sep).join("/"))?.[1];
    if (!base || known.has(base)) continue;
    const abs = path.join(UPLOADS_DIR, rel);
    const stat = await fs.stat(abs).catch(() => null);
    if (!stat?.isFile() || stat.mtimeMs >= cutoff) continue;
    await fs.rm(abs, { force: true });
    files++;
  }
  return { rows, files };
}
