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
