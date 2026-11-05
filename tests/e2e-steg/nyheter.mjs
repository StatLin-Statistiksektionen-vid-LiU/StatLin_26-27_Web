// Nyheter i adminpanelen och på sajten, från utkast till borttagen, och att Markdown rensas från skript.
import assert from "node:assert";
import { newVisitor, uniqueId, waitForHydration } from "../e2e-hjalp.mjs";

const ADMIN = "admin@statlin.se";
const NOT_FOUND = "Sidan du letar efter finns inte";

export default async function nyhetsSteg({ BASE, browser, page, step, switchAccount, openDeleteConfirm }) {
  const title = `E2E-nyhet ${uniqueId()}`;
  let adminUrl;
  let slug;
  // Sajten läses av en besökare som inte är inloggad.
  const visitor = await newVisitor(browser);
  const site = visitor.page;

  const openForm = async (url, on = page) => {
    await on.goto(url);
    await waitForHydration(on, on.locator('input[name="title"]'));
  };
  const assertHiddenFromSite = async () => {
    await site.goto(`${BASE}/nyheter`);
    await site.getByRole("heading", { level: 1 }).first().waitFor();
    assert.equal(await site.getByText(title).count(), 0, "nyheten ska inte synas i listan");
    await site.goto(`${BASE}/nyheter/${slug}`);
    await site.getByText(NOT_FOUND).waitFor();
  };

  await step("Enter i rubriken sparar en ny nyhet som utkast, och utkastet syns inte på sajten", async () => {
    await switchAccount(page, ADMIN);
    await openForm(`${BASE}/admin/nyheter/ny`);
    await page.fill('input[name="title"]', title);
    await page.press('input[name="title"]', "Enter");
    await page.waitForURL(/\/admin\/nyheter\/\d+\?skapad=1/);
    await page.getByText("Nyheten är sparad som utkast och syns inte på sajten än.").waitFor();
    adminUrl = page.url().split("?")[0];
    slug = await page.inputValue('input[name="slug"]');
    assert.ok(slug.length > 0, "utkastet ska ha en adress");
    await assertHiddenFromSite();
  });

  await step("En tom nyhet går inte att publicera, och en publicerad nyhet syns på sajten", async () => {
    await openForm(adminUrl);
    await page.getByRole("button", { name: "Publicera", exact: true }).click();
    await page.getByText("Skriv en ingress eller en text innan nyheten publiceras").waitFor();
    await assertHiddenFromSite();

    await openForm(adminUrl);
    await page.fill('textarea[name="excerpt"]', "Ingressen från testet.");
    await page.fill('textarea[name="body_md"]', "Texten från testet.");
    await page.getByRole("button", { name: "Publicera", exact: true }).click();
    await page.getByText("Sparat och publicerat.").waitFor();
    await site.goto(`${BASE}/nyheter`);
    await site.getByText(title).first().waitFor();
    await site.goto(`${BASE}/nyheter/${slug}`);
    await site.getByRole("heading", { name: title }).waitFor();
    await site.getByText("Texten från testet.").waitFor();
  });

  await step("En ändring i en publicerad nyhet syns på sajten", async () => {
    await openForm(adminUrl);
    await page.fill('textarea[name="body_md"]', "Den ändrade texten.");
    await page.getByRole("button", { name: "Spara ändringar", exact: true }).click();
    await page.getByText("Sparat och publicerat.").waitFor();
    await site.goto(`${BASE}/nyheter/${slug}`);
    await site.getByText("Den ändrade texten.").waitFor();
    assert.equal(await site.getByText("Texten från testet.").count(), 0, "den gamla texten ska vara borta");
  });

  await step("En nyhet som görs till utkast försvinner från sajten, och en borttagen nyhet är borta", async () => {
    await openForm(adminUrl);
    await page.getByRole("button", { name: "Gör till utkast", exact: true }).click();
    await page.getByText("Sparat som utkast.").waitFor();
    await assertHiddenFromSite();

    await openForm(adminUrl);
    const dialog = await openDeleteConfirm(page);
    await Promise.all([page.waitForURL(/\/admin\/nyheter\?raderad=1/), dialog.getByRole("button", { name: "Ta bort" }).click()]);
    await page.getByText("Nyheten är borttagen.").waitFor();
    // Listan laddas om, eftersom Next behåller den förra sidan dold i dokumentet efter ett sidbyte i appen.
    await page.goto(`${BASE}/admin/nyheter`);
    await page.getByRole("heading", { name: "Nytt" }).first().waitFor();
    assert.equal(await page.getByText(title).count(), 0, "nyheten ska vara borta ur adminlistan");
    await assertHiddenFromSite();
  });

  await step("Markdown rensas från skript, både i förhandsvisningen och på sajten", async () => {
    await switchAccount(page, ADMIN);
    // Testbilden finns inte och ger ett 404, så administratören arbetar i en egen flik där felet inte hamnar bland svitens konsolfel.
    const editor = await newVisitor(browser);
    await editor.context.addCookies(await page.context().cookies());
    const form = editor.page;
    const markdown = [
      "**fet text**",
      "<script>window.xss = 1</script>",
      '<img src="/finns-inte.png" onerror="window.xss = 2">',
      '<a href="javascript:window.xss = 3">html-länk</a>',
      "[markdown-länk](javascript:window.xss=4)",
      '<iframe src="https://example.com"></iframe>',
      "[vanlig länk](https://example.com/)",
    ].join("\n\n");
    const assertClean = async (prose) => {
      await prose.locator("strong", { hasText: "fet text" }).waitFor();
      assert.equal(await prose.locator('script, iframe, [onerror], a[href^="javascript:" i]').count(), 0, "skript ska vara borta ur texten");
      assert.equal(await prose.locator('a[href="https://example.com/"]').count(), 1, "en vanlig länk ska finnas kvar");
      assert.equal(await prose.page().evaluate(() => window.xss), undefined, "inget skript ska ha körts");
    };
    const markdownTitle = `E2E-markdown ${uniqueId()}`;
    await openForm(`${BASE}/admin/nyheter/ny`, form);
    await form.fill('input[name="title"]', markdownTitle);
    await form.fill('textarea[name="body_md"]', markdown);
    await form.getByRole("button", { name: "Förhandsgranska" }).click();
    await assertClean(form.locator("form .prose-statlin"));

    await form.getByRole("button", { name: "Publicera", exact: true }).click();
    await form.waitForURL(/\/admin\/nyheter\/\d+\?skapad=1/);
    const url = form.url().split("?")[0];
    const markdownSlug = await form.inputValue('input[name="slug"]');
    await site.goto(`${BASE}/nyheter/${markdownSlug}`);
    await assertClean(site.locator(".prose-statlin").first());

    await openForm(url, form);
    const dialog = await openDeleteConfirm(form);
    await Promise.all([form.waitForURL(/\/admin\/nyheter\?raderad=1/), dialog.getByRole("button", { name: "Ta bort" }).click()]);
    await editor.context.close();
    await visitor.context.close();
  });
}
