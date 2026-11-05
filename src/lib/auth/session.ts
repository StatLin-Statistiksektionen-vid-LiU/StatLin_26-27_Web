import "server-only";
import crypto from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import type { SessionUser } from "@/lib/types";

const COOKIE = "statlin_session";
const SESSION_DAYS = 30;
const SESSION_MS = SESSION_DAYS * 86_400_000;
/** Sessionen förlängs vid aktivitet när mindre än hälften av tiden återstår, så att inte varje anrop skriver. */
const RENEW_BELOW_MS = SESSION_MS / 2;
/** Adminpanelen varnar när mindre än ett dygn återstår. */
const WARN_BELOW_MS = 86_400_000;

/** Det actions svarar när sessionen saknas eller gått ut. */
const LOGGED_OUT = "Du har loggats ut – logga in i en ny flik och försök igen.";

const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

/**
 * Secure-flaggan följer anslutningen. En Secure-kaka över vanlig HTTP slängs tyst av
 * webbläsaren – inloggningen ser då ut att lyckas men man är utloggad vid nästa klick.
 * Bakom en proxy med HTTPS (Caddy, nginx, Codespaces) avgör X-Forwarded-Proto.
 */
async function cookieSecure(): Promise<boolean> {
  if (process.env.COOKIE_SECURE === "true") return true;
  if (process.env.COOKIE_SECURE === "false") return false;
  const proto = (await headers()).get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
  return proto === "https";
}

async function setSessionCookie(token: string, expires: Date) {
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await cookieSecure(),
    path: "/",
    expires,
  });
}

export async function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_MS);
  const ua = (await headers()).get("user-agent")?.slice(0, 300) ?? "";
  const db = getDb();
  db.prepare("INSERT INTO sessions (id, user_id, expires_at, user_agent) VALUES (?, ?, ?, ?)").run(
    hashToken(token),
    userId,
    expires.toISOString(),
    ua,
  );
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(new Date().toISOString());
  await setSessionCookie(token, expires);
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) getDb().prepare("DELETE FROM sessions WHERE id = ?").run(hashToken(token));
  store.delete(COOKIE);
}

export function destroyAllSessionsForUser(userId: number, exceptToken?: string) {
  const db = getDb();
  if (exceptToken) {
    db.prepare("DELETE FROM sessions WHERE user_id = ? AND id != ?").run(userId, hashToken(exceptToken));
  } else {
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(userId);
  }
}

export async function currentToken(): Promise<string | undefined> {
  return (await cookies()).get(COOKIE)?.value;
}

type Session = { user: SessionUser; token: string; expiresAt: string };

/** Den inloggade sessionen (deduplicerad per request). */
const getSession = cache(async (): Promise<Session | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  // Sessionen jämförs mot aktuell tid – det får bara ske vid request, aldrig i en förrendering.
  await connection();
  const row = getDb()
    .prepare(
      `SELECT u.id, u.email, u.name, u.post, u.role, u.committee_id, u.must_change_password, u.design, c.short_name AS committee_name,
              c.kind AS committee_kind, s.expires_at AS session_expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN committees c ON c.id = u.committee_id
       WHERE s.id = ? AND s.expires_at > ? AND u.active = 1`,
    )
    .get(hashToken(token), new Date().toISOString()) as
    | (Omit<SessionUser, "must_change_password" | "design"> & { must_change_password: number; design: number; session_expires_at: string })
    | undefined;
  if (!row) return null;
  const { session_expires_at: expiresAt, ...user } = row;
  return { token, expiresAt, user: { ...user, must_change_password: user.must_change_password === 1, design: user.design === 1 } };
});

/** Läser inloggad användare (deduplicerad per request). */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => (await getSession())?.user ?? null);

/** När inloggningen går ut, om det är mindre än ett dygn kvar – annars null. För varningen i adminpanelen. */
export async function sessionExpiresSoon(): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;
  return Date.parse(session.expiresAt) - Date.now() < WARN_BELOW_MS ? session.expiresAt : null;
}

/** Förlänger sessionen – databasen och kakan – när mindre än hälften av tiden återstår. Kakor kan bara sättas i actions och route handlers. */
async function renew(session: Session) {
  if (Date.parse(session.expiresAt) - Date.now() >= RENEW_BELOW_MS) return;
  const expires = new Date(Date.now() + SESSION_MS);
  getDb().prepare("UPDATE sessions SET expires_at = ? WHERE id = ?").run(expires.toISOString(), hashToken(session.token));
  await setSessionCookie(session.token, expires);
}

/**
 * För route handlers och för sparningar som förlänger efter skrivningen: att öppna redigeringspanelen räknas som
 * aktivitet, och de versionsvaktade sparningarna förlänger först när skrivningen gått igenom. En kaka som sätts i en
 * action renderar om sidan – förlängs sessionen redan när panelen öppnas behöver
 * sparningen i panelen inte göra det.
 */
export async function renewSessionIfDue() {
  const session = await getSession();
  if (session) await renew(session);
}

/**
 * Inloggad användare i en server action. Sidorna använder requireUser och omdirigerar, men en omdirigering från en
 * action monterar om sidan, och det som stod i formuläret försvinner. Här returneras i stället ett fel som formuläret
 * visar. En action räknas som aktivitet och förlänger sessionen (renew). renew: false för actions som bara läser, och
 * för versionsvaktade sparningar som förlänger först efter lyckad skrivning med renewSessionIfDue() – en kaka som sätts
 * i ett felsvar renderar om sidan.
 */
export async function actionUser(opts: { allowTemporaryPassword?: boolean; renew?: boolean } = {}): Promise<SessionUser | { error: string }> {
  const session = await getSession();
  if (!session) return { error: LOGGED_OUT };
  if (session.user.must_change_password && !opts.allowTemporaryPassword) {
    return { error: "Byt ditt tillfälliga lösenord under Mitt konto innan du sparar." };
  }
  if (opts.renew !== false) await renew(session);
  return session.user;
}

/** Inloggningen, med vägen tillbaka till adminsidan som efterfrågades. Proxyn lägger adressen i x-pathname (SB-38). */
export async function loginPath(): Promise<string> {
  const path = (await headers()).get("x-pathname");
  return path ? `/logga-in?next=${encodeURIComponent(path)}` : "/logga-in";
}

/**
 * Kräver inloggning. Den som loggat in med ett tillfälligt lösenord skickas till kontosidan
 * tills lösenordet är bytt – utom där bytet görs (allowTemporaryPassword).
 */
export async function requireUser(opts: { allowTemporaryPassword?: boolean } = {}): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(await loginPath());
  if (user.must_change_password && !opts.allowTemporaryPassword) redirect("/admin/konto?byt=1");
  return user;
}

