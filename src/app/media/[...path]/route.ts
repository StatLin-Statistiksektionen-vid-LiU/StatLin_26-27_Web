import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { UPLOADS_DIR } from "@/lib/db";
import { fileMime } from "@/lib/file-types";

const SAFE_PATH = /^\d{4}\/\d{2}\/[a-f0-9-]{36}(-\d{2,5})?\.([a-z0-9]{2,5})$/;

/**
 * Serverar uppladdade filer från DATA_DIR. En bild får ett nytt filnamn när den byts och cachas för evigt. Ett dokument kan
 * ersättas under samma adress (SD-35), så webbläsaren frågar om det ändrats (Last-Modified) i stället för att spara det ett år.
 */
export async function GET(request: Request, ctx: RouteContext<"/media/[...path]">) {
  const { path: segments } = await ctx.params;
  const rel = segments.join("/");
  const match = SAFE_PATH.exec(rel);
  if (!match) return new Response("Hittades inte", { status: 404 });

  const ext = match[2];
  const type = ext === "webp" ? "image/webp" : fileMime(ext);
  if (!type) return new Response("Hittades inte", { status: 404 });

  const abs = path.join(UPLOADS_DIR, rel);
  let stat: fs.Stats;
  try {
    stat = await fs.promises.stat(abs);
  } catch {
    return new Response("Hittades inte", { status: 404 });
  }

  // En SVG kan bära skript och öppnas aldrig i webbläsaren. CSP-sandboxen nedan stoppar skriptet också, det här är det andra lagret.
  const download = ext === "svg" || new URL(request.url).searchParams.has("ladda-ner");
  const headers = new Headers({
    "Content-Type": type,
    "Cache-Control": ext === "webp" ? "public, max-age=31536000, immutable" : "public, no-cache",
    "X-Content-Type-Options": "nosniff",
  });
  if (ext !== "webp") {
    headers.set("Last-Modified", stat.mtime.toUTCString());
    headers.set("Content-Disposition", `${download ? "attachment" : "inline"}; filename="statlin-${path.basename(rel)}"`);
    headers.set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox");
    // Last-Modified har hela sekunder.
    if (Date.parse(request.headers.get("if-modified-since") ?? "") >= Math.floor(stat.mtimeMs / 1000) * 1000) {
      return new Response(null, { status: 304, headers });
    }
  }
  headers.set("Content-Length", String(stat.size));
  // HEAD körs med den här GET-hanteraren, och Next läser aldrig kroppen i svaret på HEAD: en öppnad ström blev en
  // fildeskriptor som aldrig stängdes. Svaret får samma rubriker, men filen öppnas inte.
  if (request.method === "HEAD") return new Response(null, { headers });
  const stream = Readable.toWeb(fs.createReadStream(abs)) as ReadableStream;
  return new Response(stream, { headers });
}
