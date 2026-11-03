#!/usr/bin/env node
/**
 * Skapar ett administratörskonto, eller återställer lösenordet för ett befintligt konto.
 * Ren JavaScript så att det går att köra både lokalt och i Docker-containern.
 *
 *   npm run create-admin -- ordforande@statlin.se "Förnamn Efternamn"
 *   docker compose exec -u statlin web node scripts/create-admin.mjs ordforande@statlin.se
 *
 * Starta webbplatsen minst en gång först så att databasen finns.
 */
import bcrypt from "bcryptjs";
import { generatePassword, openDb } from "./lib.mjs";

const [email, name = "Administratör"] = process.argv.slice(2);
if (!email || !email.includes("@")) {
  console.error('Användning: node scripts/create-admin.mjs <e-post> ["Namn"]');
  process.exit(1);
}

const db = openDb();
const password = generatePassword();
const hash = bcrypt.hashSync(password, 11);

const normalized = email.trim().toLowerCase();
const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalized);
if (existing) {
  db.prepare(
    "UPDATE users SET password_hash = ?, role = 'admin', active = 1, must_change_password = 1, failed_logins = 0, locked_until = NULL WHERE id = ?",
  ).run(hash, existing.id);
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(existing.id);
  console.log(`\n✓ ${normalized} är nu administratör och har fått ett nytt lösenord.`);
} else {
  db.prepare(
    "INSERT INTO users (email, name, post, role, password_hash, must_change_password) VALUES (?, ?, 'Administratör', 'admin', ?, 1)",
  ).run(normalized, name, hash);
  console.log(`\n✓ Administratören ${normalized} skapades.`);
}
console.log(`  Tillfälligt lösenord: ${password}\n  (Måste bytas vid första inloggningen.)\n`);
