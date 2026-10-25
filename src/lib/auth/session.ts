import "server-only";
import crypto from "node:crypto";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import type { Role, SessionUser } from "@/lib/types";

const COOKIE = "statlin_session";
const SESSION_DAYS = 30;

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

export async function createSession(userId: number) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  const ua = (await headers()).get("user-agent")?.slice(0, 300) ?? "";
  const db = getDb();
  db.prepare("INSERT INTO sessions (id, user_id, expires_at, user_agent) VALUES (?, ?, ?, ?)").run(
    hashToken(token),
    userId,
    expires.toISOString(),
    ua,
  );
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(new Date().toISOString());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await cookieSecure(),
    path: "/",
    expires,
  });
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

/** Läser inloggad användare (deduplicerad per request). */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  // Sessionen jämförs mot aktuell tid – det får bara ske vid request, aldrig i en förrendering.
  await connection();
  const row = getDb()
    .prepare(
      `SELECT u.id, u.email, u.name, u.post, u.role, u.committee_id, u.must_change_password, c.short_name AS committee_name
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN committees c ON c.id = u.committee_id
       WHERE s.id = ? AND s.expires_at > ? AND u.active = 1`,
    )
    .get(hashToken(token), new Date().toISOString()) as
    | (Omit<SessionUser, "must_change_password"> & { must_change_password: number })
    | undefined;
  if (!row) return null;
  return { ...row, must_change_password: row.must_change_password === 1 };
});

/**
 * Kräver inloggning. Den som loggat in med ett tillfälligt lösenord skickas till kontosidan
 * tills lösenordet är bytt – utom där bytet görs (allowTemporaryPassword).
 */
export async function requireUser(opts: { allowTemporaryPassword?: boolean } = {}): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/logga-in");
  if (user.must_change_password && !opts.allowTemporaryPassword) redirect("/admin/konto?byt=1");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/admin?nekad=1");
  return user;
}
