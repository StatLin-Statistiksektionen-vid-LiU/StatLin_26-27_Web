#!/usr/bin/env node
/**
 * Skapar sektionens fasta konton: ordförande och vice (administratörer), info (redaktör)
 * och ett konto per utskott. Konton som redan finns lämnas orörda, så skriptet kan köras igen.
 * Ren JavaScript så att det går att köra både lokalt och i Docker-containern.
 *
 *   npm run create-accounts
 *   fly ssh console -u statlin -C "node scripts/create-accounts.mjs"
 *
 * Varje nytt konto får ett tillfälligt lösenord som visas en gång och måste bytas vid första
 * inloggningen. Glömda lösenord återställer en administratör under Konton i adminpanelen.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

/** E-post, namn, post, roll och utskottets slug. */
const ACCOUNTS = [
  ["ordforande@statlin.se", "Ordförande", "Styrelsen", "admin", "styrelsen"],
  ["vice@statlin.se", "Vice ordförande", "Styrelsen", "admin", "styrelsen"],
  ["info@statlin.se", "Info", "Informationsansvarig", "editor", "styrelsen"],
  ["ubu@statlin.se", "UBU", "", "committee", "ubu"],
  ["sasu@statlin.se", "SASU", "", "committee", "sasu"],
  ["scb@statlin.se", "SCB", "", "committee", "scb"],
  ["statpub@statlin.se", "StatPub", "", "committee", "statpub"],
  ["stig@statlin.se", "STIG", "", "committee", "stig"],
  ["estig@statlin.se", "eSTIG", "", "committee", "estig"],
  ["amo@statlin.se", "AMO", "", "committee", "amo"],
];

const dataDir = path.resolve(process.env.DATA_DIR ?? path.join(process.cwd(), "data"));
const dbPath = path.join(dataDir, "statlin.db");
if (!fs.existsSync(dbPath)) {
  console.error(`Hittar ingen databas i ${dbPath}. Starta webbplatsen en gång (eller kör npm run seed) först.`);
  process.exit(1);
}

const words = ["median", "kvartil", "varians", "regression", "bayes", "poisson", "residual", "percentil", "stickprov", "hypotes", "konfidens", "korrelation"];
const pick = () => words[crypto.randomInt(words.length)];
const newPassword = () => `${pick()}-${pick()}-${crypto.randomInt(1000, 9999)}`;

const db = new Database(dbPath);
const findUser = db.prepare("SELECT role FROM users WHERE email = ?");
const findCommittee = db.prepare("SELECT id FROM committees WHERE slug = ?");
const insert = db.prepare(
  "INSERT INTO users (email, name, post, role, committee_id, password_hash, must_change_password) VALUES (?, ?, ?, ?, ?, ?, 1)",
);

const created = [];
const skipped = [];
db.transaction(() => {
  for (const [email, name, post, role, committee] of ACCOUNTS) {
    const existing = findUser.get(email);
    if (existing) {
      skipped.push(`${email} finns redan (${existing.role}) – orört`);
      continue;
    }
    const committeeRow = findCommittee.get(committee);
    if (!committeeRow) {
      skipped.push(`${email} hoppades över – utskottet "${committee}" finns inte`);
      continue;
    }
    const password = newPassword();
    insert.run(email, name, post, role, committeeRow.id, bcrypt.hashSync(password, 11));
    created.push({ email, role, password });
  }
})();

if (created.length) {
  console.log(`\n✓ ${created.length} konton skapades. Lösenorden visas bara nu och måste bytas vid första inloggningen:\n`);
  for (const c of created) console.log(`  ${c.role.padEnd(10)} ${c.email.padEnd(24)} ${c.password}`);
} else {
  console.log("\nInga nya konton behövdes.");
}
if (skipped.length) console.log(`\n${skipped.map((s) => `  ${s}`).join("\n")}`);
console.log("\nLogga in på /logga-in.\n");
