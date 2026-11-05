// Texterna för att dela frågelådans kod i ett mejl eller via läraren. Körs utan server: npx tsx --test tests/fragelada.test.mjs
import assert from "node:assert";
import test from "node:test";
import { CODE_ALPHABET, CODE_LENGTH, cleanOwnCode, generateCode, mailtoDraft, normalizeCode, ownCodeProblem, shareTexts } from "../src/lib/fragelada.ts";

const BOX = { title: "Regression", code: "STAT26", link: "https://statlin.se/fragelada?kod=STAT26", base: "https://statlin.se", sender: "Kim Svensson" };
const PROMISE = "Vi sparar inget namn, ingen IP-adress och inget klockslag.";

test("en slumpad kod har rätt längd, bara giltiga tecken och går att använda som egen kod", () => {
  for (let i = 0; i < 200; i++) {
    const code = generateCode();
    assert.equal(code.length, CODE_LENGTH);
    assert.ok([...code].every((c) => CODE_ALPHABET.includes(c)), code);
    assert.equal(ownCodeProblem(code), null);
    assert.equal(normalizeCode(code), code);
  }
});

test("en egen kod: versaler och mellanrum städas, men fel tecken stoppas med ett begripligt fel", () => {
  assert.equal(cleanOwnCode(" stat 26 "), "STAT26");
  assert.equal(cleanOwnCode(undefined), "");
  assert.equal(ownCodeProblem("STAT26"), null);
  assert.match(ownCodeProblem("ABC"), /6 tecken/);
  assert.match(ownCodeProblem("ABCDEFG"), /6 tecken/);
  for (const bad of ["STAT20", "OOOOOO", "ILLA22", "ÅÄÖ234", "AB-C23"]) assert.match(ownCodeProblem(bad), /inte O, I och L/, bad);
});

test("en låda med kod: alla texter har koden, sidan och löftet", () => {
  const { mail, teacher, short } = shareTexts(BOX);
  for (const text of [mail.body, teacher.body, short]) {
    assert.ok(text.includes("STAT26"), text);
    assert.ok(text.includes("https://statlin.se/fragelada"), text);
    assert.ok(text.includes(PROMISE), text);
    assert.ok(text.includes("Regression"), text);
  }
  assert.equal(mail.subject, "Anonym frågelåda: Regression");
  assert.match(teacher.subject, /koden/);
  assert.ok(teacher.body.includes("Lisam"));
  assert.ok(mail.body.endsWith("Hälsningar\nKim Svensson"));
});

test("en fast låda: länken i stället för en kod", () => {
  const link = "https://statlin.se/fragelada/amo";
  const { mail, teacher, short } = shareTexts({ ...BOX, code: null, link });
  for (const text of [mail.body, teacher.body, short]) {
    assert.ok(text.includes(link), text);
    assert.ok(!text.includes("STAT26"), text);
    assert.ok(!/skriv koden/i.test(text), text);
  }
  assert.match(teacher.subject, /länken/);
});

test("utan avsändarens namn står StatLin under mejlet", () => {
  assert.ok(shareTexts({ ...BOX, sender: "  " }).mail.body.endsWith("Hälsningar\nStatLin"));
});

test("mejlet blir en adress utan mottagare, med åäö kodat och riktiga radbrytningar", () => {
  assert.equal(mailtoDraft({ subject: "Åäö & fråga?", body: "Rad 1\nRad 2" }), "mailto:?subject=%C3%85%C3%A4%C3%B6%20%26%20fr%C3%A5ga%3F&body=Rad%201%0D%0ARad%202");
  assert.equal(mailtoDraft({ subject: "A", body: "Rad 1\r\nRad 2" }), "mailto:?subject=A&body=Rad%201%0D%0ARad%202");
});
