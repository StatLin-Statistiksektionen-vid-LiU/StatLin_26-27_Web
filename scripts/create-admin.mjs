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
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const [email, name = "Administratör"] = process.argv.slice(2);
if (!email || !email.includes("@")) {
  console.error('Användning: node scripts/create-admin.mjs <e-post> ["Namn"]');
  process.exit(1);
}

const dataDir = path.resolve(process.env.DATA_DIR ?? path.join(process.cwd(), "data"));
const dbPath = path.join(dataDir, "statlin.db");
if (!fs.existsSync(dbPath)) {
  console.error(`Hittar ingen databas i ${dbPath}. Starta webbplatsen en gång (eller kör npm run seed) först.`);
  process.exit(1);
}

const words = ["median", "kvartil", "varians", "regression", "bayes", "poisson", "residual", "percentil", "stickprov", "hypotes", "konfidens", "korrelation"];
const pick = () => words[crypto.randomInt(words.length)];
const password = `${pick()}-${pick()}-${crypto.randomInt(1000, 9999)}`;
const hash = bcrypt.hashSync(password, 11);

const db = new Database(dbPath);
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
