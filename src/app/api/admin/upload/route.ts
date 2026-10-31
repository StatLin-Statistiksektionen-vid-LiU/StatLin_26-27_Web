import { revalidatePath } from "next/cache";
import { audit } from "@/lib/admin/helpers";
import { isAllowedOrigin } from "@/lib/allowed-origins";
import { canEditImages, isEditor } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { MediaError, isImageUpload, storeFile, storeImage } from "@/lib/media-store";
import { fileHref, toImageRef } from "@/lib/media-url";

const json = (body: unknown, status = 200) => Response.json(body, { status });

function originHost(origin: string): string {
  try {
    return new URL(origin).host;
  } catch {
    return "";
  }
}

/**
 * Uppladdning från adminpanelen (bilder och dokument).
 * purpose = "image"   → fristående bild (omslag, porträtt, logga); kopplas när formuläret sparas
 *         = "gallery" → bild som läggs direkt i ett evenemangs galleri (kräver eventId; eget utskott eller grafiskt ansvar)
 *         = "file"    → dokument (PDF m.m.), endast redaktörer
 */
export async function POST(request: Request) {
  // CSRF-skydd utöver SameSite-cookien: kräv samma ursprung.
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  // Ett ogiltigt ursprung (t.ex. "null" från en sandlådad sida) nekas, i stället för att krascha URL-tolkningen.
  if (origin && !isAllowedOrigin(originHost(origin), host)) return json({ error: "Otillåtet ursprung." }, 403);

  const user = await getSessionUser();
  if (!user) return json({ error: "Du är inte inloggad." }, 401);
  if (user.must_change_password) return json({ error: "Byt ditt tillfälliga lösenord innan du laddar upp filer." }, 403);

  let fd: FormData;
  try {
    fd = await request.formData();
  } catch {
    return json({ error: "Ogiltig uppladdning." }, 400);
  }
  const file = fd.get("file");
  const purpose = String(fd.get("purpose") ?? "image");
  if (!(file instanceof File) || file.size === 0) return json({ error: "Ingen fil skickades." }, 400);

  try {
    if (purpose === "file") {
      if (!isEditor(user)) return json({ error: "Endast redaktörer kan ladda upp dokument." }, 403);
      const media = await storeFile(file, user.id);
      return json({ id: media.id, href: fileHref(media), name: media.original_name, size: media.size });
    }

    if (!isImageUpload(file)) return json({ error: "Filen måste vara en bild (JPG, PNG, WebP, GIF eller AVIF)." }, 415);

    if (purpose === "gallery") {
      const eventId = Number(fd.get("eventId"));
      const db = getDb();
      const event = db.prepare("SELECT id, committee_id, title FROM events WHERE id = ?").get(eventId) as
        | { id: number; committee_id: number | null; title: string }
        | undefined;
      if (!event) return json({ error: "Evenemanget finns inte." }, 404);
      if (!canEditImages(user, event)) return json({ error: "Du får inte ladda upp bilder till det här evenemanget." }, 403);

      const media = await storeImage(file, user.id);
      const next = (db.prepare("SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM event_images WHERE event_id = ?").get(eventId) as { n: number }).n;
      const res = db
        .prepare("INSERT INTO event_images (event_id, media_id, caption, sort_order, uploaded_by) VALUES (?, ?, '', ?, ?)")
        .run(eventId, media.id, next, user.id);
      audit(user.id, "upload", "event_image", Number(res.lastInsertRowid), event.title);
      revalidatePath("/", "layout");
      return json({ id: Number(res.lastInsertRowid), caption: "", image: toImageRef(media) });
    }

    const media = await storeImage(file, user.id, String(fd.get("alt") ?? ""));
    return json({ id: media.id, image: toImageRef(media) });
  } catch (err) {
    if (err instanceof MediaError) return json({ error: err.message }, 400);
    console.error("Uppladdning misslyckades", err);
    return json({ error: "Uppladdningen misslyckades. Försök igen." }, 500);
  }
}
