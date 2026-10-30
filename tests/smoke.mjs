// Snabbkontroll av en körande sajt: läser bara, ändrar ingenting och är därför säker att köra
// mot produktion – efter varje driftsättning, uppgradering eller byte av värd. Kräver bara Node.
//
//   node tests/smoke.mjs https://statlin.se
//
// Kontrollerar att de publika sidorna svarar utan fel, att hälsokontrollen, kalenderflödet,
// sitemap och robots.txt fungerar, att adminpanelen kräver inloggning, att fliken har en ikon,
// och att delningsbilder inte pekar på localhost (då saknades SITE_URL när sajten byggdes – se README).

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const IS_LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(BASE);

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
  "/utbildning",
  "/ny-student",
  "/foretag",
  "/kontakt",
  "/en",
  "/en/masters",
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

await check("Språkväxlare till /en på startsidan", async () => {
  const { body } = await get("/");
  expect(/href="\/en"[^>]*hrefLang="en"|hrefLang="en"[^>]*href="\/en"/i.test(body), "länken till /en saknas");
});

await check("Delningsbild (og:image)", async () => {
  const { body } = await get("/");
  const og = body.match(/property="og:image" content="([^"]+)"/)?.[1];
  expect(og, "og:image saknas");
  expect(IS_LOCAL || !og.includes("localhost"), `pekar på ${og} – sätt SITE_URL och bygg om`);
  return og;
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
  expect(IS_LOCAL || !body.includes("localhost"), "adresserna pekar på localhost – sätt SITE_URL");
  return `${(body.match(/<loc>/g) ?? []).length} adresser`;
});

await check("robots.txt", async () => {
  const { res, body } = await get("/robots.txt");
  expect(res.status === 200, `status ${res.status}`);
  expect(body.includes("Disallow: /admin"), "adminpanelen är inte undantagen");
  expect(IS_LOCAL || /^Sitemap: https?:\/\//m.test(body), "Sitemap-raden saknas – sätt SITE_URL och bygg om");
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
