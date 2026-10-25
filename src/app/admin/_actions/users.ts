"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { type FormState, formObject, invalid, zCheckbox, zEmail, zOptionalId, zRequired, zText } from "@/lib/admin/form";
import { audit } from "@/lib/admin/helpers";
import { generatePassword, hashPassword } from "@/lib/auth/password";
import { isAdmin } from "@/lib/auth/permissions";
import { destroyAllSessionsForUser, requireUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";

const forbidden: FormState = { error: "Endast administratörer kan hantera konton." };

const schema = z.object({
  email: zEmail,
  name: zRequired(120, "Namnet"),
  post: zText(120),
  role: z.enum(["admin", "editor", "committee"], { message: "Välj en roll." }),
  committee_id: zOptionalId,
  active: zCheckbox,
});

function adminCount(excludeId?: number) {
  return (
    getDb()
      .prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND active = 1 AND id != ?")
      .get(excludeId ?? -1) as { n: number }
  ).n;
}

export async function saveUser(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireUser();
  if (!isAdmin(me)) return forbidden;
  const id = Number(fd.get("id")) || null;
  const parsed = schema.safeParse({ ...formObject(fd), active: id ? fd.get("active") ?? undefined : "on" });
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;
  if (d.role === "committee" && !d.committee_id) {
    return { error: "Ett utskottskonto måste kopplas till ett utskott.", fieldErrors: { committee_id: "Välj utskott." } };
  }
  const db = getDb();
  const clash = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(d.email, id ?? -1);
  if (clash) return { error: "Det finns redan ett konto med den e-postadressen.", fieldErrors: { email: "Upptagen." } };

  if (id) {
    // Lås inte ute sista administratören.
    if ((d.role !== "admin" || !d.active) && adminCount(id) === 0) {
      return { error: "Det måste finnas minst en aktiv administratör." };
    }
    db.prepare("UPDATE users SET email=@email, name=@name, post=@post, role=@role, committee_id=@committee_id, active=@active WHERE id=@id").run({ ...d, id });
    if (!d.active) destroyAllSessionsForUser(id);
    audit(me.id, "update", "user", id, d.email);
    return { ok: true, message: "Kontot är sparat." };
  }

  const password = generatePassword();
  const res = db
    .prepare(
      "INSERT INTO users (email, name, post, role, committee_id, password_hash, must_change_password) VALUES (@email, @name, @post, @role, @committee_id, @hash, 1)",
    )
    .run({ ...d, hash: await hashPassword(password) });
  audit(me.id, "create", "user", Number(res.lastInsertRowid), d.email);
  return {
    ok: true,
    message: `Kontot för ${d.email} är skapat. Ge personen lösenordet nedan – det visas bara en gång och måste bytas vid första inloggningen.`,
    data: { password, email: d.email },
  };
}

export async function resetUserPassword(_prev: FormState, fd: FormData): Promise<FormState> {
  const me = await requireUser();
  if (!isAdmin(me)) return forbidden;
  const id = Number(fd.get("id"));
  const db = getDb();
  const user = db.prepare("SELECT email FROM users WHERE id = ?").get(id) as { email: string } | undefined;
  if (!user) return { error: "Kontot finns inte." };
  const password = generatePassword();
  db.prepare("UPDATE users SET password_hash = ?, must_change_password = 1, failed_logins = 0, locked_until = NULL WHERE id = ?").run(
    await hashPassword(password),
    id,
  );
  destroyAllSessionsForUser(id);
  audit(me.id, "update", "user", id, `Återställde lösenord för ${user.email}`);
  return { ok: true, message: "Nytt tillfälligt lösenord (visas bara nu):", data: { password, email: user.email } };
}

export async function deleteUser(fd: FormData) {
  const me = await requireUser();
  if (!isAdmin(me)) redirect("/admin");
  const id = Number(fd.get("id"));
  if (id === me.id) redirect(`/admin/konton/${id}?fel=sjalv`);
  const db = getDb();
  const user = db.prepare("SELECT email, role FROM users WHERE id = ?").get(id) as { email: string; role: string } | undefined;
  if (user) {
    if (user.role === "admin" && adminCount(id) === 0) redirect(`/admin/konton/${id}?fel=sista`);
    db.prepare("DELETE FROM users WHERE id = ?").run(id);
    audit(me.id, "delete", "user", id, user.email);
  }
  redirect("/admin/konton?raderad=1");
}
