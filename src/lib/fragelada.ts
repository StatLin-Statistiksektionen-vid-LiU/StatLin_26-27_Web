/** Frågelådans delar som både servern och webbläsaren behöver. */

/** Utan 0/O och 1/I/L, som går att blanda ihop när koden läses från en skärm i en föreläsningssal. */
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 6;
export const QUESTION_MAX = 2000;

const NOT_IN_ALPHABET = new RegExp(`[^${CODE_ALPHABET}]`, "g");

/** Det som skrivs eller klistras in, som versaler och bara giltiga tecken. En hel länk går också bra. */
export function normalizeCode(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const fromLink = /[?&]kod=([^&\s]*)/i.exec(raw)?.[1] ?? raw;
  return fromLink.toUpperCase().replace(NOT_IN_ALPHABET, "").slice(0, CODE_LENGTH);
}

/** Det besökaren får veta om en öppen låda. Aldrig vem som äger den eller hur många frågor den har. */
export type PublicBox = { slug: string | null; code: string | null; title: string; description: string };

export type OpenBoxState = { box?: PublicBox; error?: string };
export type SendState = { ok?: boolean; error?: string };
