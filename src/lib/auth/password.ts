import bcrypt from "bcryptjs";
import crypto from "node:crypto";
// Ordlistan delas med skripten (scripts/lib.mjs) och ligger hos dem: Docker-imagen har scripts/ men inte src/.
import WORDS from "../../../scripts/password-words.json";

const COST = 11;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Läsbart engångslösenord, t.ex. "median-bayes-4821". Skripten gör likadant (scripts/lib.mjs). */
export function generatePassword(): string {
  const pick = () => WORDS[crypto.randomInt(WORDS.length)];
  return `${pick()}-${pick()}-${crypto.randomInt(1000, 9999)}`;
}

export function passwordProblem(password: string): string | null {
  if (password.length < 10) return "Lösenordet måste vara minst 10 tecken.";
  if (password.length > 200) return "Lösenordet är för långt.";
  if (/^(.)\1+$/.test(password)) return "Välj ett lösenord som inte bara är samma tecken.";
  return null;
}
