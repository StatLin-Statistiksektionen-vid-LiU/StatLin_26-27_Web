"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { type FormState, formObject, invalid, zCheckbox, zOrder, zRequired, zText, zUrl } from "@/lib/admin/form";
import { audit, forbidden, revalidateSite } from "@/lib/admin/helpers";
import { isEditor } from "@/lib/auth/permissions";
import { actionUser, renewSessionIfDue } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { markSeeded } from "@/lib/db/bootstrap";
import { LINK_CATEGORIES, LINK_ICONS } from "@/lib/links";
import type { LinkCategory } from "@/lib/types";


/* ---------- Länkar (redaktörer) ---------- */

const linkSchema = z.object({
  label: zRequired(80, "Namnet"),
  description: zText(160, "Beskrivningen"),
  url: zUrl.refine((v) => v !== "", "Ange en länk."),
  keywords: zText(200, "Sökorden"),
  category: z.enum(LINK_CATEGORIES.map((c) => c.value) as [LinkCategory, ...LinkCategory[]], "Välj en grupp."),
  icon: z.enum(LINK_ICONS.map((i) => i.value) as [string, ...string[]]).catch("link"),
  featured: zCheckbox,
  sort_order: zOrder,
  active: zCheckbox,
});

export async function saveLink(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await actionUser();
  if ("error" in user) return user;
  if (!isEditor(user)) return forbidden();
  const id = Number(fd.get("id")) || null;
  const parsed = linkSchema.safeParse(formObject(fd));
  if (!parsed.success) return invalid(parsed.error);
  const db = getDb();
  if (id) {
    const old = db.prepare("SELECT sort_order FROM links WHERE id = ?").get(id) as { sort_order: number } | undefined;
    if (!old) return { error: "Länken finns inte längre." };
    db
      .prepare(
        `UPDATE links SET label=@label, description=@description, url=@url, keywords=@keywords, category=@category, icon=@icon,
          featured=@featured, sort_order=@sort_order, active=@active WHERE id=@id`,
      )
      .run({ ...parsed.data, sort_order: parsed.data.sort_order ?? old.sort_order, id });
    audit(user.id, "update", "link", id, parsed.data.label);
    revalidateSite();
    return { ok: true, message: "Länken är sparad." };
  }
  const res = db
    .prepare(
      `INSERT INTO links (label, description, url, keywords, category, icon, featured, sort_order, active)
       VALUES (@label, @description, @url, @keywords, @category, @icon, @featured, @sort_order, @active)`,
    )
    .run({ ...parsed.data, sort_order: parsed.data.sort_order ?? 0 });
  audit(user.id, "create", "link", Number(res.lastInsertRowid), parsed.data.label);
  revalidateSite();
  redirect("/admin/lankar?sparad=1");
}

export async function deleteLink(fd: FormData): Promise<FormState> {
  // Felsvaren visas i bekräftelsen, så sessionen förlängs först när raderingen gått igenom (se deleteTask).
  const user = await actionUser({ renew: false });
  if ("error" in user) return user;
  if (!isEditor(user)) return forbidden();
  const id = Number(fd.get("id"));
  const db = getDb();
  const row = db.prepare("SELECT label FROM links WHERE id = ?").get(id) as { label: string } | undefined;
  if (row) {
    db.prepare("DELETE FROM links WHERE id = ?").run(id);
    markSeeded(db, "links"); // SD-17: tömda länkar fylls inte på igen vid nästa start
    audit(user.id, "delete", "link", id, row.label);
    await renewSessionIfDue();
    revalidateSite();
  }
  redirect("/admin/lankar?raderad=1");
}

