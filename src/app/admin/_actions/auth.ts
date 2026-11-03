"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { audit } from "@/lib/admin/helpers";
import { type FormState, invalid } from "@/lib/admin/form";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";
import { clearLoginFailures, clientIp, loginDelayed, loginDelayKey, rateLimitHit, recordLoginFailure } from "@/lib/auth/rate-limit";
import { actionUser, createSession, currentToken, destroyAllSessionsForUser, destroySession } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import type { UserRow } from "@/lib/types";

// Jämförs mot när kontot inte finns eller försöket fördröjs, så att svarstiden inte avslöjar vilka konton som existerar.
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

  const ip = clientIp(await headers());
  if (rateLimitHit(`login:${ip}`)) {
    return fail({ error: "För många inloggningsförsök. Vänta en stund och försök igen." });
  }

  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as UserRow | undefined;
  // Samma svar för okänd adress, fel lösenord, fördröjt och avstängt konto, så att svaret inte avslöjar vilka konton
  // som finns. Varje misslyckat försök sparas i revisionsloggen med adressen, men utan IP.
  const denied = (reason: string, error = "Fel e-postadress eller lösenord.") => {
    audit(null, "login_failed", "user", user?.id ?? null, `Misslyckad inloggning (${reason}): ${email}`);
    return fail({ error });
  };

  if (!user) {
    await verifyPassword(password, await getDummyHash());
    return denied("okänd adress");
  }
  // Efter upprepade fel från samma IP väntar nästa försök mot kontot en stund. Lösenordet prövas inte under tiden,
  // men jämförelsen görs ändå så att svarstiden blir densamma.
  const delayKey = loginDelayKey(user.id, ip);
  if (loginDelayed(delayKey)) {
    await verifyPassword(password, await getDummyHash());
    return denied("fördröjd efter upprepade fel");
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!user.active) {
    // Ett avstängt konto räknar inga försök. Först med rätt lösenord får personen veta varför det inte går.
    if (!ok) return denied("avstängt konto, fel lösenord");
    return denied("avstängt konto, rätt lösenord", "Kontot är avstängt – kontakta en administratör.");
  }
  if (!ok) {
    recordLoginFailure(delayKey);
    // Räknas bara som statistik – det finns inget lås på hela kontot.
    db.prepare("UPDATE users SET failed_logins = failed_logins + 1 WHERE id = ?").run(user.id);
    return denied("fel lösenord");
  }

  clearLoginFailures(delayKey);
  db.prepare("UPDATE users SET failed_logins = 0, locked_until = NULL, last_login_at = ? WHERE id = ?").run(new Date().toISOString(), user.id);
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
  const user = await actionUser({ allowTemporaryPassword: true });
  if ("error" in user) return user;
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
  const user = await actionUser({ allowTemporaryPassword: true });
  if ("error" in user) return user;
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
  const user = await actionUser({ allowTemporaryPassword: true });
  if ("error" in user) return user;
  destroyAllSessionsForUser(user.id, await currentToken());
  return { ok: true, message: "Alla andra enheter har loggats ut." };
}
