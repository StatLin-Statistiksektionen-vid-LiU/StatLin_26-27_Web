// Snabbkontroll av en körande sajt: läser bara, ändrar ingenting och är därför säker att köra
// mot produktion – efter varje driftsättning, uppgradering eller byte av värd. Kräver bara Node.
//
//   node tests/smoke.mjs https://statlin.se
//
// Kontrollerar att de publika sidorna svarar utan fel (även länksidan och tentastatistiken), att hälsokontrollen, kalenderflödet,
// sitemap och robots.txt fungerar, att adminpanelen kräver inloggning, att fliken har en ikon,
// och att delningsbilden, canonical, sitemap och robots.txt pekar på sajtens adress, SITE_URL (ST-20). Adressen är
// miljövariabeln SITE_URL om den är satt, annars adressen som provas. Fel adress betyder att sajten byggdes med en annan
// SITE_URL – den bakas in vid bygget, se README. Lokalt utan SITE_URL bakar sajten in http://localhost:3000.

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const IS_LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(BASE);
const SITE_URL = (process.env.SITE_URL || BASE).replace(/\/$/, "");
const onSite = (url) => url === SITE_URL || url.startsWith(`${SITE_URL}/`);

const PAGES = [
  "/",
  "/evenemang",
  "/nyheter",
  "/sektionen",
  "/sektionen/styrelsen",
  "/utskott",
  "/galleri",
  "/dokument",
  "/grafisk-profil",
  "/studenter/kandidat",
  "/studenter/master",
  "/studenter/ny-student",
  "/studenter/lankar",
  "/studenter/hjalpmedel",
  "/tentastatistik",
  "/tentastatistik/732G33",
  "/foretag",
  "/kontakt",
  "/en",
  "/en/masters",
  "/integritet",
  "/logga-in",
];

const results = [];
async function check(name, fn) {
  try {
    const note = await fn();
    results.push(`✓ ${name}${note ? ` – ${note}` : ""}`);
  } catch (e) {
    results.push(`✗ ${name}: ${e.message}`);
  }
}

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

async function get(path, init) {
  const res = await fetch(BASE + path, { redirect: "manual", signal: AbortSignal.timeout(30_000), ...init });
  if (res.status !== 200) await res.body?.cancel();
  return { res, body: res.status === 200 ? await res.text() : "" };
}

await check("Hälsokontroll /api/health", async () => {
  const { res, body } = await get("/api/health");
  expect(res.status === 200, `status ${res.status}`);
  expect(JSON.parse(body).ok === true, `svarade ${body}`);
});

for (const path of PAGES) {
  await check(`Sidan ${path}`, async () => {
    const { res, body } = await get(path);
    expect(res.status === 200, `status ${res.status}`);
    expect(!body.includes('id="__next_error__"'), "sidan visar ett felmeddelande");
    expect(/<h1[\s>]/.test(body), "saknar rubrik (h1)");
    if (path.startsWith("/en")) expect(body.includes('lang="en"'), 'saknar lang="en"');
  });
}

await check("Kurskoder med gemener skickas till versaler", async () => {
  const { res } = await get("/tentastatistik/732g33");
  const location = res.headers.get("location") ?? "";
  expect(res.status === 308 && location.endsWith("/tentastatistik/732G33"), `status ${res.status} ${location}`);
});

await check("Kurskoderna till sökrutan /api/tentastatistik/koder", async () => {
  const { res, body } = await get("/api/tentastatistik/koder");
  expect(res.status === 200, `status ${res.status}`);
  const codes = JSON.parse(body);
  expect(Array.isArray(codes), "svaret är inte en lista");
  return codes.length ? `${codes.length} koder` : "tom lista – källan svarar inte just nu";
});

await check("Språkväxlare till /en på startsidan", async () => {
  const { body } = await get("/");
  expect(/href="\/en"[^>]*hrefLang="en"|hrefLang="en"[^>]*href="\/en"/i.test(body), "länken till /en saknas");
});

await check("Delningsbild (og:image)", async () => {
  const { body } = await get("/");
  const og = body.match(/property="og:image" content="([^"]+)"/)?.[1];
  expect(og, "og:image saknas");
  expect(onSite(og), `pekar på ${og}, inte ${SITE_URL} – sätt SITE_URL och bygg om`);
  return og;
});

await check("Kanonisk adress (canonical)", async () => {
  const { body } = await get("/");
  const link = body.match(/<link[^>]*\srel="canonical"[^>]*>/)?.[0];
  expect(link, 'länk med rel="canonical" saknas');
  const href = link.match(/\shref="([^"]+)"/)?.[1] ?? "";
  expect(onSite(href), `pekar på ${href}, inte ${SITE_URL} – sätt SITE_URL och bygg om`);
  return href;
});

await check("Flikikon (rel=icon)", async () => {
  const { body } = await get("/");
  const link = body.match(/<link[^>]*\srel="(?:shortcut )?icon"[^>]*>/)?.[0];
  expect(link, 'länk med rel="icon" saknas – webbläsarfliken visar ingen ikon');
  const href = link.match(/\shref="([^"]+)"/)?.[1] ?? "";
  const { pathname, search } = new URL(href, BASE);
  const { res } = await get(pathname + search);
  expect(res.status === 200, `${href} gav status ${res.status}`);
  expect((res.headers.get("content-type") ?? "").startsWith("image/"), `${href} har content-type ${res.headers.get("content-type")}`);
  return href;
});

await check("Kalenderflöde /kalender.ics", async () => {
  const { res, body } = await get("/kalender.ics");
  expect(res.status === 200, `status ${res.status}`);
  expect((res.headers.get("content-type") ?? "").includes("text/calendar"), `content-type ${res.headers.get("content-type")}`);
  expect(body.startsWith("BEGIN:VCALENDAR"), "inte ett giltigt iCal-flöde");
});

await check("Sitemap /sitemap.xml", async () => {
  const { res, body } = await get("/sitemap.xml");
  expect(res.status === 200, `status ${res.status}`);
  expect(body.includes("<urlset"), "inte en sitemap");
  const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  expect(locs.length > 0, "sitemapen har inga adresser");
  const off = locs.filter((u) => !onSite(u));
  expect(off.length === 0, `${off.length} av ${locs.length} adresser börjar inte med ${SITE_URL}, t.ex. ${off[0]} – sätt SITE_URL`);
  return `${locs.length} adresser`;
});

await check("robots.txt", async () => {
  const { res, body } = await get("/robots.txt");
  expect(res.status === 200, `status ${res.status}`);
  expect(body.includes("Disallow: /admin"), "adminpanelen är inte undantagen");
  // Raden finns bara när sajten byggdes med SITE_URL – lokalt utan SITE_URL får den saknas.
  const sitemap = body.match(/^Sitemap: (.+)$/m)?.[1]?.trim();
  expect(sitemap || (IS_LOCAL && !process.env.SITE_URL), "Sitemap-raden saknas – sätt SITE_URL och bygg om");
  if (sitemap) expect(sitemap === `${SITE_URL}/sitemap.xml`, `Sitemap-raden är ${sitemap}, inte ${SITE_URL}/sitemap.xml – sätt SITE_URL och bygg om`);
});

await check("Adminpanelen kräver inloggning", async () => {
  const { res } = await get("/admin");
  const location = res.headers.get("location") ?? "";
  expect(res.status >= 300 && res.status < 400 && location.includes("/logga-in"), `status ${res.status} ${location}`);
});

await check("Okänd sida ger 404", async () => {
  const { res } = await get("/finns-inte-" + Date.now());
  expect(res.status === 404, `status ${res.status}`);
});

console.log(`Snabbkontroll av ${BASE}\n`);
console.log(results.join("\n"));
const failed = results.filter((r) => r.startsWith("✗")).length;
console.log(failed ? `\n${failed} kontroll(er) misslyckades.` : "\nAllt ser bra ut.");
process.exit(failed ? 1 : 0);
