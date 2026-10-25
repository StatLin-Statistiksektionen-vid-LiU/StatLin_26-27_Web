"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/admin/helpers";
import { type FormState, invalid } from "@/lib/admin/form";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";
import { rateLimitHit } from "@/lib/auth/rate-limit";
import { createSession, currentToken, destroyAllSessionsForUser, destroySession, requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import type { UserRow } from "@/lib/types";

const MAX_FAILED = 8;
const LOCK_MINUTES = 15;

// Jämförs mot när kontot inte finns, så att svarstiden inte avslöjar vilka konton som existerar.
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= hashPassword("statlin-dummy-password"));

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const typedEmail = String(fd.get("email") ?? "").slice(0, 200);
  const fail = (state: FormState): FormState => ({ ...state, data: { email: typedEmail } });
  const parsed = z
    .object({
      email: z.string().trim().toLowerCase().min(1, "Fyll i din e-postadress."),
      password: z.string().min(1, "Fyll i ditt lösenord."),
      next: z.string().optional(),
    })
    .safeParse({ email: fd.get("email"), password: fd.get("password"), next: fd.get("next") ?? undefined });
  if (!parsed.success) return fail(invalid(parsed.error));
  const { email, password, next } = parsed.data;

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "okänd";
  if (rateLimitHit(`login:${ip}`)) {
    return fail({ error: "För många inloggningsförsök. Vänta en stund och försök igen." });
  }

  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as UserRow | undefined;
  const now = new Date();

  if (user?.locked_until && new Date(user.locked_until) > now) {
    return fail({ error: "Kontot är tillfälligt låst efter för många felaktiga försök. Försök igen om en stund." });
  }

  const ok = await verifyPassword(password, user?.password_hash ?? (await getDummyHash()));
  if (!user || !ok || !user.active) {
    if (user) {
      const failed = user.failed_logins + 1;
      const lock = failed >= MAX_FAILED ? new Date(now.getTime() + LOCK_MINUTES * 60_000).toISOString() : null;
      db.prepare("UPDATE users SET failed_logins = ?, locked_until = ? WHERE id = ?").run(lock ? 0 : failed, lock, user.id);
    }
    return fail({ error: "Fel e-postadress eller lösenord." });
  }

  db.prepare("UPDATE users SET failed_logins = 0, locked_until = NULL, last_login_at = ? WHERE id = ?").run(now.toISOString(), user.id);
  await createSession(user.id);
  audit(user.id, "login", "user", user.id, "Loggade in");

  const target = next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
  redirect(user.must_change_password ? "/admin/konto?byt=1" : target);
}

export async function logout() {
  await destroySession();
  redirect("/logga-in?utloggad=1");
}

export async function changePassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser({ allowTemporaryPassword: true });
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("password") ?? "");
  const confirm = String(fd.get("confirm") ?? "");

  const row = getDb().prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as { password_hash: string };
  if (!(await verifyPassword(current, row.password_hash))) {
    return { error: "Det nuvarande lösenordet stämmer inte.", fieldErrors: { current: "Fel lösenord." } };
  }
  const problem = passwordProblem(next);
  if (problem) return { error: problem, fieldErrors: { password: problem } };
  if (next !== confirm) return { error: "Lösenorden matchar inte.", fieldErrors: { confirm: "Lösenorden matchar inte." } };
  if (next === current) return { error: "Välj ett nytt lösenord.", fieldErrors: { password: "Samma som det gamla." } };

  getDb().prepare("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?").run(await hashPassword(next), user.id);
  destroyAllSessionsForUser(user.id, await currentToken());
  audit(user.id, "update", "user", user.id, "Bytte lösenord");
  return { ok: true, message: "Lösenordet är bytt. Andra inloggade enheter har loggats ut." };
}

export async function updateProfile(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser({ allowTemporaryPassword: true });
  const parsed = z
    .object({
      name: z.string().trim().min(1, "Fyll i ditt namn.").max(120),
      post: z.string().trim().max(120).default(""),
    })
    .safeParse({ name: fd.get("name"), post: fd.get("post") ?? "" });
  if (!parsed.success) return invalid(parsed.error);
  getDb().prepare("UPDATE users SET name = ?, post = ? WHERE id = ?").run(parsed.data.name, parsed.data.post, user.id);
  return { ok: true, message: "Profilen är sparad." };
}

export async function logoutOtherSessions(): Promise<FormState> {
  const user = await requireUser({ allowTemporaryPassword: true });
  destroyAllSessionsForUser(user.id, await currentToken());
  return { ok: true, message: "Alla andra enheter har loggats ut." };
}
