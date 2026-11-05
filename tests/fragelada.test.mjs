// Texterna för att dela frågelådans kod i ett mejl eller via läraren. Körs utan server: npx tsx --test tests/fragelada.test.mjs
import assert from "node:assert";
import test from "node:test";
import { mailtoDraft, shareTexts } from "../src/lib/fragelada.ts";

const BOX = { title: "Regression", code: "STAT26", link: "https://statlin.se/fragelada?kod=STAT26", base: "https://statlin.se", sender: "Kim Svensson" };
const PROMISE = "Vi sparar inget namn, ingen IP-adress och inget klockslag.";

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
