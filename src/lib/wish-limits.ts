import crypto from "node:crypto";

/**
 * Spärrarna mot spam på önskelistan. De ligger i minnet och nollas när processen startar om. IP-adressen sparas bara som HMAC med en
 * nyckel som slumpas vid start, så att inget i minnet går att föra tillbaka till en besökare och inget hamnar i databasen.
 *
 * Studenter på eduroam kan dela adress, så att en spärr på en röst per önskemål och IP skulle stoppa riktiga röster. Därför är
 * spärrarna tak per tidsfönster: en person hinner inte fuska särskilt mycket, och en hel föreläsningssal kan rösta på samma sak.
 */
const KEY = crypto.randomBytes(32);
const hits = new Map<string, { count: number; reset: number }>();

function hit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.reset < now) {
    hits.set(key, { count: 1, reset: now + windowMs });
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
    return false;
  }
  entry.count++;
  return entry.count > max;
}

const hashed = (ip: string) => crypto.createHmac("sha256", KEY).update(ip).digest("base64url");

const QUARTER = 15 * 60_000;
const HOUR = 60 * 60_000;

/** Sant när den här adressen har skickat för många önskemål. */
export const wishLimitHit = (ip: string) => hit(`onskemal:${hashed(ip)}`, 5, HOUR);

/** Sant när den här adressen har skickat för många intresseanmälningar till STAR. */
export const interestLimitHit = (ip: string) => hit(`intresse:${hashed(ip)}`, 5, HOUR);

/** Sant när den här adressen har gett för många stjärnor, totalt eller till samma önskemål. */
export function voteLimitHit(ip: string, wishId: number): boolean {
  const ipHash = hashed(ip);
  const total = hit(`rost:${ipHash}`, 60, QUARTER);
  const same = hit(`rost:${ipHash}:${wishId}`, 15, HOUR);
  return total || same;
}
