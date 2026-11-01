"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { type FormState, formObject, invalid, zRequired, zText, zUrl } from "@/lib/admin/form";
import { audit, revalidateSite } from "@/lib/admin/helpers";
import { requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { deleteMediaIfUnused, isImageUpload, MediaError, storeFile, storeImage } from "@/lib/media-store";
import { LAST_TERM } from "@/lib/resources";

/* Alla konton är styrelseposter och sköter hjälpmedlen gemensamt, så det räcker att vara inloggad. Loggen visar vem som gjort vad. */

const resourceSchema = z.object({
  title: zRequired(160, "Titeln"),
  description: zText(300, "Beskrivningen"),
  program: z.enum(["kandidat", "master", "bada"]),
  term: z.enum(["", "1", "2", "3", "4", "5", "6"]).transform((v) => (v ? Number(v) : null)),
  category: z.enum(["fusklapp", "kod", "guide", "ovrigt"]),
  url: zUrl,
});

export async function saveResource(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const id = Number(fd.get("id")) || null;
  const parsed = resourceSchema.safeParse(formObject(fd));
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;
  if (d.term && d.term > LAST_TERM[d.program]) {
    return { error: "Kontrollera fälten som är markerade.", fieldErrors: { term: "Mastern har bara fyra terminer. Termin 5 och 6 går bara att välja för Kandidat." } };
  }
  const db = getDb();
  const old = id ? (db.prepare("SELECT media_id FROM resources WHERE id = ?").get(id) as { media_id: number | null } | undefined) : undefined;
  if (id && !old) return { error: "Hjälpmedlet finns inte längre." };

  const file = fd.get("file");
  const upload = file instanceof File && file.size > 0 ? file : null;
  const kept = old && fd.get("remove_file") !== "on" ? old.media_id : null;
  // Varje rad på sidan ska leda någonstans, även efter en ändring.
  if (!upload && !kept && !d.url) return { error: "Ladda upp en fil eller ange en länk.", fieldErrors: { file: "Välj en fil eller ange en länk." } };

  let mediaId = kept;
  if (upload) {
    try {
      // En fusklapp är ofta ett foto eller en skanning.
      mediaId = (isImageUpload(upload) ? await storeImage(upload, user.id, d.title) : await storeFile(upload, user.id)).id;
    } catch (err) {
      return { error: err instanceof MediaError ? err.message : "Filen kunde inte sparas.", fieldErrors: { file: "Kontrollera filen." } };
    }
  }

  if (id && old) {
    db.prepare("UPDATE resources SET title=@title, description=@description, program=@program, term=@term, category=@category, media_id=@media_id, url=@url WHERE id=@id").run({
      ...d,
      media_id: mediaId,
      id,
    });
    if (old.media_id !== mediaId) await deleteMediaIfUnused(old.media_id);
    audit(user.id, "update", "resource", id, d.title);
    revalidateSite();
    return { ok: true, message: "Hjälpmedlet är sparat." };
  }

  const res = db
    .prepare("INSERT INTO resources (title, description, program, term, category, media_id, url) VALUES (@title, @description, @program, @term, @category, @media_id, @url)")
    .run({ ...d, media_id: mediaId });
  audit(user.id, "create", "resource", Number(res.lastInsertRowid), d.title);
  revalidateSite();
  redirect("/admin/hjalpmedel?sparad=1");
}

export async function deleteResource(fd: FormData) {
  const user = await requireUser();
  const id = Number(fd.get("id"));
  const db = getDb();
  const row = db.prepare("SELECT title, media_id FROM resources WHERE id = ?").get(id) as { title: string; media_id: number | null } | undefined;
  if (row) {
    db.prepare("DELETE FROM resources WHERE id = ?").run(id);
    await deleteMediaIfUnused(row.media_id);
    audit(user.id, "delete", "resource", id, row.title);
    revalidateSite();
  }
  redirect("/admin/hjalpmedel?raderad=1");
}
