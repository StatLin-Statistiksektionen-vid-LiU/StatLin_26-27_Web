import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const COST = 11;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Läsbart engångslösenord, t.ex. "kvartil-median-4821". */
export function generatePassword(): string {
  const words = [
    "median", "kvartil", "varians", "regression", "bayes", "poisson", "kovarians", "residual",
    "percentil", "stickprov", "hypotes", "konfidens", "korrelation", "fraktil", "modell", "signifikans",
    "estimator", "bootstrap", "markov", "gauss", "binomial", "histogram", "outlier", "tidsserie",
  ];
  const pick = () => words[crypto.randomInt(words.length)];
  return `${pick()}-${pick()}-${crypto.randomInt(1000, 9999)}`;
}

export function passwordProblem(password: string): string | null {
  if (password.length < 10) return "Lösenordet måste vara minst 10 tecken.";
  if (password.length > 200) return "Lösenordet är för långt.";
  if (/^(.)\1+$/.test(password)) return "Välj ett lösenord som inte bara är samma tecken.";
  return null;
}
