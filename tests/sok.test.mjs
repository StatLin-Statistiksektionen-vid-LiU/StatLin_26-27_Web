// Sökmotorn i src/lib/search.ts: förenkling, poäng, stavfel, kurskoder, utdrag och markering. Kräver ingen server eller databas.
//   npx tsx --test tests/sok.test.mjs
import assert from "node:assert";
import { test } from "node:test";
import { courseEntries, distance, fold, highlight, makeSnippet, prepareIndex, queryTerms, search } from "../src/lib/search.ts";

const ENTRIES = [
  { href: "/evenemang", kind: "sida", title: "Evenemang", keywords: "sittning pub kalender", boost: 5 },
  { href: "/evenemang/hostsittning", kind: "evenemang", title: "Höstsittning", meta: "12 nov 2026 · Kårallen · Kommande", text: "Välkommen på årets sittning med sångböcker och tre rätter.", boost: 3 },
  { href: "/nyheter/sittningar", kind: "nytt", title: "Höstens sittningar är spikade", meta: "23 oktober 2026", text: "Nu är datumen klara." },
  { href: "/sektionen/styrelsen", kind: "styrelse", title: "Kassör", meta: "Kim Exempel · kassor@example.se", text: "Sköter sektionens ekonomi." },
  { href: "/sektionen/styrelsen", kind: "styrelse", title: "Ordförande", meta: "Alex Exempel · ordf@example.se", text: "Leder styrelsen." },
  { href: "/studenter/tentastatistik", kind: "sida", title: "Tentastatistik", keywords: "betyg tenta kurs", text: "Betyg per kurs och tillfälle.", boost: 5 },
  { href: "/kontakt", kind: "sida", title: "Kontakt", text: "Mottagning och frågor: skriv till styrelsen.", boost: 5 },
  { href: "https://liu.se", kind: "lank", title: "LiU", external: true },
];
const index = () => prepareIndex(ENTRIES);
const titles = (result) => result.hits.map((h) => h.entry.title);

test("fold tar bort accenter och skiljetecken och gör gemener", () => {
  assert.equal(fold("Årshjul"), "arshjul");
  assert.equal(fold("Kassör!"), "kassor ");
  assert.equal(fold("Ö-pub  &  Café"), "o pub cafe");
  assert.equal(fold("årshjul"), "arshjul", "fristående accenttecken försvinner");
});

test("queryTerms delar upp, tar bort dubbletter och slutar efter åtta ord", () => {
  assert.deepEqual(queryTerms("  Sittning, sittning! pub "), ["sittning", "pub"]);
  assert.deepEqual(queryTerms("%_\"'"), []);
  assert.equal(queryTerms("a b c d e f g h i j").length, 8);
  assert.equal(queryTerms("x".repeat(500))[0].length, 100, "frågan kortas till 100 tecken");
});

test("rubriken väger tyngst och alla ord måste finnas", () => {
  const r = search(index(), "sittning");
  assert.ok(r.hits.length >= 3);
  assert.equal(r.hits[0].entry.title, "Höstsittning", "sammansatt ord som slutar på sökordet går före nyckelord och nyheter");
  assert.deepEqual(titles(search(index(), "sittning sångböcker")), ["Höstsittning"]);
  assert.deepEqual(titles(search(index(), "sittning finnsinte")), []);
});

test("å, ä och ö behövs inte", () => {
  assert.deepEqual(titles(search(index(), "kassor")), ["Kassör"]);
  assert.deepEqual(titles(search(index(), "hostsittning")), ["Höstsittning"]);
});

test("träff bara i brödtexten ger utdrag, träff i rubriken gör det inte", () => {
  const r = search(index(), "ekonomi");
  assert.deepEqual(titles(r), ["Kassör"]);
  assert.equal(r.hits[0].inText, true);
  assert.equal(search(index(), "kassör").hits[0].inText, false);
});

test("stavfel rättas och ger ett förslag med å, ä och ö", () => {
  const r = search(index(), "sitning ");
  assert.ok(titles(r).includes("Höstsittning"), "sitning hittar sittning");
  assert.equal(r.suggestion, "sittning");
  assert.ok(r.corrected.includes("sittning"));
  const k = search(index(), "kasör ");
  assert.deepEqual(titles(k), ["Kassör"]);
  assert.equal(k.suggestion, "kassör");
  assert.deepEqual(titles(search(index(), "tentastatestik ")), ["Tentastatistik"]);
  assert.deepEqual(titles(search(index(), "ordfröande ")), ["Ordförande"], "två bokstäver i fel ordning räknas som ett fel");
});

test("ett ord som finns rättas aldrig, och korta ord rättas inte", () => {
  const r = search(index(), "sittning");
  assert.equal(r.suggestion, undefined);
  assert.deepEqual(r.corrected, []);
  assert.deepEqual(titles(search(index(), "pib ")), [], "tre bokstäver rättas inte");
});

test("ordet man håller på att skriva rättas mot början av ord", () => {
  assert.ok(titles(search(index(), "tentastatsi")).includes("Tentastatistik"));
  assert.deepEqual(titles(search(index(), "tentastatsi ")), [], "med mellanslag efter är ordet färdigt");
});

test("distance räknar byten, tillägg, borttagningar och omkastningar", () => {
  assert.equal(distance("sitning", "sittning", 1), 1);
  assert.equal(distance("ordfroande", "ordforande", 2), 1);
  assert.equal(distance("kassor", "kassan", 1), 2, "svarar max + 1 när det är för långt");
  assert.equal(distance("motta", "mottagning", 1, true), 0);
  assert.equal(distance("mottga", "mottagning", 1, true), 1);
  assert.equal(distance("", "abc", 1), 2);
});

test("kurskoder känns igen och exakt kod kommer först", () => {
  const codes = ["732G33", "732G34", "732A99", "TDDE01"];
  assert.deepEqual(courseEntries("732g3", codes).map((e) => e.title), ["732G33", "732G34"]);
  assert.deepEqual(courseEntries("732 g33", codes).map((e) => e.title), ["732G33"]);
  assert.deepEqual(courseEntries("tdde", codes), [], "kräver en siffra");
  assert.deepEqual(courseEntries("73", codes), [], "kräver minst tre tecken");
  const r = search(index(), "732G33", codes);
  assert.equal(r.hits[0].entry.href, "/tentastatistik/732G33");
});

test("udda frågor kraschar inte", () => {
  for (const q of ["<script>alert(1)</script>", "🙂🙂", "\u0000", "a".repeat(10_000), "   ", "-", "ÅÄÖ", "é", "123456789"]) {
    const r = search(index(), q);
    assert.ok(Array.isArray(r.hits));
  }
});

test("highlight markerar sökord och rättade ord men bygger ingen HTML", () => {
  const parts = highlight("Höstens sittningar <b>", ["sittning"]);
  assert.deepEqual(parts, [
    { text: "Höstens ", hit: false },
    { text: "sittning", hit: true },
    { text: "ar <b>", hit: false },
  ]);
  assert.deepEqual(highlight("Kassör", ["kassor"]), [{ text: "Kassör", hit: true }]);
  // Korta ord bara i början av ett ord, rättade ord bara som hela ord.
  assert.deepEqual(highlight("pub repub", ["pu"]), [{ text: "pu", hit: true }, { text: "b repub", hit: false }]);
  assert.deepEqual(highlight("sittning sittningar", [], ["sittning"]), [{ text: "sittning", hit: true }, { text: " sittningar", hit: false }]);
});

test("makeSnippet klipper vid hela ord runt första träffen", () => {
  const text = "Ett två tre fyra fem sex sju åtta nio tio elva tolv tretton fjorton femton sexton sjutton arton nitton tjugo sittning och mer text efteråt som fortsätter länge länge länge länge länge länge länge länge länge.";
  const s = makeSnippet(text, ["sittning"], 30, 80);
  assert.ok(s.startsWith("…") && s.endsWith("…"));
  assert.ok(s.includes("sittning"));
  assert.equal(makeSnippet(text, ["finnsinte"]), undefined);
});
