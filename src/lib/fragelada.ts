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

/** En slumpad kod. Web Crypto finns både i webbläsaren och på servern. */
export function generateCode(): string {
  const picks = globalThis.crypto.getRandomValues(new Uint32Array(CODE_LENGTH));
  return Array.from(picks, (n) => CODE_ALPHABET[n % CODE_ALPHABET.length]).join("");
}

/** En kod som ägaren har skrivit själv, som versaler utan mellanrum. Till skillnad från normalizeCode tas inga tecken bort i tysthet. */
export function cleanOwnCode(raw: unknown): string {
  return typeof raw === "string" ? raw.toUpperCase().replace(/\s/g, "") : "";
}

/** Vad som är fel med en egen kod, med ord som ägaren kan göra något åt, eller null om den går att använda. */
export function ownCodeProblem(code: string): string | null {
  if (code.length !== CODE_LENGTH) return `Koden ska ha ${CODE_LENGTH} tecken.`;
  if ([...code].some((c) => !CODE_ALPHABET.includes(c))) return "Koden kan ha bokstäverna A–Z och siffrorna 2–9, men inte O, I och L eftersom de är lätta att blanda ihop med siffror.";
  return null;
}

/** Det besökaren får veta om en öppen låda. Aldrig vem som äger den eller hur många frågor den har. */
export type PublicBox = { slug: string | null; code: string | null; title: string; description: string };

export type OpenBoxState = { box?: PublicBox; error?: string };
export type SendState = { ok?: boolean; error?: string };

export type MailDraft = { subject: string; body: string };

/** Ett mejlutkast till en tom mottagare. Radbrytningarna blir CRLF, som mailto-adresser ska ha enligt RFC 6068. */
export function mailtoDraft({ subject, body }: MailDraft): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.replace(/\r?\n/g, "\r\n"))}`;
}

/**
 * Texterna som lådans ägare skickar ut. En fast låda har ingen kod, bara en adress. Löftet om vad som sparas är samma
 * som på den publika sidan (TrustNotes) och får inte säga mer än den.
 */
export function shareTexts({ title, code, link, base, sender }: { title: string; code: string | null; link: string; base: string; sender: string }): { mail: MailDraft; teacher: MailDraft; short: string } {
  const promise = "Vi sparar inget namn, ingen IP-adress och inget klockslag.";
  const how = code ? `Så gör du:\n1. Gå till ${base}/fragelada\n2. Skriv koden ${code}\n\nEller öppna lådan direkt med den här länken: ${link}` : `Öppna lådan här: ${link}`;
  const short = code ? `Ställ en anonym fråga i StatLins frågelåda (${title}). Gå till ${base}/fragelada och skriv koden ${code}. ${promise}` : `Ställ en anonym fråga i StatLins frågelåda (${title}): ${link}. ${promise}`;
  const signed = sender.trim() ? `Hälsningar\n${sender.trim()}` : "Hälsningar\nStatLin";
  const what = code ? "koden" : "länken";
  return {
    mail: {
      subject: `Anonym frågelåda: ${title}`,
      body: `Hej!\n\nDu kan ställa en anonym fråga till oss i StatLins frågelåda: ${title}.\n\n${how}\n\n${promise} Skriv inget som avslöjar dig själv.\n\n${signed}`,
    },
    teacher: {
      subject: `Kan du dela ${what} till en anonym frågelåda?`,
      body: `Hej!\n\nVi i StatLin har öppnat en anonym frågelåda: ${title}. Skulle du kunna dela ${what} med studenterna, till exempel på en föreläsning eller i Lisam?\n\nDen här texten går att klistra in som den är:\n\n${short}\n\nTack på förhand!\n\n${signed}`,
    },
    short,
  };
}
