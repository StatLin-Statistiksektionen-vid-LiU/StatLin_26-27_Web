"use server";

import crypto from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { clientIp, hashedIp, rateLimitHit, rateLimitReached } from "@/lib/auth/rate-limit";
import { findOpenBox } from "@/lib/data/fragelada";
import { todayLocal } from "@/lib/dates";
import { getDb } from "@/lib/db";
import { CODE_LENGTH, normalizeCode, QUESTION_MAX, type OpenBoxState, type SendState } from "@/lib/fragelada";

/*
 * Besökarens två actions. Anonymiteten är hela poängen, så här finns med avsikt: ingen session, ingen audit() och ingen loggning av
 * innehållet. IP-adressen används bara som HMAC i minnet för spärrarna (rate-limit.ts) och försvinner när processen startar om.
 */

/** Samma svar för fel kod och stängd låda, så att svaret inte säger vilka koder som finns. */
const NOT_OPEN = "Koden fungerar inte. Kontrollera den, eller så är lådan stängd.";
const TOO_MANY = "Du har försökt för många gånger. Vänta en kvart och försök igen.";
const NOT_SAVED = "Det gick inte att skicka just nu. Din text står kvar, försök igen om en stund.";

/** Fel kod räknas per IP. Rätt kod kostar inget, eftersom en hel sal kan dela IP-adress. */
const GUESSES = 20;
/** Inskick per låda och IP på en kvart: gott om plats för en sal som delar adress, men ett tak för den som vill fylla lådan. */
const SENDS = 60;
/** Tak för en hel låda, så att spam inte kan fylla disken. */
const BOX_CAP = 2000;

async function ipKey() {
  return hashedIp(clientIp(await headers()));
}

export async function openBoxByCode(_prev: OpenBoxState, fd: FormData): Promise<OpenBoxState> {
  const key = `fragelada-kod:${await ipKey()}`;
  if (rateLimitReached(key, GUESSES)) return { error: TOO_MANY };
  const code = normalizeCode(fd.get("kod"));
  const box = code.length === CODE_LENGTH ? findOpenBox(getDb(), { code }) : null;
  if (!box) {
    rateLimitHit(key, GUESSES);
    return { error: NOT_OPEN };
  }
  return { box: { slug: box.slug, code: box.code, title: box.title, description: box.description } };
}

const questionSchema = z.object({
  // En textruta skickar radbrytningar som två tecken men räknar dem som ett. Räknaren på sidan ska stämma med gränsen här.
  body: z
    .string()
    .transform((v) => v.replace(/\r\n?/g, "\n").trim())
    .pipe(z.string().min(1, "Skriv din fråga först.").max(QUESTION_MAX, `Frågan får vara högst ${QUESTION_MAX} tecken.`)),
});

export async function sendQuestion(_prev: SendState, fd: FormData): Promise<SendState> {
  // Honungsfällan: ett fält som människor aldrig ser. Roboten får ett vanligt svar och inget sparas.
  if (String(fd.get("webbplats") ?? "")) return { ok: true };

  const parsed = questionSchema.safeParse({ body: String(fd.get("body") ?? "") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Skriv din fråga först." };

  const ip = await ipKey();
  const db = getDb();
  const slug = String(fd.get("slug") ?? "");
  let box;
  if (slug) {
    box = findOpenBox(db, { slug });
  } else {
    const key = `fragelada-kod:${ip}`;
    if (rateLimitReached(key, GUESSES)) return { error: TOO_MANY };
    const code = normalizeCode(fd.get("kod"));
    box = code.length === CODE_LENGTH ? findOpenBox(db, { code }) : null;
    if (!box) rateLimitHit(key, GUESSES);
  }
  if (!box) return { error: NOT_OPEN };
  if (rateLimitHit(`fragelada-skicka:${box.id}:${ip}`, SENDS)) return { error: TOO_MANY };

  try {
    const { n } = db.prepare("SELECT COUNT(*) AS n FROM box_questions WHERE box_id = ?").get(box.id) as { n: number };
    if (n >= BOX_CAP) return { error: "Lådan är full just nu. Din text står kvar, försök igen senare." };
    // Id:t slumpas, så att ordningen mellan frågorna inte går att läsa ur databasen.
    db.prepare("INSERT INTO box_questions (id, box_id, body, month) VALUES (?, ?, ?, ?)").run(crypto.randomInt(1, 2 ** 47), box.id, parsed.data.body, todayLocal().slice(0, 7));
  } catch {
    // Felet skrivs inte ut: det kan bära innehåll, och en rad med klockslag i loggen är just det lådan lovar att inte spara.
    return { error: NOT_SAVED };
  }
  return { ok: true };
}
