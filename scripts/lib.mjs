/**
 * Det som create-admin och create-accounts delar. Ren JavaScript: skripten körs med node utanför
 * Nexts bygge, också i Docker-imagen, och når inte modulerna under src/.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

/** Samma ordlista som src/lib/auth/password.ts. Den ligger här eftersom Docker-imagen har scripts/ men inte src/. */
const WORDS = JSON.parse(fs.readFileSync(new URL("./password-words.json", import.meta.url), "utf8"));

/** Läsbart engångslösenord, samma format som generatePassword() i src/lib/auth/password.ts. */
export function generatePassword() {
  const pick = () => WORDS[crypto.randomInt(WORDS.length)];
  return `${pick()}-${pick()}-${crypto.randomInt(1000, 9999)}`;
}

/** Öppnar sajtens databas i DATA_DIR (standard ./data), eller avslutar om den inte finns. */
export function openDb() {
  const dataDir = path.resolve(process.env.DATA_DIR ?? path.join(process.cwd(), "data"));
  const dbPath = path.join(dataDir, "statlin.db");
  if (!fs.existsSync(dbPath)) {
    console.error(`Hittar ingen databas i ${dbPath}. Starta webbplatsen en gång (eller kör npm run seed) först.`);
    process.exit(1);
  }
  return new Database(dbPath);
}
