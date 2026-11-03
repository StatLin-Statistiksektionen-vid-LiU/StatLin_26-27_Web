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

/**
 * Läsbart engångslösenord, t.ex. "median-uggla-prognos-fika-4821": fyra ord ur 128 och ett tal,
 * drygt 41 bitar. Skripten gör likadant (scripts/lib.mjs).
 */
export function generatePassword(): string {
  const pick = () => WORDS[crypto.randomInt(WORDS.length)];
  return `${pick()}-${pick()}-${pick()}-${pick()}-${crypto.randomInt(1000, 9999)}`;
}

/** Lösenord som står i repot (exempelfilen, och förr devcontainern och e2e-testet) och därför är kända för alla. */
const PLACEHOLDER_PASSWORDS = ["byt-mig-till-nagot-langt", "admin-statlin-2026", "demo-statlin-2026"];

/** Felet om lösenordet i miljövariabeln är en känd platshållare. Konton som skript skapar får aldrig något av dem. */
export function placeholderProblem(variable: string, password: string | undefined): string | null {
  if (password === undefined || !PLACEHOLDER_PASSWORDS.includes(password.trim().toLowerCase())) return null;
  return `${variable} är platshållaren "${password.trim()}", som står i repot och därför är känd för alla – välj ett eget lösenord.`;
}

export function passwordProblem(password: string): string | null {
  if (password.length < 10) return "Lösenordet måste vara minst 10 tecken.";
  if (password.length > 200) return "Lösenordet är för långt.";
  if (/^(.)\1+$/.test(password)) return "Välj ett lösenord som inte bara är samma tecken.";
  return null;
}
