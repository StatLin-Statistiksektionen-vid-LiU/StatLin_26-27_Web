// STAR-sidan och lunchföreläsningarna: företag i admin syns på /star, tomt läge, önskemål som syns först efter godkännande,
// en röst per webbläsare, formulär utan JavaScript, och att obehöriga stoppas på servern.
import assert from "node:assert";
import { changeTemporaryPassword, newVisitor, openLogin, tryLogin, uniqueId, waitForHydration } from "../e2e-hjalp.mjs";

const ADMIN = "admin@statlin.se";
const EDITOR = "info@statlin.se";
const OTHER_COMMITTEE = "scb@statlin.se";

/** En besökare utan JavaScript, på en egen IP-adress. */
let noJsIp = 0;
const ipBase = `10.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
async function visitorWithoutJs(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    javaScriptEnabled: false,
    extraHTTPHeaders: { "x-forwarded-for": `${ipBase}.${++noJsIp}` },
  });
  return { context, page: await context.newPage() };
}

/** Skapar ett utskottskonto för SASU och loggar in det i en egen webbläsarkontext. Sidan ska vara inloggad som administratör. */
async function sasuAccount(page, browser, BASE) {
  const email = `e2e-sasu-${uniqueId()}@statlin.se`;
  await page.goto(`${BASE}/admin/konton`);
  await waitForHydration(page, page.getByRole("button", { name: "Skapa konto" }));
  await page.fill('input[name="name"]', "E2E Sasusson");
  await page.fill('input[name="email"]', email);
  await page.locator('label:has(input[name="role"][value="committee"])').click();
  const sasu = await page.locator('select[name="committee_id"] option', { hasText: /^SASU/ }).getAttribute("value");
  await page.locator('select[name="committee_id"]').selectOption(sasu);
  await page.getByRole("button", { name: "Skapa konto" }).click();
  await page.getByText(`Kontot för ${email} är skapat`).waitFor();
  const temporary = await page.locator("code").first().textContent();
  const visitor = await newVisitor(browser);
  await openLogin(visitor.page, BASE);
  assert.equal(await tryLogin(visitor.page, email, temporary), null, "SASU-kontot ska kunna logga in");
  await changeTemporaryPassword(visitor.page, temporary);
  return visitor;
}

export default async function naringslivSteg({ BASE, browser, page, step, switchAccount, openDeleteConfirm }) {
  const id = uniqueId();
  const company = `Teststjärnan ${id}`;
  const other = `Ljusstjärnan ${id}`;
  const wish = `Önskemål om kausalitet ${id}`;
  const blocked = `Spärrat önskemål ${id}`;

  // Varje besökare har en egen IP, så att spärrarna inte delas mellan stegen.
  const visit = () => newVisitor(browser);
  let sasu;

  /** Lägger till ett företag från formuläret på /admin/star. */
  const addCompany = async (name, seek, role = "utstallare") => {
    await page.goto(`${BASE}/admin/star`);
    await waitForHydration(page, page.getByRole("button", { name: "Lägg till företag" }));
    await page.locator('input[name="name"]').fill(name);
    await page.locator('input[name="url"]').fill("https://example.com/teststjarnan");
    await page.locator('input[name="description"]').fill("Ett påhittat testföretag.");
    await page.locator(`input[name="seeks"][value="${seek}"]`).check();
    await page.locator('select[name="role"]').selectOption(role);
    await page.getByRole("button", { name: "Lägg till företag" }).click();
    await page.getByText("Företaget är tillagt.").waitFor();
  };

  await step("STAR-sidan är begriplig utan företag: tomt läge, datum från evenemanget och inget externt", async () => {
    const { page: p, context } = await visit();
    const external = [];
    p.on("request", (r) => {
      if (!r.url().startsWith(BASE) && !r.url().startsWith("data:")) external.push(r.url());
    });
    await p.goto(`${BASE}/star`);
    await p.getByRole("heading", { name: "STAR", exact: true }).waitFor();
    await p.getByRole("heading", { name: "Vilka kommer" }).waitFor();
    if ((await p.locator(".star-card").count()) === 0) await p.getByText("Företagen presenteras snart").waitFor();
    await p.getByText(/^(Om \d+ dagar|om \d+ dagar|i morgon|i dag|Pågår nu)$/i).first().waitFor();
    await p.getByRole("heading", { name: "Dagen" }).waitFor();
    await p.getByText("Mässan öppnar").waitFor();
    const mail = await p.getByRole("link", { name: "sasu@statlin.se" }).getAttribute("href");
    assert.match(mail, /^mailto:sasu@statlin\.se\?subject=/);
    assert.equal(external.length, 0, `externa anrop: ${external.join(", ")}`);
    await context.close();
  });

  await step("Ett företag som läggs till i admin syns på /star med kort, stjärna och filter, och försvinner när det döljs", async () => {
    await switchAccount(page, ADMIN);
    await addCompany(company, "trainee", "huvudsponsor");
    await addCompany(other, "exjobb");

    const { page: p, context } = await visit();
    await p.goto(`${BASE}/star`);
    const card = p.locator(".star-card", { hasText: company });
    const otherCard = p.locator(".star-card", { hasText: other });
    await card.waitFor();
    await otherCard.waitFor();
    assert.equal(await card.locator(".chip").count(), 1);
    await card.getByText("Trainee").waitFor();
    assert.equal(await p.getByText("Företagen presenteras snart").count(), 0, "det tomma läget ska vara borta");
    // Huvudsponsorn står under Sponsorer.
    await p.getByRole("heading", { name: "Sponsorer" }).waitFor();
    // Filtret är ren CSS: ett val döljer de företag som inte söker det.
    await p.locator('label:has(input[value="trainee"])').click();
    await otherCard.waitFor({ state: "hidden" });
    assert.equal(await card.isVisible(), true);
    await p.locator('label:has(input[value="alla"])').click();
    await otherCard.waitFor();
    // Stjärnan leder till kortet.
    await p.locator(`svg:visible a[aria-label="${company}, till kortet"]`).click();
    await p.waitForURL(/#foretag-\d+$/);
    await context.close();

    await page.getByRole("link", { name: company }).first().click();
    await waitForHydration(page, page.getByRole("button", { name: "Spara" }));
    await page.locator('label:has(input[name="active"])').click();
    await page.getByRole("button", { name: "Spara" }).click();
    await page.getByText("Företaget är sparat.").waitFor();

    const hidden = await visit();
    await hidden.page.goto(`${BASE}/star`);
    await hidden.page.locator(".star-card", { hasText: other }).waitFor();
    assert.equal(await hidden.page.getByText(company).count(), 0, "dolt företag ska inte synas");
    await hidden.context.close();
  });

  await step("Företaget går att ta bort", async () => {
    await switchAccount(page, ADMIN);
    await page.goto(`${BASE}/admin/star`);
    await page.getByRole("link", { name: company }).first().click();
    await page.getByRole("button", { name: "Spara" }).waitFor();
    await openDeleteConfirm(page);
    await page.getByRole("alertdialog").getByRole("button", { name: /Ta bort/ }).click();
    await page.waitForURL(/\/admin\/star(\?|$)/);
    await page.getByRole("heading", { name: "STAR" }).waitFor();
    assert.equal(await page.getByRole("link", { name: company }).count(), 0);
  });

  await step("Ett önskemål syns först efter godkännande, och menyn visar antalet nya", async () => {
    const { page: p, context } = await visit();
    await p.goto(`${BASE}/lunchforelasningar`);
    await waitForHydration(p, p.getByRole("button", { name: "Skicka önskemålet" }));
    await p.getByText("SASU läser först").waitFor();
    await p.getByLabel("Ämne, företag eller person").fill(wish);
    await p.getByLabel(/Kommentar/).fill("Påhittad kommentar.");
    await p.getByRole("button", { name: "Skicka önskemålet" }).click();
    await p.getByText("Tack! SASU läser ditt önskemål").waitFor();
    await p.reload();
    await p.getByRole("heading", { name: "Önskelistan" }).waitFor();
    assert.equal(await p.getByText(wish).count(), 0, "önskemålet ska inte synas före godkännande");

    await switchAccount(page, ADMIN);
    sasu = await sasuAccount(page, browser, BASE);
    await sasu.page.goto(`${BASE}/admin/lunchonskemal?flik=nya`);
    const row = sasu.page.locator("ul > li", { hasText: wish });
    await row.waitFor();
    const badge = sasu.page.locator('nav[aria-label="Adminmeny"]:visible a[href="/admin/lunchonskemal"]');
    assert.match(await badge.innerText(), /\d/, "menyn ska visa antalet nya");
    await row.getByRole("button", { name: "Godkänn" }).click();
    await sasu.page.getByText("Önskemålet är nu: önskad.").waitFor();

    await p.reload();
    await p.getByText(wish).waitFor();
    await context.close();
  });

  await step("Honungsfällan och för långa önskemål ger ingen rad", async () => {
    const { page: p, context } = await visit();
    await p.goto(`${BASE}/lunchforelasningar`);
    await waitForHydration(p, p.getByRole("button", { name: "Skicka önskemålet" }));
    await p.getByLabel("Ämne, företag eller person").fill(blocked);
    await p.locator('input[name="webbplats"]').evaluate((el) => {
      el.value = "https://spam.example";
    });
    await p.getByRole("button", { name: "Skicka önskemålet" }).click();
    await p.getByText("Tack! SASU läser ditt önskemål").waitFor();
    await context.close();
    await switchAccount(page, ADMIN);
    await page.goto(`${BASE}/admin/lunchonskemal?flik=nya`);
    await page.getByRole("heading", { name: "Lunchönskemål" }).waitFor();
    assert.equal(await page.getByText(blocked).count(), 0, "boten ska inte ha lagt en rad");
  });

  await step("En stjärna räknas en gång per webbläsare och finns kvar efter omladdning", async () => {
    const { page: p, context } = await visit();
    await p.goto(`${BASE}/lunchforelasningar`);
    const row = p.locator("#onskelistan li", { hasText: wish });
    const button = row.getByRole("button", { name: /Ge en stjärna/ });
    await waitForHydration(p, button);
    const count = async () => Number((await row.locator("span[aria-live]").innerText()).match(/\d+/)[0]);
    const before = await count();
    await button.click();
    await row.getByRole("button", { name: /Du har gett en stjärna/ }).waitFor();
    assert.equal(await count(), before + 1);
    await p.waitForFunction(() => (localStorage.getItem("statlin:stjarnor") ?? "").length > 2);
    await p.reload();
    const again = p.locator("#onskelistan li", { hasText: wish });
    await again.getByRole("button", { name: /Du har gett en stjärna/ }).waitFor();
    assert.equal(Number((await again.locator("span[aria-live]").innerText()).match(/\d+/)[0]), before + 1, "omladdningen ska visa den sparade rösten");
    assert.equal(await again.getByRole("button").isDisabled(), true);
    await context.close();
  });

  await step("Önskelistan fungerar utan JavaScript: önska och ge en stjärna", async () => {
    const { page: p, context } = await visitorWithoutJs(browser);
    await p.goto(`${BASE}/lunchforelasningar`);
    const row = p.locator("#onskelistan li", { hasText: wish });
    const before = Number((await row.locator("span[aria-live]").innerText()).match(/\d+/)[0]);
    await row.getByRole("button", { name: /Ge en stjärna/ }).click();
    await p.waitForURL(/stjarna=\d+/);
    const after = p.locator("#onskelistan li", { hasText: wish });
    assert.equal(Number((await after.locator("span[aria-live]").innerText()).match(/\d+/)[0]), before + 1);
    await after.getByRole("button", { name: /Du har gett en stjärna/ }).waitFor();
    await p.getByLabel("Ämne, företag eller person").fill(`Utan JavaScript ${id}`);
    await p.getByRole("button", { name: "Skicka önskemålet" }).click();
    await p.waitForURL(/tack=1/);
    await p.getByText("Tack! SASU läser ditt önskemål").waitFor();
    await context.close();
  });

  await step("Spärren stoppar en som ger stjärnor på samma önskemål om och om igen", async () => {
    const { page: p, context } = await visitorWithoutJs(browser);
    let limited = false;
    for (let i = 0; i < 20 && !limited; i++) {
      await p.goto(`${BASE}/lunchforelasningar`);
      await p.locator("#onskelistan li", { hasText: wish }).getByRole("button", { name: /Ge en stjärna/ }).click();
      await p.waitForLoadState("load");
      limited = p.url().includes("sparrad=1");
    }
    assert.equal(limited, true, "spärren borde ha slagit till inom 20 försök");
    await p.getByText("Det gick lite för fort").waitFor();
    await context.close();
  });

  await step("Status, koppling till evenemang och dölj syns på sajten", async () => {
    await switchAccount(page, ADMIN);
    await page.goto(`${BASE}/admin/lunchonskemal?flik=listan`);
    const row = page.locator("ul > li", { hasText: wish });
    await row.getByText("Ändra text, status och evenemang").click();
    await row.locator('select[name="status"]').selectOption("bokad");
    const lunchOption = row.locator('select[name="event_id"] optgroup[label="Lunchföreläsningar"] option').first();
    const value = await lunchOption.getAttribute("value");
    await row.locator('select[name="event_id"]').selectOption(value);
    await row.getByRole("button", { name: "Spara" }).click();
    await row.getByText("Önskemålet är sparat.").waitFor();

    const { page: p, context } = await visit();
    await p.goto(`${BASE}/lunchforelasningar`);
    const shown = p.locator("#onskelistan li", { hasText: wish });
    await shown.getByText("Bokad").waitFor();
    await shown.getByRole("link", { name: "Till föreläsningen" }).waitFor();
    assert.equal(await shown.getByRole("button").count(), 0, "en bokad föreläsning tar inte emot stjärnor");
    await context.close();

    await page.goto(`${BASE}/admin/lunchonskemal?flik=listan`);
    await page.locator("ul > li", { hasText: wish }).getByRole("button", { name: "Dölj" }).click();
    await page.getByText("Önskemålet är nu: dold.").waitFor();
    const gone = await visit();
    await gone.page.goto(`${BASE}/lunchforelasningar`);
    await gone.page.getByRole("heading", { name: "Önskelistan" }).waitFor();
    assert.equal(await gone.page.getByText(wish).count(), 0, "dolt önskemål ska inte synas");
    await gone.context.close();
  });

  await step("Obehöriga stoppas på servern: utloggad och annat utskott", async () => {
    // Utloggad: sidan skickar till inloggningen.
    const anon = await visit();
    await anon.page.goto(`${BASE}/admin/star`);
    await anon.page.waitForURL(/\/logga-in/);
    await anon.page.goto(`${BASE}/admin/lunchonskemal`);
    await anon.page.waitForURL(/\/logga-in/);
    await anon.context.close();

    // Ett annat utskott: sidorna nekas och menyn saknar raderna.
    await switchAccount(page, OTHER_COMMITTEE);
    await page.goto(`${BASE}/admin/star`);
    await page.waitForURL(/\/admin\?nekad=1/);
    await page.goto(`${BASE}/admin/lunchonskemal`);
    await page.waitForURL(/\/admin\?nekad=1/);
    assert.equal(await page.locator('a[href="/admin/star"]').count(), 0, "menyraden ska saknas");
    const otherCookies = await page.context().cookies();

    // Actionen själv: formuläret är öppet hos SASU, men skickas med det andra utskottets kaka. Servern ska säga nej.
    const denied = `Nekat företag ${id}`;
    await sasu.page.goto(`${BASE}/admin/star`);
    await waitForHydration(sasu.page, sasu.page.getByRole("button", { name: "Lägg till företag" }));
    await sasu.page.locator('input[name="name"]').fill(denied);
    const sasuCookies = await sasu.context.cookies();
    await sasu.context.clearCookies();
    await sasu.context.addCookies(otherCookies);
    await sasu.page.getByRole("button", { name: "Lägg till företag" }).click();
    await sasu.page.getByText("Du har inte behörighet att göra det här.").waitFor();
    await sasu.context.clearCookies();
    await sasu.context.addCookies(sasuCookies);

    await switchAccount(page, ADMIN);
    await page.goto(`${BASE}/admin/star`);
    await page.getByRole("heading", { name: "STAR" }).waitFor();
    assert.equal(await page.getByText(denied).count(), 0, "det nekade företaget ska inte finnas");
  });

  await step("SASU och redaktörer kommer åt båda sidorna, och menyn har raderna", async () => {
    await sasu.page.goto(`${BASE}/admin/star`);
    await sasu.page.getByRole("button", { name: "Lägg till företag" }).waitFor();
    assert.ok(await sasu.page.locator('nav[aria-label="Adminmeny"]:visible a[href="/admin/star"]').count(), "SASU: menyraden");
    await sasu.context.close();
    await switchAccount(page, EDITOR);
    await page.goto(`${BASE}/admin/star`);
    await page.getByRole("button", { name: "Lägg till företag" }).waitFor();
    await page.goto(`${BASE}/admin/lunchonskemal`);
    await page.getByRole("heading", { name: "Lunchönskemål" }).waitFor();
    assert.ok(await page.locator('nav[aria-label="Adminmeny"]:visible a[href="/admin/lunchonskemal"]').count(), "redaktör: menyraden");
    await switchAccount(page, ADMIN);
  });

  await step("Länkarna hit: startsidan, /foretag, STAR-evenemanget, lunchevenemanget och sitemapen", async () => {
    const { page: p, context } = await visit();
    await p.goto(`${BASE}/`);
    assert.ok(await p.locator('a[href="/star"]').count(), "startsidan");
    await p.goto(`${BASE}/foretag`);
    await p.getByRole("link", { name: "Till STAR-sidan" }).waitFor();
    await p.getByRole("link", { name: "Till önskelistan" }).waitFor();
    await p.goto(`${BASE}/evenemang/star`);
    await p.getByText("Se vilka företag som kommer").waitFor();
    await p.goto(`${BASE}/evenemang/lunchforelasning-data-science`);
    await p.getByText("Vad vill du höra nästa gång?").waitFor();
    const sitemap = await (await p.request.get(`${BASE}/sitemap.xml`)).text();
    assert.ok(sitemap.includes("/star<"), "sitemap: /star");
    assert.ok(sitemap.includes("/lunchforelasningar<"), "sitemap: /lunchforelasningar");
    await context.close();
  });
}
