// Mejlet till SASU när ett företag anmäler intresse för STAR.
import assert from "node:assert/strict";
import test from "node:test";
import { intresseFelText, intresseMejl } from "../src/lib/star-intresse.ts";

const anmalan = {
  foretag: "Exempelbolaget AB",
  kontakt_namn: "Alex Exempel",
  epost: "alex@example.com",
  telefon: "",
  val: "med",
  vill_boka_mote: false,
  moteforslag: "",
  meddelande: "",
};
const LISTA = "https://statlin.se/admin/intresseanmalningar";

test("Ämnet säger vem det är", () => {
  assert.equal(intresseMejl(anmalan, LISTA).subject, "STAR: intresseanmälan från Exempelbolaget AB");
});

test("Vill de boka möte står det i ämnet, så att det syns i inkorgen", () => {
  assert.equal(intresseMejl({ ...anmalan, vill_boka_mote: true }, LISTA).subject, "STAR: Exempelbolaget AB vill boka möte");
});

test("Alla ifyllda fält och länken till listan finns med", () => {
  const { text } = intresseMejl(
    { ...anmalan, telefon: "013-12 34 56", val: "mer", vill_boka_mote: true, moteforslag: "Tisdagar efter lunch", meddelande: "Vi söker exjobbare.\nHelst från januari." },
    LISTA,
  );
  for (const del of ["Exempelbolaget AB", "Alex Exempel", "alex@example.com", "013-12 34 56", "Vill veta mer först", "Tisdagar efter lunch", "Vi söker exjobbare.\nHelst från januari.", LISTA]) {
    assert.ok(text.includes(del), `saknar ${del}`);
  }
});

test("Tomma fält lämnar inga tomma rader efter sig", () => {
  const { text } = intresseMejl(anmalan, LISTA);
  assert.ok(!text.includes("Telefon:"));
  assert.ok(!text.includes("När det passar:"));
  assert.ok(!text.includes("Meddelande:"));
  assert.ok(text.includes("Inget möte önskat än"));
});

test("Ett mötesförslag utan önskat möte följer inte med", () => {
  assert.ok(!intresseMejl({ ...anmalan, moteforslag: "Tisdagar" }, LISTA).text.includes("Tisdagar"));
});

test("Inga tankstreck i texterna", () => {
  const { subject, text } = intresseMejl({ ...anmalan, vill_boka_mote: true, moteforslag: "x", meddelande: "y" }, LISTA);
  for (const del of [subject, text, ...["fel", "fort", "full", "kod"].map(intresseFelText)]) {
    assert.ok(!/[–—]/.test(del), del);
  }
});
