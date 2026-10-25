import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { UPLOADS_DIR } from "@/lib/db";
import { FILE_TYPES } from "@/lib/file-types";

const SAFE_PATH = /^\d{4}\/\d{2}\/[a-f0-9-]{36}(-\d{2,5})?\.([a-z0-9]{2,5})$/;

/** Serverar uppladdade filer från DATA_DIR. Filnamnen är unika, så de kan cachas för evigt. */
export async function GET(request: Request, ctx: RouteContext<"/media/[...path]">) {
  const { path: segments } = await ctx.params;
  const rel = segments.join("/");
  const match = SAFE_PATH.exec(rel);
  if (!match) return new Response("Hittades inte", { status: 404 });

  const ext = match[2];
  const type = ext === "webp" ? "image/webp" : FILE_TYPES[ext];
  if (!type) return new Response("Hittades inte", { status: 404 });

  const abs = path.join(UPLOADS_DIR, rel);
  let stat: fs.Stats;
  try {
    stat = await fs.promises.stat(abs);
  } catch {
    return new Response("Hittades inte", { status: 404 });
  }

  const download = new URL(request.url).searchParams.has("ladda-ner");
  const headers = new Headers({
    "Content-Type": type,
    "Content-Length": String(stat.size),
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  });
  if (ext !== "webp") {
    headers.set("Content-Disposition", `${download ? "attachment" : "inline"}; filename="statlin-${path.basename(rel)}"`);
    headers.set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  }
  const stream = Readable.toWeb(fs.createReadStream(abs)) as ReadableStream;
  return new Response(stream, { headers });
}
