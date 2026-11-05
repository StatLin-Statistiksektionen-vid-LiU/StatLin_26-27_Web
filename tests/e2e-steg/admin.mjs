// Adminpanelens formulär, redigeringspanelen, galleriet och vägen tillbaka efter inloggningen.
import assert from "node:assert";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { newVisitor, uniqueId, waitForHydration } from "../e2e-hjalp.mjs";

const ADMIN = "admin@statlin.se";

let images;
/** Bilder till uppladdningarna, med olika färg så att de går isär. Skapas första gången de behövs. */
async function testImages(count) {
  if (!images) {
    const dir = await mkdtemp(path.join(tmpdir(), "statlin-admin-"));
    images = [];
    for (const [i, color] of ["#ff0707", "#2e3192", "#fbb03b", "#0a0a0a"].entries()) {
      const file = path.join(dir, `bild-${i + 1}.jpg`);
      await sharp({ create: { width: 800, height: 600, channels: 3, background: color } }).jpeg().toFile(file);
      images.push(file);
    }
  }
  return images.slice(0, count);
}

/** Skapar ett publicerat evenemang långt fram. Svarar med adressen till formuläret och sluggen. */
async function createEvent(page, BASE, title) {
  await page.goto(`${BASE}/admin/evenemang/ny`);
  await waitForHydration(page, page.locator('input[name="title"]'));
  await page.fill('input[name="title"]', title);
  await page.fill('input[name="starts_at"]', "2031-03-10T18:00");
  await page.fill('textarea[name="summary"]', "Skapat av det automatiska testet.");
  await Promise.all([page.waitForURL(/\/admin\/evenemang\/\d+\?skapad=1/), page.getByRole("button", { name: "Publicera", exact: true }).click()]);
  return { url: page.url().split("?")[0], slug: await page.inputValue('input[name="slug"]') };
}

/** Fyller i kontoformuläret för ett nytt konto. Svarar med adressen. */
async function submitNewUser(page, name) {
  const email = `e2e-${uniqueId()}@statlin.se`;
  await page.fill('input[name="name"]', name);
  await page.fill('input[name="email"]', email);
  return email;
}

export default async function adminSteg({ BASE, browser, page, step, switchAccount }) {
  await step("Nästa konto får rollen som visas efter att ett konto skapats (SB-31)", async () => {
    await switchAccount(page, ADMIN);
    await page.goto(`${BASE}/admin/konton`);
    await waitForHydration(page, page.getByRole("button", { name: "Skapa konto" }));
    const first = await submitNewUser(page, "Roll Första");
    await page.locator('label:has(input[name="role"][value="editor"])').click();
    await page.getByRole("button", { name: "Skapa konto" }).click();
    await page.getByText(`Kontot för ${first} är skapat`).waitFor();

    // Efter sparningen visas grundvalet, och det är också det som är ikryssat.
    const checked = page.locator('input[name="role"]:checked');
    await page.waitForFunction(() => document.querySelector('input[name="role"]:checked')?.closest("label").className.includes("bg-ink"));
    assert.equal(await checked.getAttribute("value"), "committee", "Formuläret ska ha gått tillbaka till grundvalet");
    assert.equal(await page.locator('label:has(input[name="role"]):has-text("Redaktör")').evaluate((el) => el.className.includes("bg-ink")), false, "Redaktör ska inte se vald ut");

    // Nästa konto, med rollen orörd: det som visas är det som sparas.
    const second = await submitNewUser(page, "Roll Andra");
    await page.getByRole("button", { name: "Skapa konto" }).click();
    await page.getByText("Ett utskottskonto måste kopplas till ett utskott.").waitFor();
    await page.locator('label:has(input[name="role"][value="admin"])').click();
    await page.getByRole("button", { name: "Skapa konto" }).click();
    await page.getByText(`Kontot för ${second} är skapat`).waitFor();
    await page.reload();
    await page.getByText(second).first().waitFor();
    const row = page.locator("tr, li", { hasText: second }).first();
    await row.getByText("Administratör").first().waitFor();
    await page.locator("tr, li", { hasText: first }).first().getByText("Redaktör").waitFor();
  });

  await step("Redigeringspanelen ligger kvar när en sparning ritar om sidan (SB-30)", async () => {
    const { slug } = await createEvent(page, BASE, `E2E-panel ${uniqueId()}`);
    await page.goto(`${BASE}/evenemang/${slug}`);
    const toggle = page.locator('#admin-bar [role="switch"]');
    await waitForHydration(page, toggle);
    if ((await toggle.getAttribute("aria-checked")) !== "true") await toggle.click();
    await page.locator("button:visible", { hasText: "Byt bilder" }).click();
    const panel = page.getByRole("dialog");
    await panel.locator('input[type="file"][multiple]').setInputFiles(await testImages(1));
    const caption = panel.getByLabel("Bildtext");
    await caption.waitFor();
    await caption.fill("Bildtext från panelen");
    await caption.press("Enter");
    await panel.locator(".text-emerald-600").waitFor();
    // Sparningen ritar om sidan i bakgrunden. Ge omritningen tid: panelen ska stå kvar efteråt.
    await page.waitForTimeout(1500);
    assert.equal(await panel.isVisible(), true, "Panelen ska ligga kvar");
    await page.keyboard.press("Escape");
    await panel.waitFor({ state: "detached" });
  });

  await step("Ett utkast som publiceras får dagens datum, och en sparning ändrar det inte (SB-33)", async () => {
    const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date());
    const open = async (url) => {
      await page.goto(url);
      await waitForHydration(page, page.locator('input[name="title"]'));
      const details = page.locator('details:has(input[name="published_at"])');
      if (!(await details.evaluate((d) => d.open))) await details.locator("summary").click();
    };
    const field = page.locator('input[name="published_at"]');
    const save = async (label) => {
      const saved = page.waitForResponse((r) => r.request().method() === "POST");
      await page.getByRole("button", { name: label, exact: true }).click();
      await saved;
      await page.getByText(/Sparat/).first().waitFor();
    };
    await open(`${BASE}/admin/nyheter/ny`);
    await page.fill('input[name="title"]', `E2E-datum ${uniqueId()}`);
    await page.fill('textarea[name="excerpt"]', "Skapad av det automatiska testet.");
    await field.fill("2020-01-01T12:00");
    await Promise.all([page.waitForURL((u) => u.search === "?skapad=1"), page.getByRole("button", { name: "Spara som utkast", exact: true }).click()]);
    const url = page.url().split("?")[0];

    await open(url);
    assert.equal(await field.inputValue(), "", "Ett utkast visar inget gammalt datum");
    await save("Publicera");
    await open(url);
    const published = await field.inputValue();
    assert.ok(published.startsWith(today), `Publiceringen ska ge dagens datum: ${published}`);

    // Att spara igen ändrar inget, inte ens utan omladdning.
    await page.fill('textarea[name="excerpt"]', "Ändrad ingress.");
    await save("Spara ändringar");
    await open(url);
    assert.equal(await field.inputValue(), published);

    // Ett valt datum gäller, och ett framtida ligger kvar när utkastet publiceras.
    await field.fill("2021-05-05T10:00");
    await save("Spara ändringar");
    await open(url);
    assert.equal(await field.inputValue(), "2021-05-05T10:00");
    await field.fill("2031-05-05T10:00");
    await save("Gör till utkast");
    await open(url);
    assert.equal(await field.inputValue(), "2031-05-05T10:00");
    await save("Publicera");
    await open(url);
    assert.equal(await field.inputValue(), "2031-05-05T10:00", "Schemaläggningen ska ligga kvar");

    // Tömt fält tar bort schemaläggningen.
    await field.fill("");
    await save("Spara ändringar");
    await open(url);
    assert.ok((await field.inputValue()).startsWith(today), "Tömt schema ska ge dagens datum");
  });

  await step("Rollfältet visar sitt eget fel (SB-35)", async () => {
    await page.goto(`${BASE}/admin/konton`);
    await waitForHydration(page, page.getByRole("button", { name: "Skapa konto" }));
    await submitNewUser(page, "Utan Roll");
    await page.evaluate(() => document.querySelectorAll('input[name="role"]').forEach((r) => { r.checked = false; }));
    await page.getByRole("button", { name: "Skapa konto" }).click();
    await page.locator("fieldset").getByText("Välj en roll.").waitFor();
  });
}
