import crypto from "node:crypto";

/** Enkel minnesbaserad begränsning av inloggningsförsök per IP. */
const attempts = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 15 * 60_000;
const MAX_ATTEMPTS = 20;

export function rateLimitHit(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.reset < now) {
    attempts.set(key, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  if (attempts.size > 5000) {
    for (const [k, v] of attempts) if (v.reset < now) attempts.delete(k);
  }
  return entry.count > MAX_ATTEMPTS;
}

/**
 * Fördröjning efter fel lösenord, per konto och IP. Ett lås på hela kontot kunde vem som helst utlösa mot de
 * kända adresserna och stänga ute posten; här väntar bara försöken från samma IP. Från fjärde felet i rad väntar
 * nästa försök 2^(n−3) sekunder (2, 4, 8 …), högst en minut. Felen glöms efter en kvart utan nya fel och när
 * inloggningen lyckas. Ligger i minnet som spärren ovan och nollas när processen startar om.
 */
const failures = new Map<string, { count: number; last: number }>();
const FAILURE_WINDOW_MS = 15 * 60_000;
const MAX_DELAY_MS = 60_000;
/** IP-adressen ingår bara som HMAC med en nyckel som slumpas när processen startar. */
const IP_KEY = crypto.randomBytes(32);

export function loginDelayKey(userId: number, ip: string): string {
  return `${userId}:${crypto.createHmac("sha256", IP_KEY).update(ip).digest("base64url")}`;
}

/** Sant medan nästa försök mot kontot från den här IP-adressen ska vänta. */
export function loginDelayed(key: string): boolean {
  const entry = failures.get(key);
  if (!entry || entry.count < 4) return false;
  return Date.now() < entry.last + Math.min(2 ** (entry.count - 3) * 1000, MAX_DELAY_MS);
}

export function recordLoginFailure(key: string) {
  const now = Date.now();
  const entry = failures.get(key);
  if (entry && now - entry.last < FAILURE_WINDOW_MS) {
    entry.count++;
    entry.last = now;
  } else {
    failures.set(key, { count: 1, last: now });
  }
  if (failures.size > 5000) {
    for (const [k, v] of failures) if (now - v.last >= FAILURE_WINDOW_MS) failures.delete(k);
  }
}

/** Efter en lyckad inloggning. Räknaren per IP ovan nollställs inte – då kunde rätt lösenord till ett konto tömma den. */
export function clearLoginFailures(key: string) {
  failures.delete(key);
}

/**
 * Besökarens IP-adress. X-Forwarded-For kan besökaren fylla i själv, så bara det sista värdet –
 * det som den närmaste proxyn lade till – går att lita på. Sätter värden en egen rubrik som
 * besökaren inte kan påverka anges den i CLIENT_IP_HEADER (t.ex. x-real-ip eller fly-client-ip).
 */
export function clientIp(h: Pick<Headers, "get">): string {
  const header = process.env.CLIENT_IP_HEADER?.trim().toLowerCase();
  const fromHeader = header ? h.get(header)?.split(",")[0]?.trim() : undefined;
  if (fromHeader) return fromHeader;
  const forwarded = (h.get("x-forwarded-for") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return forwarded.at(-1) || h.get("x-real-ip")?.trim() || "okänd";
}
