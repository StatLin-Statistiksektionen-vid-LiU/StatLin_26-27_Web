// Datumhanteringen i src/lib/dates.ts och formulärdelarna i src/lib/admin/form.ts. Kräver ingen server eller databas.
//   npx tsx --test tests/datum.test.mjs
import assert from "node:assert";
import { test } from "node:test";
import { eventEnd, formatTimeRange, isValidLocalDateTime } from "../src/lib/dates.ts";
import { zLocalDateTime, zOptionalLocalDateTime } from "../src/lib/admin/form.ts";

// V8 rullar de två första utan fel (2 mars, 1 mars). De två sista ger Invalid Date, och då kastar en rundtur utan vakt (R-21).
const FINNS_INTE = ["2025-02-30T12:00", "2025-02-28T24:00", "2025-13-01T12:00", "2025-02-28T12:60"];

test("SB-32: datum som inte finns i kalendern nekas, utan att vakten själv kastar", () => {
  for (const d of FINNS_INTE) assert.equal(isValidLocalDateTime(d), false, d);
});

test("SB-32: datum som finns godtas, också skottdagen och dygnets sista minut", () => {
  for (const d of ["2025-02-28T12:00", "2024-02-29T00:00", "2025-12-31T23:59"]) assert.equal(isValidLocalDateTime(d), true, d);
  assert.equal(isValidLocalDateTime("2025-02-29T12:00"), false, "2025 är inget skottår");
});

test("SB-32: bara formatet YYYY-MM-DDTHH:mm godtas", () => {
  for (const d of ["", "2025-02-28", "2025-02-28T12:00:00", "2025-02-28 12:00", "28/2 2025"]) assert.equal(isValidLocalDateTime(d), false, d);
});

test("SB-32: starttiden ger fältfel med fältets namn", () => {
  const schema = zLocalDateTime("Starttid");
  for (const d of FINNS_INTE) {
    const r = schema.safeParse(d);
    assert.equal(r.success, false, d);
    assert.match(r.error.issues[0].message, /^Starttid /);
  }
  assert.equal(schema.parse("2025-02-28T12:00"), "2025-02-28T12:00");
});

test("SB-32: ett valfritt fält ger fältfel i stället för att tyst bli tomt", () => {
  const schema = zOptionalLocalDateTime("Sluttid");
  for (const d of [...FINNS_INTE, "2025-02-28"]) {
    const r = schema.safeParse(d);
    assert.equal(r.success, false, d);
    assert.match(r.error.issues[0].message, /^Sluttid /);
  }
  assert.equal(schema.parse("2025-02-28T12:00"), "2025-02-28T12:00");
  assert.equal(schema.parse(""), null, "tomt fält betyder ingen tid");
  assert.equal(schema.parse(undefined), null, "fält som saknas betyder ingen tid");
});

test("SB-01: heldag räknas till slutdagens sista minut, oavsett klockslaget i slutfältet", () => {
  assert.equal(eventEnd("2026-08-17T00:00", "2026-08-21T00:00", true), "2026-08-21T23:59");
  assert.equal(eventEnd("2026-08-17T10:00", "2026-08-21T16:00", true), "2026-08-21T23:59");
  assert.equal(eventEnd("2026-08-17T00:00", null, true), "2026-08-17T23:59");
});

test("SB-01: ett evenemang med klockslag slutar på sluttiden, och utan sluttid vid dygnets slut", () => {
  assert.equal(eventEnd("2026-08-17T18:00", "2026-08-18T01:00", false), "2026-08-18T01:00");
  assert.equal(eventEnd("2026-08-17T18:00", null, false), "2026-08-17T23:59");
});

test("SB-01: tidsraden visar heldagens slutdatum, men bara när det är en annan dag", () => {
  assert.equal(formatTimeRange("2026-08-17T00:00", "2026-08-21T00:00", true), "Heldag t.o.m. 21 augusti");
  assert.equal(formatTimeRange("2026-12-30T00:00", "2027-01-02T00:00", true), "Heldag t.o.m. 2 januari 2027");
  assert.equal(formatTimeRange("2026-08-17T00:00", "2026-08-17T00:00", true), "Heldag");
  assert.equal(formatTimeRange("2026-08-17T00:00", null, true), "Heldag");
  assert.equal(formatTimeRange("2026-08-17T18:00", "2026-08-17T21:00", false), "18:00–21:00");
});
