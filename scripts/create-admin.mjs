#!/usr/bin/env node
/**
 * Skapar ett administratörskonto, eller ger ett befintligt konto ett nytt tillfälligt lösenord.
 * Ren JavaScript så att det går att köra både lokalt och i Docker-containern.
 *
 *   npm run create-admin -- ny@statlin.se "Förnamn Efternamn"   nytt konto: skapas som administratör
 *   npm run create-admin -- scb@statlin.se                       befintligt konto: bara nytt lösenord (--reset)
 *   npm run create-admin -- vice@statlin.se --make-admin         befintligt konto: blir aktiv administratör
 *   docker compose exec -u statlin web node scripts/create-admin.mjs ordforande@statlin.se
 *
 * Ett befintligt kontos roll ändras bara med --make-admin, och skriptet skriver ut rollen innan något ändras.
 * Starta webbplatsen minst en gång först så att databasen finns.
 */
import bcrypt from "bcryptjs";
import { generatePassword, openDb } from "./lib.mjs";

const ROLES = { admin: "administratör", editor: "redaktör", committee: "utskott" };
const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith("--"));
const [email, name = "Administratör"] = args.filter((a) => !a.startsWith("--"));
const makeAdmin = flags.includes("--make-admin");
const reset = flags.includes("--reset");
if (!email || !email.includes("@") || flags.some((f) => f !== "--reset" && f !== "--make-admin") || (makeAdmin && reset)) {
  console.error('Användning: node scripts/create-admin.mjs <e-post> ["Namn"] [--reset | --make-admin]');
  console.error("  Finns kontot inte skapas det som administratör.");
  console.error("  --reset (standard): ett befintligt konto får bara ett nytt lösenord – rollen ändras inte.");
  console.error("  --make-admin: ett befintligt konto blir aktiv administratör och får ett nytt lösenord.");
  process.exit(1);
}

const db = openDb();
const password = generatePassword();
const hash = bcrypt.hashSync(password, 11);
const roleName = (role) => ROLES[role] ?? role;

const normalized = email.trim().toLowerCase();
// Kontot och dess sessioner ändras i en transaktion: håller sajten databasen låst blir det allt eller inget.
const before = db
  .transaction(() => {
    const existing = db.prepare("SELECT id, role, active FROM users WHERE email = ?").get(normalized);
    if (!existing) {
      if (reset) return "saknas";
      db.prepare(
        "INSERT INTO users (email, name, post, role, password_hash, must_change_password) VALUES (?, ?, 'Administratör', 'admin', ?, 1)",
      ).run(normalized, name, hash);
      return "skapat";
    }
    console.log(`\n${normalized} finns: ${roleName(existing.role)}, ${existing.active ? "aktivt" : "avstängt"}.`);
    if (makeAdmin) {
      db.prepare(
        "UPDATE users SET password_hash = ?, role = 'admin', active = 1, must_change_password = 1, failed_logins = 0, locked_until = NULL WHERE id = ?",
      ).run(hash, existing.id);
    } else {
      db.prepare("UPDATE users SET password_hash = ?, must_change_password = 1, failed_logins = 0, locked_until = NULL WHERE id = ?").run(
        hash,
        existing.id,
      );
    }
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(existing.id);
    return existing;
  })
  .immediate();

if (before === "saknas") {
  console.error(`\nDet finns inget konto ${normalized} – inget ändrades. Utan --reset skapas ett nytt administratörskonto.`);
  process.exit(1);
}
if (before === "skapat") {
  console.log(`\n✓ Administratören ${normalized} skapades.`);
} else if (!makeAdmin) {
  console.log(`✓ ${normalized} har fått ett nytt lösenord. Rollen ändrades inte (${roleName(before.role)}).`);
  if (!before.active) console.log("  Kontot är avstängt: aktivera det under Konton för att det ska kunna logga in.");
} else if (before.role === "admin" && before.active) {
  console.log(`✓ ${normalized} var redan administratör och har fått ett nytt lösenord.`);
} else {
  console.log(`✓ ${normalized} är nu aktiv administratör (var ${roleName(before.role)}) och har fått ett nytt lösenord.`);
}
console.log(`  Tillfälligt lösenord: ${password}\n  (Måste bytas vid första inloggningen.)\n`);
