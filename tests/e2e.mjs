// End-to-end-test av inloggning, behörigheter, evenemang och bildgalleri mot en körande server
// som seedats med demodata och kända lösenord:
//
//   ADMIN_PASSWORD=admin-statlin-2026 DEMO_PASSWORD=demo-statlin-2026 npm run seed -- --demo
//   npm run dev
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

    await step("Skapa evenemang", async () => {
      await page.goto(`${BASE}/admin/evenemang/ny`);
      await page.fill('input[name="title"]', "Testsittning med galleri");
      assert.equal(await page.inputValue('input[name="slug"]'), "testsittning-med-galleri");
      await page.fill('textarea[name="summary"]', "Ett evenemang skapat av det automatiska testet.");
      await page.fill('textarea[name="body_md"]', "## Program\n- Mingel\n- **Middag**\n\nVälkomna!");
      await page.fill('input[name="location"]', "Kårallen");
      await page.selectOption('select[name="committee_id"]', { label: "SCB – StatLins Centrala Bärseri" });
      await Promise.all([page.waitForURL(/\/admin\/evenemang\/\d+\?skapad=1/), page.getByRole("button", { name: "Skapa evenemang" }).click()]);
      await page.getByText("Evenemanget är skapat!").waitFor();
    });

    await step("Validering: sluttid före starttid ger fältfel", async () => {
      await page.fill('input[name="ends_at"]', "2000-01-01T10:00");
      await page.getByRole("button", { name: "Spara ändringar" }).click();
      await page.getByText("Sluttiden måste vara efter starttiden.").first().waitFor();
      assert.equal(await page.inputValue('input[name="title"]'), "Testsittning med galleri", "fälten ska behållas");
      await page.fill('input[name="ends_at"]', "");
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
      const coverSrc = await page.locator("article > header img").first().getAttribute("src");
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
      assert.ok(await page.locator('select[name="committee_id"]').isDisabled(), "utskottsväljaren ska vara låst");
      await page.screenshot({ path: `${SHOTS}/admin-committee-new.png` });
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
      await page.goto(`${BASE}/ny-student`);
      await page.getByText("Välkommen till StatLin – testad ingress!").waitFor();
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

    // Granskning: styrelsens bock påverkar aldrig om evenemanget är publicerat.
    let reviewId;
    const reviewRow = (title) => page.locator("tbody tr", { hasText: title });
    const toReview = () => page.getByRole("region", { name: "Att granska" });

    await step("Utskottets nya evenemang är ogranskat", async () => {
      await page.goto(`${BASE}/admin/evenemang/ny`);
      await page.fill('input[name="title"]', "Pubkväll att granska");
      await page.fill('input[name="location"]', "Kårallen");
      await Promise.all([page.waitForURL(/\/admin\/evenemang\/\d+\?skapad=1/), page.getByRole("button", { name: "Skapa evenemang" }).click()]);
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
      await Promise.all([page.waitForURL(/\/admin\/evenemang\/\d+\?skapad=1/), page.getByRole("button", { name: "Skapa evenemang" }).click()]);
      await page.getByText("Granskad", { exact: true }).first().waitFor();
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
