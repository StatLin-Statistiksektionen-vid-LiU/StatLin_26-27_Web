// Snabbkontroll av en körande sajt: ändrar ingenting och är därför säker att köra mot produktion – efter varje
// driftsättning, uppgradering eller byte av värd. Kräver bara Node. Det enda den skickar är tomma POST-anrop utan inloggning
// till uppladdningen, och de nekas innan något händer.
//
//   node tests/smoke.mjs https://statlin.se
//
// Kontrollerar att de publika sidorna svarar utan fel (även länksidan och tentastatistiken), att hälsokontrollen, kalenderflödet,
// sitemap och robots.txt fungerar, att adminpanelen kräver inloggning, att uppladdningen nekar andra ursprung, att mediaadresser
// inte leder ut ur uppladdningsmappen, att fliken har en ikon, att sidorna skickar säkerhetsrubrikerna, att sitemapen och kalenderfilerna får cachas, och att delningsbilden, canonical, sitemap och robots.txt pekar på sajtens adress, SITE_URL (ST-20). Adressen är
// miljövariabeln SITE_URL om den är satt, annars adressen som provas. Fel adress betyder att sajten byggdes med en annan
// SITE_URL – den bakas in vid bygget, se README – eller att smoke körs mot en annan adress än den sajten byggdes med:
// kör då smoke med SITE_URL=<adressen sajten byggdes med>. Lokalt utan SITE_URL bakar layouten in reservadressen
// http://localhost:3000 (src/app/layout.tsx), medan sitemapen tar adressen ur Host – båda godtas då.

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const IS_LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(BASE);
const SITE_URL = (process.env.SITE_URL || BASE).replace(/\/$/, "");
const bases = [SITE_URL, ...(IS_LOCAL && !process.env.SITE_URL ? ["http://localhost:3000"] : [])];
const onSite = (url) => bases.some((b) => url === b || url.startsWith(`${b}/`));
const REMEDY = "kör smoke med SITE_URL=<adressen sajten byggdes med>, eller bygg om med rätt SITE_URL";

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
  expect(onSite(og), `pekar på ${og}, inte ${SITE_URL} – ${REMEDY}`);
  return og;
});

await check("Kanonisk adress (canonical)", async () => {
  const { body } = await get("/");
  const link = body.match(/<link[^>]*\srel="canonical"[^>]*>/)?.[0];
  expect(link, 'länk med rel="canonical" saknas');
  const href = link.match(/\shref="([^"]+)"/)?.[1] ?? "";
  expect(onSite(href), `pekar på ${href}, inte ${SITE_URL} – ${REMEDY}`);
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
  expect(off.length === 0, `${off.length} av ${locs.length} adresser börjar inte med ${SITE_URL}, t.ex. ${off[0]} – ${REMEDY}`);
  return `${locs.length} adresser`;
});

await check("robots.txt", async () => {
  const { res, body } = await get("/robots.txt");
  expect(res.status === 200, `status ${res.status}`);
  expect(body.includes("Disallow: /admin"), "adminpanelen är inte undantagen");
  // Raden finns bara när sajten byggdes med SITE_URL – lokalt utan SITE_URL får den saknas.
  const sitemap = body.match(/^Sitemap: (.+)$/m)?.[1]?.trim();
  expect(sitemap || (IS_LOCAL && !process.env.SITE_URL), "Sitemap-raden saknas – bygg om med SITE_URL");
  if (sitemap) {
    expect(bases.some((b) => sitemap === `${b}/sitemap.xml`), `Sitemap-raden är ${sitemap}, inte ${SITE_URL}/sitemap.xml – ${REMEDY}`);
  }
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

await check("Uppladdning utan rätt ursprung nekas", async () => {
  const upload = async (headers) => (await get("/api/admin/upload", { method: "POST", headers })).res.status;
  expect((await upload({})) === 403, "ett anrop utan Origin släpptes igenom");
  expect((await upload({ origin: "https://example.com" })) === 403, "ett anrop från en annan sajt släpptes igenom");
  expect((await upload({ origin: "null" })) === 403, "ett anrop från en sandlådad sida släpptes igenom");
  // Från sajten själv kommer anropet förbi spärren och nekas först för att ingen är inloggad.
  const own = await upload({ origin: new URL(BASE).origin });
  expect(own === 401, `ett anrop från sajten själv gav status ${own}, inte 401`);
});

await check("Mediaadresser kan inte leda ut ur uppladdningsmappen", async () => {
  const paths = [
    "/media/..%2f..%2fetc%2fpasswd",
    "/media/..%2fstatlin.db",
    "/media/%2e%2e%2fstatlin.db",
    "/media/..%5cstatlin.db",
    "/media/2026/01/..%2f..%2f..%2fstatlin.db",
  ];
  for (const path of paths) {
    const { res } = await get(path);
    expect(res.status === 404, `${path} gav status ${res.status}`);
  }
});

await check("Säkerhetsrubriker", async () => {
  const { res } = await get("/");
  const csp = res.headers.get("content-security-policy") ?? "";
  for (const part of ["default-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'"]) {
    expect(csp.includes(part), `Content-Security-Policy saknar ${part}: ${csp || "ingen rubrik"}`);
  }
  expect(/max-age=[1-9]/.test(res.headers.get("strict-transport-security") ?? ""), "Strict-Transport-Security saknas");
  expect(res.headers.get("x-content-type-options") === "nosniff", "X-Content-Type-Options saknas");
  // Uppladdade filer har en egen, striktare policy i media-rutten. Sajtens policy (next.config.ts) får inte gälla där.
  const media = (await get("/media/finns/inte.webp")).res.headers.get("content-security-policy") ?? "";
  expect(!media.includes("default-src 'self'"), `/media har sajtens policy: ${media}`);
});

await check("Sitemapen och kalenderfilerna får cachas", async () => {
  const expectCached = async (path) => {
    const { res } = await get(path);
    expect(res.status === 200, `${path} gav status ${res.status}`);
    const value = res.headers.get("cache-control") ?? "";
    expect(/\bpublic\b.*\bmax-age=[1-9]/.test(value), `${path} har cache-control: ${value || "ingen rubrik"}`);
  };
  await expectCached("/sitemap.xml");
  await expectCached("/kalender.ics");
  const slug = (await get("/evenemang")).body.match(/href="\/evenemang\/([^"/]+)"/)?.[1];
  if (!slug) return "inget evenemang att prova kalenderfilen på";
  await expectCached(`/evenemang/${slug}/kalender.ics`);
});

console.log(`Snabbkontroll av ${BASE}\n`);
console.log(results.join("\n"));
const failed = results.filter((r) => r.startsWith("✗")).length;
console.log(failed ? `\n${failed} kontroll(er) misslyckades.` : "\nAllt ser bra ut.");
process.exit(failed ? 1 : 0);
