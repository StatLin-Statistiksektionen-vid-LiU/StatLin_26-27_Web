/**
 * Intresseanmälan till STAR från företag som fått inbjudningslänken: gränser, etiketter och mejltexten. Rent, så att det går att
 * prova utan databas och utan nätverk.
 */

export const INTRESSE_MAX = { foretag: 120, namn: 120, telefon: 40, mote: 200, meddelande: 2000 } as const;

export const INTRESSE_VAL = ["med", "mer"] as const;
export type IntresseVal = (typeof INTRESSE_VAL)[number];
export const INTRESSE_VAL_LABELS: Record<IntresseVal, string> = { med: "Vill vara med", mer: "Vill veta mer först" };

export type MejlStatus = "vantar" | "skickat" | "misslyckades" | "ej_installt";

export type StarIntresse = {
  id: number;
  foretag: string;
  kontakt_namn: string;
  epost: string;
  telefon: string;
  val: IntresseVal;
  vill_boka_mote: boolean;
  moteforslag: string;
  meddelande: string;
  status: "ny" | "hanterad";
  mejl_status: MejlStatus;
  created_at: string;
};

export type IntresseFel = "fel" | "fort" | "full" | "kod";

export function intresseFelText(kod: IntresseFel): string {
  switch (kod) {
    case "fort":
      return "Det har kommit många anmälningar härifrån på kort tid. Försök igen om en stund eller mejla oss.";
    case "full":
      return "Vi kan inte ta emot fler anmälningar via formuläret just nu. Mejla oss i stället.";
    case "kod":
      return "Den här länken gäller inte längre. Mejla oss, så skickar vi en ny.";
    default:
      return "Kontrollera fälten och försök igen.";
  }
}

/** Mejlet till SASU. Svar går direkt till företaget, så ämnet säger det viktigaste: vem det är och om de vill ses. */
export function intresseMejl(
  a: Pick<StarIntresse, "foretag" | "kontakt_namn" | "epost" | "telefon" | "val" | "vill_boka_mote" | "moteforslag" | "meddelande">,
  listUrl: string,
): { subject: string; text: string } {
  const rader = [
    `${a.foretag} har anmält intresse för STAR via inbjudningslänken.`,
    "",
    `Företag: ${a.foretag}`,
    `Kontaktperson: ${a.kontakt_namn}`,
    `E-post: ${a.epost}`,
    ...(a.telefon ? [`Telefon: ${a.telefon}`] : []),
    `Önskemål: ${INTRESSE_VAL_LABELS[a.val]}`,
    `Möte: ${a.vill_boka_mote ? "Ja, vill boka ett möte med SASU eller styrelsen" : "Inget möte önskat än"}`,
    ...(a.vill_boka_mote && a.moteforslag ? [`När det passar: ${a.moteforslag}`] : []),
    ...(a.meddelande ? ["", "Meddelande:", a.meddelande] : []),
    "",
    `Svara på det här mejlet, så går svaret direkt till ${a.kontakt_namn}.`,
    `Alla anmälningar: ${listUrl}`,
  ];
  return {
    subject: a.vill_boka_mote ? `STAR: ${a.foretag} vill boka möte` : `STAR: intresseanmälan från ${a.foretag}`,
    text: rader.join("\n"),
  };
}
