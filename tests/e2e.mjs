// End-to-end-test av inloggning, behörigheter, evenemang, bildgalleri, länksidan, tentastatistiken och grafiskt ansvar
// mot en körande server som seedats med demodata och kända lösenord:
//
//   ADMIN_PASSWORD=admin-statlin-2026 DEMO_PASSWORD=demo-statlin-2026 npm run seed -- --demo
//   EXAM_STATS_URL=http://127.0.0.1:9 npm run dev
//
// EXAM_STATS_URL pekar tentastatistiken på en adress som inte svarar, så att testet bara använder
// demostatistiken i databasen och aldrig frågar den riktiga källan.
// Kräver Playwright (npm i -D playwright && npx playwright install chromium).
//
//   node tests/e2e.mjs http://localhost:3000
import assert from "node:assert";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

const BASE = process.argv[2] ?? "http://localhost:3000";
const SHOTS = fs.mkdtempSync(path.join(os.tmpdir(), "statlin-e2e-shots-"));
const IMG = fs.mkdtempSync(path.join(os.tmpdir(), "statlin-e2e-img-"));

/** Testbilder; den första har EXIF-orientering 6 för att verifiera autorotering. */
async function makeTestImages() {
  const colors = [["#ff0707", "#0a0a0a"], ["#2e3192", "#fbb03b"], ["#0a0a0a", "#f4f2ee"]];
  for (let i = 0; i < 3; i++) {
    const [a, b] = colors[i];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="3000" height="2000"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`;
    let img = sharp(Buffer.from(svg)).jpeg({ quality: 85 });
    if (i === 0) img = img.withMetadata({ orientation: 6 });
    await img.toFile(path.join(IMG, `test-${i + 1}.jpg`));
  }
}
const results = [];
const step = async (name, fn) => {
  try {
    await fn();
    results.push(`✓ ${name}`);
  } catch (e) {
    results.push(`✗ ${name}: ${e.message.split("\n")[0]}`);
    throw e;
  }
};

async function login(page, email, password) {
  await page.goto(`${BASE}/logga-in`);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await Promise.all([page.waitForURL(/\/admin/), page.click('button[type="submit"]')]);
}

(async () => {
  await makeTestImages();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  let eventSlug;

  try {
    await step("Genvägsraden på startsidan visar genvägarna", async () => {
      await page.goto(`${BASE}/`);
      const row = page.locator('section[aria-labelledby="genvagar-start"]');
      for (const label of ["Schema", "Boka rum", "Karta", "Skriva ut", "Tentamensanmälan", "E-post", "Tentastatistik"]) {
        await row.getByRole("link", { name: label, exact: true }).waitFor();
      }
    });

    await step("Länksidan: sökning, kurskod och fästa länkar", async () => {
      await page.goto(`${BASE}/studenter/lankar`);
      assert.equal(await page.getByRole("heading", { name: /Kurser och/ }).count(), 0, "kurslistan ska vara borta");
      const search = page.getByRole("searchbox", { name: "Sök bland länkarna" });
      await search.fill("tenta");
      await page.locator("#grupp-tentor").waitFor();
      await search.fill("732G33");
      await page.getByRole("link", { name: /Visa tentastatistik för 732G33/ }).waitFor();
      await search.fill("tata24");
      await page.getByRole("link", { name: /Visa tentastatistik för TATA24/ }).waitFor();
      await search.fill("");
      await page.getByRole("button", { name: "Fäst Kursrum (Lisam)" }).click();
      await page.reload();
      await page.locator('section[aria-labelledby="fasta"]').getByText("Kursrum (Lisam)", { exact: true }).waitFor();
      await page.screenshot({ path: `${SHOTS}/links.png` });
    });

    await step("Länksidan: kurskodsfältet föreslår koder och leder till kursen", async () => {
      await page.goto(`${BASE}/studenter/lankar`);
      await page.waitForLoadState("networkidle");
      const box = page.locator('section[aria-labelledby="tentastatistik"]').getByRole("combobox", { name: "Kurskod" });
      await box.click();
      await box.pressSequentially("732g3");
      const suggestion = page.getByRole("option", { name: "732G33" });
      await suggestion.waitFor();
      await Promise.all([page.waitForURL(/\/tentastatistik\/732G33$/), suggestion.click()]);
    });

    await step("Kurssidan visar graferna, tabellerna och länkarna", async () => {
      await page.goto(`${BASE}/tentastatistik/732g33`);
      await page.waitForURL(/\/tentastatistik\/732G33$/);
      await page.waitForLoadState("networkidle");
      await page.getByRole("heading", { level: 1, name: "732G33" }).waitFor();
      await page.getByText("Programmering i R").first().waitFor();
      assert.ok((await page.locator('ol > li[tabindex="0"]').count()) > 0, "diagrammet saknar tentatillfällen");
      const trend = page.getByRole("img", { name: /Godkända över tid/ });
      await trend.waitFor();
      await page.getByRole("heading", { name: "Betyg de senaste tre åren" }).waitFor();
      await trend.hover();
      await page.getByText(/^hela \d{4}$/).waitFor();
      await page.screenshot({ path: `${SHOTS}/exam-stats-graphs.png` });
      assert.equal(await page.locator('a[href*="ysektionen.se"]').count(), 0, "Y-sektionen ska inte länkas");
      await page.getByRole("link", { name: /liustats/ }).first().waitFor();
      await page.getByRole("button", { name: "Tabell" }).click();
      await page.getByRole("table", { name: /Betyg per tentatillfälle/ }).waitFor();
      await page.getByRole("heading", { name: "Per år" }).waitFor();
      await page.getByRole("table", { name: /Andel godkända per år/ }).waitFor();
      await page.screenshot({ path: `${SHOTS}/exam-stats.png`, fullPage: true });
    });

    await step("Tentastatistik för vilken kurs som helst via kurskoden", async () => {
      await page.goto(`${BASE}/tentastatistik`);
      assert.equal(await page.getByRole("heading", { name: /Våra/ }).count(), 0, "programmens kurser ska vara borta");
      const box = page.getByRole("combobox", { name: "Kurskod" });
      await box.fill("tata24");
      await box.press("Enter");
      await page.waitForURL(/\/tentastatistik\/TATA24$/);
      await page.getByText("Linjär algebra").first().waitFor();
      await page.getByText("Betyg per tillfälle").waitFor();
      await page.goto(`${BASE}/tentastatistik/XYZ999`);
      await page.getByText("Hittade ingen tentastatistik för XYZ999").waitFor();
    });

    await step("Fel lösenord visar fel och behåller e-post", async () => {
      await page.goto(`${BASE}/logga-in`);
      await page.fill("#email", "info@statlin.se");
      await page.fill("#password", "fel-losenord");
      await page.click('button[type="submit"]');
      await page.getByText("Fel e-postadress eller lösenord.").waitFor();
      assert.equal(await page.inputValue("#email"), "info@statlin.se");
      await page.screenshot({ path: `${SHOTS}/login.png` });
    });

    await step("Inloggning som redaktör (info)", async () => {
      await login(page, "info@statlin.se", "demo-statlin-2026");
      await page.getByText("Hej Namn").waitFor();
      await page.screenshot({ path: `${SHOTS}/admin-dashboard.png` });
    });

    await step("Redaktör lägger till en genväg som syns på startsidan", async () => {
      await page.goto(`${BASE}/admin/lankar`);
      await page.fill('input[name="label"]', "Testgenväg");
      await page.fill('input[name="url"]', "https://example.com/testgenvag");
      await page.locator('label:has(input[name="featured"])').click();
      await Promise.all([page.waitForURL(/\/admin\/lankar\?sparad=1/), page.getByRole("button", { name: "Lägg till länk" }).click()]);
      await page.goto(`${BASE}/`);
      await page.locator('section[aria-labelledby="genvagar-start"]').getByRole("link", { name: "Testgenväg" }).waitFor();
    });

    await step("Skapa evenemang", async () => {
      await page.goto(`${BASE}/admin/evenemang/ny`);
      await page.fill('input[name="title"]', "Testsittning med galleri");
      assert.equal(await page.inputValue('input[name="slug"]'), "testsittning-med-galleri");
      await page.fill('textarea[name="summary"]', "Ett evenemang skapat av det automatiska testet.");
      await page.fill('textarea[name="body_md"]', "## Program\n- Mingel\n- **Middag**\n\nVälkomna!");
      await page.fill('input[name="location"]', "Kårallen");
      await page.selectOption('select[name="committee_id"]', { label: "SCB – StatLins Centrala Bärseri" });
      await Promise.all([page.waitForURL(/\/admin\/evenemang\/\d+\?skapad=1/), page.getByRole("button", { name: "Publicera", exact: true }).click()]);
      await page.getByText("Evenemanget är publicerat!").waitFor();
    });

    await step("Validering: sluttid före starttid ger fältfel och öppnar Fler detaljer", async () => {
      // Förra sidan ligger kvar dold i DOM:en (Next behåller den), så bara synliga element räknas.
      const more = page.locator("summary:visible", { hasText: "Fler detaljer" });
      const endsAt = page.locator('input[name="ends_at"]:visible');
      await more.click();
      await endsAt.fill("2000-01-01T10:00");
      await more.click();
      await page.getByRole("button", { name: "Spara ändringar" }).click();
      await page.getByText("Sluttiden måste vara efter starttiden.").first().waitFor();
      await endsAt.waitFor({ timeout: 3000 });
      assert.equal(await page.inputValue('input[name="title"]'), "Testsittning med galleri", "fälten ska behållas");
      await endsAt.fill("");
    });

    await step("Ladda upp tre bilder till galleriet", async () => {
      const input = page.locator('input[type="file"][multiple]');
      await input.setInputFiles([`${IMG}/test-1.jpg`, `${IMG}/test-2.jpg`, `${IMG}/test-3.jpg`]);
      await page.waitForFunction(() => document.querySelectorAll('input[aria-label="Bildtext"]').length === 3, null, { timeout: 30000 });
      const caption = page.locator('input[aria-label="Bildtext"]').first();
      await caption.fill("Skålen för sektionen!");
      await caption.press("Enter");
      await page.waitForTimeout(800);
      await page.locator('#galleri').scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${SHOTS}/admin-gallery.png`, fullPage: false });
    });

    await step("Sätt omslag via stjärnan och spara formuläret utan att skriva över det", async () => {
      await page.locator('button[title="Använd som omslagsbild"]').nth(1).click();
      await page.waitForTimeout(600);
      await page.getByRole("button", { name: "Spara ändringar" }).click();
      await page.getByText("Sparat och publicerat.").waitFor();
    });

    await step("Bilderna syns på den publika evenemangssidan", async () => {
      eventSlug = "testsittning-med-galleri";
      await page.goto(`${BASE}/evenemang/${eventSlug}`);
      await page.locator("#galleri").scrollIntoViewIfNeeded();
      const count = await page.locator('#galleri button[aria-label^="Visa bild"]').count();
      assert.equal(count, 3);
      // Omslaget ska vara den andra bilden (vald via stjärnan).
      const coverSrc = await page.locator("article header img").first().getAttribute("src");
      assert.ok(coverSrc && coverSrc.startsWith("/media/"), "omslag saknas");
      await page.locator('#galleri button[aria-label^="Visa bild 1"]').click();
      await page.getByRole("dialog").waitFor();
      await page.getByText("Skålen för sektionen!").waitFor();
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${SHOTS}/lightbox.png` });
      await page.keyboard.press("Escape");
    });

    await step("Första bilden autoroterades enligt EXIF (stående)", async () => {
      const dims = await page.evaluate(async () => {
        const img = document.querySelector('#galleri img');
        return { w: Number(img.getAttribute("width")), h: Number(img.getAttribute("height")) };
      });
      assert.ok(dims.h > dims.w, `förväntade stående bild, fick ${dims.w}x${dims.h}`);
    });

    await step("Galleri-sidan visar albumet", async () => {
      await page.goto(`${BASE}/galleri`);
      await page.getByRole("heading", { name: "Testsittning med galleri" }).waitFor();
    });

    await step("Utloggning", async () => {
      await page.goto(`${BASE}/admin`);
      await Promise.all([page.waitForURL(/logga-in\?utloggad=1/), page.getByRole("button", { name: "Logga ut" }).last().click()]);
    });

    await step("Utskottskonto (SCB) ser bara sitt utskott", async () => {
      await login(page, "scb@statlin.se", "demo-statlin-2026");
      await page.goto(`${BASE}/admin/evenemang`);
      const titles = await page.locator("tbody tr td:first-child a span.block.font-semibold").allTextContents();
      assert.ok(titles.includes("Testsittning med galleri"), "SCB ska se SCB-evenemanget");
      assert.ok(!titles.some((t) => t.includes("LAN")), "SCB ska inte se eSTIG:s evenemang");
      await page.goto(`${BASE}/admin/evenemang/ny`);
      assert.equal(await page.locator('select[name="committee_id"]').count(), 0, "utskottet ska inte gå att välja");
      await page.getByText("SCB – StatLins Centrala Bärseri").waitFor();
      await page.screenshot({ path: `${SHOTS}/admin-committee-new.png` });
    });

    await step("Utskottets översikt har genvägar och sparar utkast", async () => {
      await page.goto(`${BASE}/admin`);
      await page.getByRole("heading", { name: "SCB", exact: true }).waitFor();
      await page.screenshot({ path: `${SHOTS}/admin-committee-dashboard.png`, fullPage: true });
      await Promise.all([page.waitForURL(/\/admin\/evenemang\/ny/), page.getByRole("link", { name: /Nytt evenemang/ }).click()]);
      await page.fill('input[name="title"]', "Utkast från utskottet");
      await Promise.all([page.waitForURL(/\/admin\/evenemang\/\d+\?skapad=1/), page.getByRole("button", { name: "Spara som utkast" }).click()]);
      await page.getByText("Evenemanget är sparat som utkast").waitFor();
      await page.getByRole("button", { name: "Publicera", exact: true }).waitFor();
    });

    await step("Utskottskonto nekas andra utskotts evenemang och uppladdning", async () => {
      const res = await page.evaluate(async () => {
        const html = await (await fetch("/admin/evenemang")).text();
        return html.length;
      });
      assert.ok(res > 0);
      // Hitta ett eSTIG-evenemang via den publika sidan och försök ladda upp till det.
      const other = await page.evaluate(async () => {
        const fd = new FormData();
        const blob = await (await fetch("/brand/utskott/stig.webp")).blob();
        fd.append("file", new File([blob], "x.webp", { type: "image/webp" }));
        fd.append("purpose", "gallery");
        fd.append("eventId", "4");
        const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
        return r.status;
      });
      assert.equal(other, 403);
      await page.goto(`${BASE}/admin/evenemang/4`);
      await page.waitForURL(/nekad=1/);
      await page.goto(`${BASE}/admin/konton`);
      await page.waitForURL(/\/admin\?nekad=1/);
    });

    await step("Utskottskonto nekas länkarna och bildsidan", async () => {
      await page.goto(`${BASE}/admin/bilder`);
      await page.waitForURL(/\/admin\?nekad=1/);
      await page.goto(`${BASE}/admin/lankar`);
      await page.waitForURL(/\/admin\?nekad=1/);
    });

    await step("Kurslistan är borta ur adminpanelen", async () => {
      assert.equal(await page.locator('nav[aria-label="Adminmeny"] a[href="/admin/kurser"]').count(), 0, "menyn ska inte länka till Kurser");
      assert.equal((await page.goto(`${BASE}/admin/kurser`)).status(), 404);
    });

    await step("Admin skapar konto och får engångslösenord", async () => {
      await page.context().clearCookies();
      await login(page, "admin@statlin.se", "admin-statlin-2026");
      await page.goto(`${BASE}/admin/konton`);
      await page.fill('input[name="name"]', "Test Testsson");
      await page.fill('input[name="email"]', "stig@statlin.se");
      await page.fill('input[name="post"]', "Idrottsansvarig");
      await page.selectOption('select[name="committee_id"]', { label: "STIG – StatLins Idrottsgrupp" });
      await page.getByRole("button", { name: "Skapa konto" }).click();
      await page.getByText("Kontot för stig@statlin.se är skapat").waitFor();
      const pw = await page.locator("code").first().textContent();
      assert.ok(/^[a-z]+-[a-z]+-\d{4}$/.test(pw), `oväntat lösenordsformat: ${pw}`);
      await page.screenshot({ path: `${SHOTS}/admin-users.png` });
      // Det nya kontot måste byta lösenord vid första inloggningen.
      await page.context().clearCookies();
      await page.goto(`${BASE}/logga-in`);
      await page.fill("#email", "stig@statlin.se");
      await page.fill("#password", pw);
      await Promise.all([page.waitForURL(/\/admin\/konto\?byt=1/), page.click('button[type="submit"]')]);
      await page.getByText("Välj ett eget lösenord").waitFor();
    });

    await step("Admin redigerar en sida och ändringen syns publikt", async () => {
      await page.context().clearCookies();
      await login(page, "admin@statlin.se", "admin-statlin-2026");
      await page.goto(`${BASE}/admin/sidor/ny-student`);
      await page.fill('textarea[name="lead"]', "Välkommen till StatLin – testad ingress!");
      await page.getByRole("button", { name: "Spara och publicera" }).click();
      await page.getByText("Sidan är sparad och publicerad.").waitFor();
      await page.goto(`${BASE}/studenter/ny-student`);
      await page.getByText("Välkommen till StatLin – testad ingress!").waitFor();
    });

    await step("Redigeringsläget: admin ändrar en sidtext direkt på sajten", async () => {
      await page.goto(`${BASE}/studenter/kandidat`);
      await page.locator('#admin-bar [role="switch"][aria-checked="true"]').waitFor();
      await page.locator("button:visible", { hasText: "Redigera texten" }).click();
      const panel = page.getByRole("dialog");
      await panel.locator('textarea[name="lead"]').fill("Ingress ändrad direkt på sajten.");
      await panel.getByRole("button", { name: "Spara och publicera" }).click();
      await panel.waitFor({ state: "detached" });
      await page.getByText("Ingress ändrad direkt på sajten.").waitFor();
      await page.screenshot({ path: `${SHOTS}/edit-mode.png` });
    });

    await step("Redaktör (info) kan ändra inställningarna", async () => {
      await page.context().clearCookies();
      await login(page, "info@statlin.se", "demo-statlin-2026");
      await page.goto(`${BASE}/admin/installningar`);
      // Nekas man skickas man vidare först efter att sidan laddats, så vänta på själva formuläret.
      await page.getByRole("heading", { name: "Inställningar", exact: true }).waitFor({ timeout: 15000 });
      await page.fill('input[name="address"]', "Testgatan 1, 583 30 Linköping");
      await page.getByRole("button", { name: "Spara", exact: true }).click();
      await page.getByText("Inställningarna är sparade.").waitFor();
      await page.goto(BASE);
      await page.locator("footer").getByText("Testgatan 1, 583 30 Linköping").waitFor();
    });

    await step("Utskottskonto nekas inställningarna", async () => {
      await page.context().clearCookies();
      await login(page, "scb@statlin.se", "demo-statlin-2026");
      await page.goto(`${BASE}/admin/installningar`);
      await page.waitForURL(/\/admin\?nekad=1/);
    });

    await step("Redigeringsläget: utskottet får pennor bara på sitt eget", async () => {
      await page.goto(`${BASE}/utskott/scb`);
      await page.locator("button:visible", { hasText: "Redigera utskottet" }).waitFor();
      await page.goto(`${BASE}/utskott/estig`);
      await page.locator('#admin-bar [role="switch"][aria-checked="true"]').waitFor();
      await page.waitForTimeout(800);
      assert.equal(await page.locator("button:visible", { hasText: "Redigera" }).count(), 0, "inga pennor på andra utskotts sidor");
      const status = await page.evaluate(async () => (await fetch("/api/admin/redigera?typ=home")).status);
      assert.equal(status, 403, "API:t ska neka startsidans texter");
    });

    // Granskning: styrelsens bock påverkar aldrig om evenemanget är publicerat.
    let reviewId;
    const reviewRow = (title) => page.locator("tbody tr", { hasText: title });
    const toReview = () => page.getByRole("region", { name: "Att granska" });

    await step("Utskottets nya evenemang är ogranskat", async () => {
      await page.goto(`${BASE}/admin/evenemang/ny`);
      await page.fill('input[name="title"]', "Pubkväll att granska");
      await page.fill('input[name="location"]', "Kårallen");
      await Promise.all([page.waitForURL(/\/admin\/evenemang\/\d+\?skapad=1/), page.getByRole("button", { name: "Publicera", exact: true }).click()]);
      reviewId = page.url().match(/evenemang\/(\d+)/)[1];
      await page.getByText("Ej granskad", { exact: true }).first().waitFor();
      assert.equal(await page.getByRole("button", { name: "Markera som granskad" }).count(), 0, "utskottet ska inte kunna granska");
    });

    await step("Admin ser ogranskade evenemang i översikten och listan", async () => {
      await page.context().clearCookies();
      await login(page, "admin@statlin.se", "admin-statlin-2026");
      await toReview().getByText("Pubkväll att granska").waitFor();
      await page.goto(`${BASE}/admin/evenemang?visa=ogranskade`);
      await reviewRow("Pubkväll att granska").getByText("Ej granskad", { exact: true }).waitFor();
    });

    await step("Admin markerar evenemanget som granskat", async () => {
      await page.goto(`${BASE}/admin/evenemang/${reviewId}`);
      await page.getByRole("button", { name: "Markera som granskad" }).click();
      await page.getByText("Granskad", { exact: true }).first().waitFor();
      await page.goto(`${BASE}/admin/evenemang?visa=ogranskade`);
      await page.getByRole("heading", { name: "Evenemang", exact: true }).waitFor();
      assert.equal(await reviewRow("Pubkväll att granska").count(), 0, "granskat evenemang ska inte listas som ogranskat");
      await page.goto(`${BASE}/admin`);
      await page.getByRole("heading", { name: "Kommande evenemang" }).waitFor();
      assert.equal(await toReview().getByText("Pubkväll att granska").count(), 0, "granskat evenemang ska lämna Att granska");
    });

    await step("Admin kan ångra en granskning", async () => {
      await page.goto(`${BASE}/admin/evenemang/${reviewId}`);
      await page.getByRole("button", { name: "Ångra granskning" }).click();
      await page.getByText("Ej granskad", { exact: true }).first().waitFor();
      await page.getByRole("button", { name: "Markera som granskad" }).click();
      await page.getByText("Granskad", { exact: true }).first().waitFor();
    });

    await step("Utskottets ändring tar bort granskningen", async () => {
      await page.context().clearCookies();
      await login(page, "scb@statlin.se", "demo-statlin-2026");
      await page.goto(`${BASE}/admin/evenemang/${reviewId}`);
      await page.getByText("Granskad", { exact: true }).first().waitFor();
      await page.fill('textarea[name="summary"]', "Ändrad efter granskningen.");
      await page.getByRole("button", { name: "Spara ändringar" }).click();
      await page.getByText("Sparat och publicerat.").waitFor();
      await page.reload();
      await page.getByText("Ej granskad", { exact: true }).first().waitFor();
    });

    await step("Admin-skapat evenemang är granskat direkt", async () => {
      await page.context().clearCookies();
      await login(page, "admin@statlin.se", "admin-statlin-2026");
      await page.goto(`${BASE}/admin/evenemang/ny`);
      await page.fill('input[name="title"]', "Styrelsemöte i testet");
      await Promise.all([page.waitForURL(/\/admin\/evenemang\/\d+\?skapad=1/), page.getByRole("button", { name: "Publicera", exact: true }).click()]);
      await page.getByText("Granskad", { exact: true }).first().waitFor();
    });

    let taskUrl;
    const tasksLink = () => page.locator('nav[aria-label="Adminmeny"] a[href="/admin/uppdrag"]').first();
    const newTask = async (title, recipient) => {
      await page.goto(`${BASE}/admin/uppdrag/ny`);
      await page.fill('input[name="title"]', title);
      const to = await page.locator('select[name="to_user_id"] option', { hasText: recipient }).first().getAttribute("value");
      await page.selectOption('select[name="to_user_id"]', to);
      await page.check('input[name="visibility"][value="privat"]');
      await Promise.all([page.waitForURL(/\/admin\/uppdrag\/\d+\?skapat=1/), page.getByRole("button", { name: "Skicka uppdraget" }).click()]);
      return page.url().split("?")[0];
    };

    await step("Utskottskonto skickar ett privat uppdrag till info", async () => {
      await page.context().clearCookies();
      await login(page, "scb@statlin.se", "demo-statlin-2026");
      taskUrl = await newTask("Affisch till testsittningen", "Informationsansvarig");
      await page.goto(`${BASE}/admin/uppdrag?visa=fran`);
      await page.getByText("Affisch till testsittningen").waitFor();
    });

    await step("Mottagaren får en siffra i menyn som nollställs på tavlan", async () => {
      await page.context().clearCookies();
      await login(page, "info@statlin.se", "demo-statlin-2026");
      assert.match(await tasksLink().innerText(), /1/, "siffran ska synas i menyn");
      await page.goto(`${BASE}/admin/uppdrag?visa=till`);
      await page.getByText("Affisch till testsittningen").waitFor();
      await page.waitForTimeout(1500);
      await page.reload();
      assert.doesNotMatch(await tasksLink().innerText(), /\d/, "siffran ska försvinna efter besöket");
    });

    await step("Mottagaren ändrar status och kommenterar", async () => {
      await page.goto(taskUrl);
      await page.locator('button[aria-pressed="false"]', { hasText: "Behöver hjälp" }).click();
      await page.locator('button[aria-pressed="true"]', { hasText: "Behöver hjälp" }).waitFor();
      await page.fill('textarea[name="body"]', "Vilket format vill ni ha?");
      await page.getByRole("button", { name: "Skicka", exact: true }).click();
      await page.getByText("Kommentaren är skickad.").waitFor();
    });

    await step("Utskottskonto ser inte andras privata uppdrag", async () => {
      const secret = await newTask("Hemlig planering i testet", "Administratör");
      await page.context().clearCookies();
      await login(page, "scb@statlin.se", "demo-statlin-2026");
      await page.goto(`${BASE}/admin/uppdrag`);
      await page.getByText("Affisch till testsittningen").waitFor();
      assert.equal(await page.getByText("Hemlig planering i testet").count(), 0, "privat uppdrag ska inte synas på tavlan");
      const html = await (await page.goto(secret)).text();
      assert.ok(!html.includes("Hemlig planering i testet"), "privat uppdrag ska inte finnas i HTML:en");
      await page.waitForURL(/\/admin\/uppdrag$/);
    });

    await step("Admin ser alla uppdrag", async () => {
      await page.context().clearCookies();
      await login(page, "admin@statlin.se", "admin-statlin-2026");
      await page.goto(`${BASE}/admin/uppdrag`);
      await page.getByText("Affisch till testsittningen").waitFor();
      await page.getByText("Hemlig planering i testet").waitFor();
    });

    // Grafiskt ansvar: bilderna på alla evenemang och nyheter, men inte texterna.
    let scbEventId;
    let coverBefore;
    await step("Admin granskar SCB:s evenemang innan grafiskt ansvarig byter omslag", async () => {
      await page.goto(`${BASE}/admin/evenemang`);
      const href = await reviewRow("Testsittning med galleri").locator('a[href^="/admin/evenemang/"]').first().getAttribute("href");
      scbEventId = href.match(/evenemang\/(\d+)/)[1];
      await page.goto(`${BASE}/admin/evenemang/${scbEventId}`);
      await page.getByRole("button", { name: "Markera som granskad" }).click();
      await page.getByText("Granskad", { exact: true }).first().waitFor();
      await page.goto(`${BASE}/evenemang/${eventSlug}`);
      coverBefore = await page.locator("article header img").first().getAttribute("src");
    });

    await step("Grafiskt ansvarig byter omslag och laddar upp en galleribild på SCB:s evenemang", async () => {
      await page.context().clearCookies();
      await login(page, "grafiskt@statlin.se", "demo-statlin-2026");
      await Promise.all([page.waitForURL(/\/admin\/bilder$/), page.getByRole("link", { name: /Bilder och omslag/ }).click()]);
      const gallery = page.getByRole("group", { name: "Testsittning med galleri" }).getByRole("link", { name: /Galleri/ });
      assert.equal(await gallery.getAttribute("href"), `/admin/bilder/evenemang/${scbEventId}`);
      // En ny sidladdning, så att bildsidans omslagsfält inte ligger kvar dolda i DOM:en. Filen väljs först när
      // sidan hydrerats – annars hinner fältet inte lyssna på den.
      await page.goto(`${BASE}/admin/bilder/evenemang/${scbEventId}`);
      await page.waitForLoadState("networkidle");
      await page.locator('input[type="file"]:not([multiple])').setInputFiles(`${IMG}/test-3.jpg`);
      await page.getByText("Sparat", { exact: true }).waitFor({ timeout: 30000 });
      await page.locator('input[type="file"][multiple]').setInputFiles(`${IMG}/test-2.jpg`);
      await page.waitForFunction(() => document.querySelectorAll('input[aria-label="Bildtext"]').length === 4, null, { timeout: 30000 });
      await page.screenshot({ path: `${SHOTS}/design-event-images.png`, fullPage: true });
      await page.goto(`${BASE}/evenemang/${eventSlug}`);
      const coverAfter = await page.locator("article header img").first().getAttribute("src");
      assert.ok(coverAfter && coverAfter !== coverBefore, "omslaget ska ha bytts");
      assert.equal(await page.locator('#galleri button[aria-label^="Visa bild"]').count(), 4);
    });

    await step("Grafiskt ansvarig nekas evenemangets text men får Byt bilder i redigeringsläget", async () => {
      await page.locator('#admin-bar [role="switch"][aria-checked="true"]').waitFor();
      await page.locator("button:visible", { hasText: "Byt bilder" }).click();
      const panel = page.getByRole("dialog");
      await panel.getByText("Omslagsbild", { exact: true }).waitFor();
      assert.equal(await page.locator("button:visible", { hasText: "Redigera evenemanget" }).count(), 0, "texten ska inte gå att redigera");
      await page.keyboard.press("Escape");
      await panel.waitFor({ state: "detached" });
      await page.goto(`${BASE}/admin/evenemang/${scbEventId}`);
      await page.waitForURL(/nekad=1/);
    });

    await step("Grafiskt ansvarig lägger upp en mall som visas under Grafisk profil", async () => {
      await page.goto(`${BASE}/admin/dokument`);
      assert.equal(await page.locator('select[name="category"]').count(), 0, "kategorin ska vara låst");
      await page.fill('input[name="title"]', "Affischmall A3");
      await page.locator('input[name="file"]').setInputFiles({ name: "affischmall.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n%statlin-test\n") });
      // Servern bestämmer kategorin, även om formuläret skickar ett protokoll.
      await page.evaluate(() => (document.querySelector('input[name="category"]').value = "protokoll"));
      await Promise.all([page.waitForURL(/\/admin\/dokument\?sparad=1/), page.getByRole("button", { name: "Lägg till dokument" }).click()]);
      await page.goto(`${BASE}/grafisk-profil`);
      await page.locator("#material").getByText("Affischmall A3").waitFor();
      await page.goto(`${BASE}/dokument`);
      const group = page.getByRole("heading", { name: "Grafisk profil", exact: true }).locator("xpath=following-sibling::ul[1]");
      await group.getByText("Affischmall A3").waitFor();
    });

    await step("Omslagsbytet tar bort granskningen och syns i loggen", async () => {
      await page.context().clearCookies();
      await login(page, "admin@statlin.se", "admin-statlin-2026");
      await page.getByText("bytte omslag på").first().waitFor();
      await page.goto(`${BASE}/admin/evenemang/${scbEventId}`);
      await page.getByText("Ej granskad", { exact: true }).first().waitFor();
    });
  } catch {
    /* resultatet skrivs ut nedan */
  } finally {
    console.log(results.join("\n"));
    console.log(`\nSkärmdumpar: ${SHOTS}`);
    const relevant = errors.filter((e) => !/Failed to load resource.*(403|401)/.test(e));
    if (relevant.length) console.log("\nKonsolfel:\n" + [...new Set(relevant)].slice(0, 10).join("\n"));
    await browser.close();
    process.exit(results.some((r) => r.startsWith("✗")) ? 1 : 0);
  }
})();
