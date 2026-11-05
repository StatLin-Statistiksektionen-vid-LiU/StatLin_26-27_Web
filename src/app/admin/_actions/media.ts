"use server";

import type { FormState } from "@/lib/admin/form";
import { audit, forbidden } from "@/lib/admin/helpers";
import { canManageImages } from "@/lib/auth/permissions";
import { actionUser } from "@/lib/auth/session";
import { pruneOrphanMedia } from "@/lib/media-store";


const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Knappen under Admin → Bilder (ST-17). En veckokörning väntar på CI/cron (SN-06). */
export async function pruneUnusedMedia(): Promise<FormState> {
  const user = await actionUser();
  if ("error" in user) return user;
  if (!canManageImages(user)) return forbidden();
  const { rows, files } = await pruneOrphanMedia({ olderThanDays: 7 });
  if (rows + files === 0) return { ok: true, message: "Inget att rensa. Allt som laddats upp används, eller är yngre än en vecka." };
  const summary = [
    rows && plural(rows, "uppladdning som inget använde", "uppladdningar som inget använde"),
    files && plural(files, "lös fil som ingen uppladdning hör till", "lösa filer som ingen uppladdning hör till"),
  ]
    .filter(Boolean)
    .join(" och ");
  audit(user.id, "prune", "media", null, summary);
  return { ok: true, message: `Tog bort ${summary}.` };
}
