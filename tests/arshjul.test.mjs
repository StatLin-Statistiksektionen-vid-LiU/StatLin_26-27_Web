// Årshjulets och projektplanernas datumlogik, särskilt månader och terminer kring årsskiftet. Kräver ingen server:
//   npx tsx --test tests/arshjul.test.mjs
import assert from "node:assert";
import { test } from "node:test";
import { currentTermOf, effectiveStatus, itemTerm, matchesResponsible, monthParam, nextMonthOf, suggestedDueDate, suggestedPlanDate, termOfMonth, wheelAngle, wheelCards, yearInRange } from "../src/lib/arshjul.ts";
import { WHEEL_SUGGESTIONS } from "../src/lib/arshjul-forslag.ts";
import { isValidDate, PLAN_TEMPLATES, planTemplate, stepDate, weeksBefore } from "../src/lib/projektplan-mallar.ts";

const item = (id, fields) => ({ id, title: `Punkt ${id}`, description: "", responsible: "", month: null, term: null, depends_on: "", template: "", owner_user_id: null, seed_key: null, ...fields });
const state = (item_id, year, fields = {}) => ({ item_id, year, status: "oppen", task_id: null, task_status: null, project_plan_id: null, ...fields });
const noState = () => undefined;
const ids = (rows) => rows.map((r) => r.item.id);

test("terminerna delar året mellan juni och juli", () => {
  assert.equal(termOfMonth(1), "vt");
  assert.equal(termOfMonth(6), "vt");
  assert.equal(termOfMonth(7), "ht");
  assert.equal(termOfMonth(12), "ht");
  assert.equal(itemTerm({ month: 9, term: "vt" }), "ht", "månaden går före den sparade terminen");
  assert.equal(itemTerm({ month: null, term: "ht" }), "ht");
});

test("nästa månad går över årsskiftet", () => {
  assert.deepEqual(nextMonthOf("2026-11-30"), { year: 2026, month: 12 });
  assert.deepEqual(nextMonthOf("2026-12-01"), { year: 2027, month: 1 });
  assert.deepEqual(nextMonthOf("2026-12-31"), { year: 2027, month: 1 });
  assert.deepEqual(nextMonthOf("2027-01-01"), { year: 2027, month: 2 });
});

test("terminen byts vid halvårsskiftet och årsskiftet", () => {
  assert.deepEqual(currentTermOf("2026-06-30"), { year: 2026, term: "vt" });
  assert.deepEqual(currentTermOf("2026-07-01"), { year: 2026, term: "ht" });
  assert.deepEqual(currentTermOf("2026-12-31"), { year: 2026, term: "ht" });
  assert.deepEqual(currentTermOf("2027-01-01"), { year: 2027, term: "vt" });
});

test("kortet nästa månad läser nästa års läge i december", () => {
  const items = [item(1, { month: 1, term: "vt" })];
  const klarIFjol = (id, year) => (year === 2026 ? state(id, year, { status: "klar" }) : undefined);
  const { nextMonth, next } = wheelCards(items, klarIFjol, "2026-12-15");
  assert.deepEqual(next, { year: 2027, month: 1 });
  assert.deepEqual(ids(nextMonth), [1], "avklarad 2026 betyder inte avklarad 2027");
  assert.equal(nextMonth[0].year, 2027);
  const klarNastaAr = (id, year) => (year === 2027 ? state(id, year, { status: "klar" }) : undefined);
  assert.deepEqual(ids(wheelCards(items, klarNastaAr, "2026-12-15").nextMonth), []);
});

test("avklarat och överhoppat försvinner från korten, planerat står kvar på nästa månad", () => {
  const items = [item(1, { month: 12 }), item(2, { month: 12 }), item(3, { month: 12 })];
  const stateOf = (id, year) => (id === 1 ? state(id, year, { status: "klar" }) : id === 2 ? state(id, year, { status: "hoppad" }) : state(id, year, { status: "planerad", project_plan_id: 9 }));
  const { nextMonth } = wheelCards(items, stateOf, "2026-11-10");
  assert.deepEqual(ids(nextMonth), [3]);
  assert.equal(nextMonth[0].status, "planerad");
});

test("egna punkter står före förslagen på kortet nästa månad", () => {
  const items = [item(1, { month: 12, seed_key: "a" }), item(2, { month: 12 }), item(3, { month: 12, seed_key: "b" })];
  assert.deepEqual(ids(wheelCards(items, noState, "2026-11-10").nextMonth), [2, 1, 3]);
});

test("kortet att planera in tar terminens punkter som beror på andra eller saknar månad", () => {
  const items = [
    item(1, { month: 11, depends_on: "Företagen" }),
    item(2, { term: "ht" }),
    item(3, { term: "vt" }),
    item(4, { month: 3, depends_on: "Annan termin" }),
    item(5, { month: 9 }),
    item(6, { month: 8, depends_on: "Redan planerad" }),
  ];
  const stateOf = (id, year) => (id === 6 ? state(id, year, { status: "planerad", task_id: 3, task_status: "planerad" }) : undefined);
  const { toPlan, current } = wheelCards(items, stateOf, "2026-09-15");
  assert.deepEqual(current, { year: 2026, term: "ht" });
  assert.deepEqual(ids(toPlan), [1, 2], "månad i kalenderordning, utan månad sist");
  assert.equal(toPlan[0].late, false);
  assert.equal(toPlan[1].late, false);
});

test("kortet att planera in byter termin vid årsskiftet och flaggar passerade månader", () => {
  const items = [item(1, { month: 8, depends_on: "x" }), item(2, { month: 2, depends_on: "y" })];
  assert.deepEqual(ids(wheelCards(items, noState, "2026-12-31").toPlan), [1]);
  assert.equal(wheelCards(items, noState, "2026-12-31").toPlan[0].late, true);
  assert.deepEqual(ids(wheelCards(items, noState, "2027-01-01").toPlan), [], "februari är nästa månad i januari, inte både och");
  assert.deepEqual(ids(wheelCards(items, noState, "2027-01-01").nextMonth), [2]);
  assert.deepEqual(ids(wheelCards(items, noState, "2027-02-01").toPlan), [2]);
  assert.equal(wheelCards(items, noState, "2027-02-01").toPlan[0].late, false, "innevarande månad har inte passerat");
  assert.equal(wheelCards(items, noState, "2027-03-01").toPlan[0].late, true);
});

test("en punkt står bara på ett kort", () => {
  const items = [item(1, { month: 12, depends_on: "x" })];
  const { nextMonth, toPlan } = wheelCards(items, noState, "2026-11-10");
  assert.deepEqual(ids(nextMonth), [1]);
  assert.deepEqual(ids(toPlan), []);
});

test("punkten blir öppen igen när uppdraget eller planen tas bort", () => {
  assert.equal(effectiveStatus(undefined), "oppen");
  assert.equal(effectiveStatus(state(1, 2026, { status: "planerad" })), "oppen", "referensen är nollad av ON DELETE SET NULL");
  assert.equal(effectiveStatus(state(1, 2026, { status: "planerad", task_id: 4, task_status: "pagar" })), "planerad");
  assert.equal(effectiveStatus(state(1, 2026, { status: "planerad", project_plan_id: 4 })), "planerad");
  assert.equal(effectiveStatus(state(1, 2026, { status: "planerad", task_id: 4, task_status: "klar" })), "klar");
  assert.equal(effectiveStatus(state(1, 2026, { status: "planerad", task_id: 4, task_status: "klar", project_plan_id: 2 })), "planerad", "planen är inte klar för att ett uppdrag är det");
  assert.equal(effectiveStatus(state(1, 2026, { status: "hoppad", task_id: 4, task_status: "pagar" })), "hoppad");
});

test("förfallodatum: månadens första, en månad tidigare om den beror på andra", () => {
  assert.equal(suggestedDueDate({ month: 12, term: "ht", depends_on: "" }, 2026, "2026-11-10"), "2026-12-01");
  assert.equal(suggestedDueDate({ month: 12, term: "ht", depends_on: "x" }, 2026, "2026-10-10"), "2026-11-01");
});

test("förfallodatum vid årsskiftet: januari som beror på andra ska vara klar i december året före", () => {
  assert.equal(suggestedDueDate({ month: 1, term: "vt", depends_on: "x" }, 2027, "2026-11-10"), "2026-12-01");
  assert.equal(suggestedDueDate({ month: 1, term: "vt", depends_on: "" }, 2027, "2026-12-15"), "2027-01-01");
});

test("förfallodatum: har det passerat får uppdraget en vecka, också över årsskiftet", () => {
  assert.equal(suggestedDueDate({ month: 12, term: "ht", depends_on: "x" }, 2026, "2026-12-28"), "2027-01-04");
  assert.equal(suggestedDueDate({ month: 3, term: "vt", depends_on: "" }, 2026, "2026-03-02"), "2026-03-09");
});

test("förfallodatum utan månad: två veckor, men aldrig efter terminens slut", () => {
  assert.equal(suggestedDueDate({ month: null, term: "ht", depends_on: "" }, 2026, "2026-09-01"), "2026-09-15");
  assert.equal(suggestedDueDate({ month: null, term: "ht", depends_on: "" }, 2026, "2026-12-25"), "2026-12-31");
  assert.equal(suggestedDueDate({ month: null, term: "vt", depends_on: "" }, 2026, "2026-06-25"), "2026-06-30");
});

test("planens datum: mitt i månaden, eller om sex veckor när den passerat", () => {
  assert.equal(suggestedPlanDate({ month: 12 }, 2026, "2026-11-10"), "2026-12-15");
  assert.equal(suggestedPlanDate({ month: 12 }, 2026, "2026-12-20"), "2027-01-31");
  assert.equal(suggestedPlanDate({ month: null }, 2026, "2026-11-30"), "2027-01-11");
  assert.equal(suggestedPlanDate({ month: 1 }, 2027, "2026-12-20"), "2027-01-15");
});

test("visaren står vid månadens början, och året går runt", () => {
  assert.equal(wheelAngle("2026-01-01"), 0);
  assert.equal(wheelAngle("2026-07-01"), 180);
  assert.ok(wheelAngle("2026-12-31") < 360);
  assert.ok(wheelAngle("2026-12-31") > 359, "den sista dagen ligger precis före toppen");
  assert.ok(wheelAngle("2028-02-29") < 60, "skottdagen går inte över i mars");
});

test("adressens år och månad", () => {
  assert.equal(yearInRange(2027, "2026-12-31"), true);
  assert.equal(yearInRange(2028, "2026-12-31"), false);
  assert.equal(yearInRange(2025, "2026-01-01"), true);
  assert.equal(yearInRange(2024, "2026-01-01"), false);
  for (const bad of ["0", "13", "01", "1.5", "x", "", undefined, ["1"]]) assert.equal(monthParam(bad), null, String(bad));
  assert.equal(monthParam("1"), 1);
  assert.equal(monthParam("12"), 12);
});

test("ansvarig post jämförs utan skillnad på stora och små bokstäver", () => {
  const scb = { post: "", committee_name: "SCB" };
  assert.equal(matchesResponsible(scb, "scb "), true);
  assert.equal(matchesResponsible(scb, ""), false, "en tom ansvarig matchar inte ett konto utan post");
  assert.equal(matchesResponsible({ post: "Kassör", committee_name: null }, "kassör"), true);
  assert.equal(matchesResponsible({ post: "Kassör", committee_name: null }, "Ordförande"), false);
});

test("stegen räknas bakåt från datumet, över årsskiftet och över sommartiden", () => {
  assert.equal(stepDate("2027-01-15", 4), "2026-12-18");
  assert.equal(stepDate("2027-01-15", 0), "2027-01-15");
  assert.equal(stepDate("2027-01-15", -1), "2027-01-22");
  assert.equal(stepDate("2026-04-02", 1), "2026-03-26", "sommartiden börjar 29 mars 2026");
  assert.equal(stepDate("2026-10-29", 1), "2026-10-22", "vintertiden börjar 25 oktober 2026");
  assert.equal(stepDate("2028-03-07", 1), "2028-02-29", "skottdagen");
});

test("veckorna före datumet är motsatsen till stegens datum", () => {
  assert.equal(weeksBefore("2027-01-15", "2026-12-18"), 4);
  assert.equal(weeksBefore("2027-01-15", "2027-01-15"), 0);
  assert.equal(weeksBefore("2027-01-15", "2027-01-22"), -1);
  for (const t of PLAN_TEMPLATES) for (const s of t.steps) assert.equal(weeksBefore("2026-04-02", stepDate("2026-04-02", s.weeks)), s.weeks, `${t.key}: ${s.title}`);
});

test("datum som inte finns nekas", () => {
  for (const bad of ["2026-02-30", "2026-13-01", "2026-1-1", "", "x", "2026-12-03T00:00"]) assert.equal(isValidDate(bad), false, bad);
  assert.equal(isValidDate("2028-02-29"), true);
});

test("mallarna: fyra stycken, med steg i datumordning och unika rubriker", () => {
  assert.deepEqual(PLAN_TEMPLATES.map((t) => t.key).sort(), ["evenemang", "gastforelasning", "sittning", "star"]);
  assert.equal(planTemplate("finns-inte"), undefined);
  for (const t of PLAN_TEMPLATES) {
    assert.deepEqual(t.steps.map((s) => s.weeks), [...t.steps.map((s) => s.weeks)].sort((a, b) => b - a), t.key);
    assert.equal(new Set(t.steps.map((s) => s.title)).size, t.steps.length, t.key);
  }
});

test("förslagen: unika nycklar, månaden stämmer med terminen, mallarna finns", () => {
  assert.equal(new Set(WHEEL_SUGGESTIONS.map((s) => s.seed_key)).size, WHEEL_SUGGESTIONS.length);
  for (const s of WHEEL_SUGGESTIONS) {
    assert.ok(s.month !== null || s.term !== null, s.seed_key);
    assert.ok(s.title.length <= 140, s.seed_key);
    if (s.template) assert.ok(planTemplate(s.template), s.seed_key);
  }
});
