// Evenemang, kalendern och datumen, så som en redaktör och en besökare möter dem.
import assert from "node:assert";
import { newVisitor, uniqueId, waitForHydration } from "../e2e-hjalp.mjs";

const ADMIN = "admin@statlin.se";
// V8 rullar de två första till en annan dag utan fel, och de två sista ger Invalid Date (SB-32).
const FINNS_INTE = ["2025-02-30T12:00", "2025-02-28T24:00", "2025-13-01T12:00", "2025-02-28T12:60"];

export default async function evenemangSteg({ BASE, browser, page, step, switchAccount, openDeleteConfirm }) {
  // Sajten läses av en besökare som inte är inloggad.
  const visitor = await newVisitor(browser);
  const site = visitor.page;

  const openForm = async (url) => {
    await page.goto(url);
    await waitForHydration(page, page.locator('input[name="title"]'));
  };
  const openDetails = () => page.locator("summary:visible", { hasText: "Fler detaljer" }).click();
  /**
   * Skickar en tid som inte finns. Chromiums datumfält släpper inte igenom den, men det gör andra webbläsare och handskrivna anrop.
   * Värdet ligger i ett eget fält sist i formuläret, där det vinner över det synliga (formObject). Ett datumfält som görs om till
   * textfält går inte att använda: React sätter tillbaka typen vid nästa rendering, och då töms fältet.
   */
  const sendValue = (name, value) =>
    page.locator('form:has(input[name="title"]):visible').evaluate(
      (form, [fieldName, fieldValue]) => {
        form.querySelector(`input[data-e2e="${fieldName}"]`)?.remove();
        const input = Object.assign(document.createElement("input"), { type: "hidden", name: fieldName, value: fieldValue });
        input.dataset.e2e = fieldName;
        form.append(input);
      },
      [name, value],
    );
  const submitAndWaitForError = async (button, message) => {
    const answered = page.waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname === new URL(page.url()).pathname);
    await button.click();
    await answered;
    await page.locator(`[id$="-error"]:visible`, { hasText: message }).waitFor();
  };
  const removeEvent = async (url) => {
    await openForm(url);
    const dialog = await openDeleteConfirm(page);
    await Promise.all([page.waitForURL(/\/admin\/evenemang\?/), dialog.getByRole("button", { name: "Ta bort" }).click()]);
  };

  await step("SB-32: en tid som inte finns ger fältfel på start och slut och sparas inte, och en giltig tid sparas", async () => {
    await switchAccount(page, ADMIN);
    const title = `E2E-datum ${uniqueId()}`;
    await openForm(`${BASE}/admin/evenemang/ny`);
    await page.fill('input[name="title"]', title);
    await openDetails();
    const draft = page.getByRole("button", { name: "Spara som utkast", exact: true });

    for (const bad of FINNS_INTE) {
      await sendValue("starts_at", bad);
      await submitAndWaitForError(draft, "Starttiden måste vara ett giltigt datum och klockslag.");
    }
    await sendValue("starts_at", "2025-02-28T12:00");
    // Ett valfritt fält med ogiltigt innehåll blev förut tyst tomt. Ett datum utan klockslag är samma sak.
    for (const bad of [...FINNS_INTE, "2025-03-01"]) {
      await sendValue("ends_at", bad);
      await submitAndWaitForError(draft, "Sluttiden måste vara ett giltigt datum och klockslag.");
    }
    assert.equal(new URL(page.url()).pathname, "/admin/evenemang/ny", "inget ska ha sparats");
    assert.equal(await page.inputValue('input[name="title"]'), title, "fälten ska behållas");

    await sendValue("ends_at", "");
    await Promise.all([page.waitForURL(/\/admin\/evenemang\/\d+\?skapad=1/), draft.click()]);
    const url = page.url().split("?")[0];
    await openForm(url);
    assert.equal(await page.inputValue('input[name="starts_at"]'), "2025-02-28T12:00");

    const feed = await site.request.get(`${BASE}/kalender.ics`);
    assert.equal(feed.status(), 200, "kalenderflödet ska svara");
    await removeEvent(url);
  });

  await step("SB-32: en nyhets publiceringsdatum som inte finns ger fältfel och sparas inte", async () => {
    await openForm(`${BASE}/admin/nyheter/ny`);
    await page.fill('input[name="title"]', `E2E-datum ${uniqueId()}`);
    await openDetails();
    await sendValue("published_at", "2025-02-30T12:00");
    await submitAndWaitForError(page.getByRole("button", { name: "Spara som utkast", exact: true }), "Publiceringsdatumet måste vara ett giltigt datum och klockslag.");
    assert.equal(new URL(page.url()).pathname, "/admin/nyheter/ny", "inget ska ha sparats");
  });

  await visitor.context.close();
}
