"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type FormState, formObject, invalid, zRequired, zText } from "@/lib/admin/form";
import { clientIp } from "@/lib/auth/rate-limit";
import { todayLocal } from "@/lib/dates";
import { getDb } from "@/lib/db";
import { WISH_COMMENT_MAX, WISH_TITLE_MAX } from "@/lib/naringsliv";
import { voteLimitHit, wishLimitHit } from "@/lib/wish-limits";

const PAGE = "/lunchforelasningar";
/** Så många olästa önskemål får ligga och vänta. En attack från många adresser ska inte kunna fylla databasen. */
const MAX_UNREAD = 300;

const wishSchema = z.object({
  title: zRequired(WISH_TITLE_MAX, "Önskemålet"),
  comment: zText(WISH_COMMENT_MAX, "Kommentaren"),
});

/** Radbrytningar och styrtecken i titeln kommer aldrig från ett vanligt formulär. Ett mellanslag räcker. */
const clean = (s: string) => s.replace(/[\u0000-\u001f\u007f]+/g, " ").trim();

/**
 * Ett önskemål från en anonym besökare. Det syns inte förrän SASU godkänt det, och varken adressen eller något annat om
 * besökaren sparas. Redirect både med och utan JavaScript: tacket står i adressen, och formuläret är tomt igen.
 */
export async function submitWish(_prev: FormState, fd: FormData): Promise<FormState> {
  // Honungsfällan: fältet är dolt för människor. Boten får samma svar som alla andra och tror att det gick bra.
  if (String(fd.get("webbplats") ?? "") !== "") redirect(`${PAGE}?tack=1#onska`);
  const parsed = wishSchema.safeParse(formObject(fd));
  if (!parsed.success) return invalid(parsed.error);
  if (wishLimitHit(clientIp(await headers()))) return { error: "Du har skickat många önskemål på kort tid. Vänta en stund och försök igen." };

  const db = getDb();
  const title = clean(parsed.data.title);
  if (!title) return { fieldErrors: { title: "Önskemålet måste fyllas i." }, error: "Kontrollera fälten som är markerade." };
  const unread = db.prepare("SELECT COUNT(*) AS n FROM lecture_wishes WHERE status = 'ny'").get() as { n: number };
  if (unread.n >= MAX_UNREAD) return { error: "Önskelådan är full just nu. Försök igen om några dagar." };
  // Samma önskemål två gånger blir en rad. Besökaren behöver inte veta det, SASU slipper dubbletterna.
  const same = db.prepare("SELECT 1 FROM lecture_wishes WHERE title = ? COLLATE NOCASE").get(title);
  if (!same) db.prepare("INSERT INTO lecture_wishes (title, comment, created_on) VALUES (?, ?, ?)").run(title, parsed.data.comment, todayLocal());
  redirect(`${PAGE}?tack=1#onska`);
}

export type VoteResult = { ok: true; votes: number } | { ok: false; error: string };

function vote(id: number, ip: string): VoteResult {
  if (!Number.isInteger(id) || id <= 0) return { ok: false, error: "Önskemålet finns inte." };
  if (voteLimitHit(ip, id)) return { ok: false, error: "Det gick lite för fort. Försök igen om en stund." };
  const row = getDb()
    .prepare("UPDATE lecture_wishes SET votes = votes + 1 WHERE id = ? AND status IN ('onskad','pa_gang') RETURNING votes")
    .get(id) as { votes: number } | undefined;
  return row ? { ok: true, votes: row.votes } : { ok: false, error: "Det här önskemålet tar inte emot stjärnor längre." };
}

/** Med JavaScript: svarar med antalet. Listan sorteras inte om, så att raden inte hoppar undan under fingret. */
export async function voteForWish(id: number): Promise<VoteResult> {
  return vote(id, clientIp(await headers()));
}

/** Utan JavaScript: ett vanligt formulär som kommer tillbaka till samma rad, och sidan visar att stjärnan är tänd. */
export async function voteForWishForm(fd: FormData): Promise<void> {
  const id = Number(fd.get("id"));
  const result = vote(id, clientIp(await headers()));
  redirect(result.ok ? `${PAGE}?stjarna=${id}#onskemal-${id}` : `${PAGE}?sparrad=1#onskelistan`);
}
