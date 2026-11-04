// Evenemang, kalendern och datumen, så som en redaktör och en besökare möter dem.
import assert from "node:assert";
import { newVisitor, uniqueId, waitForHydration } from "../e2e-hjalp.mjs";

const ADMIN = "admin@statlin.se";
// V8 rullar de två första till en annan dag utan fel, och de två sista ger Invalid Date (SB-32).
const FINNS_INTE = ["2025-02-30T12:00", "2025-02-28T24:00", "2025-13-01T12:00", "2025-02-28T12:60"];

/** Dagens datum i Stockholm, "YYYY-MM-DD", plus eller minus några dagar. */
const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const dayOffset = (days) => new Date(Date.parse(`${today}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
/** "21 augusti", så som datumet står på sajten. */
const longDate = (date, withYear = false) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "UTC", day: "numeric", month: "long", ...(withYear ? { year: "numeric" } : {}) }).format(new Date(`${date}T00:00:00Z`));

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
  /** Publicerar ett evenemang genom formuläret. Svarar med adressen i admin och sluggen. */
  const createEvent = async ({ title, startsAt, endsAt, allDay }) => {
    await openForm(`${BASE}/admin/evenemang/ny`);
    await page.fill('input[name="title"]', title);
    await page.fill('textarea[name="summary"]', "Skapat av det automatiska testet.");
    await page.fill('input[name="starts_at"]', startsAt);
    await openDetails();
    if (endsAt) await page.fill('input[name="ends_at"]', endsAt);
    if (allDay) await page.locator('label:has(input[name="all_day"])').click();
    await Promise.all([page.waitForURL(/\/admin\/evenemang\/\d+\?skapad=1/), page.getByRole("button", { name: "Publicera", exact: true }).click()]);
    return { url: page.url().split("?")[0], slug: await page.inputValue('input[name="slug"]') };
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

  await step("SB-01: heldag visas under Kommande hela sista dagen, med slutdatumet, och kalenderfilen är oförändrad", async () => {
    await switchAccount(page, ADMIN);
    const title = `E2E-heldag ${uniqueId()}`;
    const [first, last] = [dayOffset(-4), dayOffset(0)];
    // Datumfältet ger slutdagen klockslaget 00:00. Klockan har alltså passerat det hela den sista dagen.
    const { url, slug } = await createEvent({ title, startsAt: `${first}T00:00`, endsAt: `${last}T00:00`, allDay: true });
    const label = `Heldag t.o.m. ${longDate(last, first.slice(0, 4) !== last.slice(0, 4))}`;

    await site.goto(`${BASE}/evenemang`);
    // Kommande är kort med en h3. Under Tidigare evenemang står samma länk som en rad utan.
    const card = site.locator(`main a[href="/evenemang/${slug}"]:has(h3)`);
    await card.waitFor();
    assert.ok((await card.innerText()).includes(label), `kortet ska visa "${label}"`);

    await site.goto(`${BASE}/evenemang/${slug}`);
    await site.getByText(label).first().waitFor();

    await page.goto(`${BASE}/admin/evenemang`);
    await page.getByText(title).first().waitFor();

    const feed = await (await site.request.get(`${BASE}/kalender.ics`)).text();
    const event = feed.split("BEGIN:VEVENT").find((v) => v.includes(`/evenemang/${slug}`));
    assert.ok(event, "evenemanget ska finnas i kalenderfilen");
    assert.ok(event.includes(`DTSTART;VALUE=DATE:${first.replaceAll("-", "")}`), "DTSTART ska vara första dagen");
    assert.ok(event.includes(`DTEND;VALUE=DATE:${dayOffset(1).replaceAll("-", "")}`), "DTEND ska vara dagen efter sista dagen");
    await removeEvent(url);
  });

  await step("SB-01: en heldag jämför bara datumen, så slut 00:00 samma dag går att spara och visas som Heldag", async () => {
    const day = dayOffset(1);
    const { url, slug } = await createEvent({ title: `E2E-heldag ${uniqueId()}`, startsAt: `${day}T18:00`, endsAt: `${day}T00:00`, allDay: true });
    await site.goto(`${BASE}/evenemang/${slug}`);
    await site.getByText("Heldag", { exact: true }).first().waitFor();
    await removeEvent(url);
  });

  await step("SB-06: starta-terminen räknas inte som STAR, och mässan som valts i Inställningar visas på företagssidan", async () => {
    await switchAccount(page, ADMIN);
    const starLinks = () => site.locator('main a[href^="/evenemang/"]');

    // Evenemanget ligger före den seedade mässan och har "star" i adressen.
    const starta = await createEvent({ title: `Starta terminen ${uniqueId()}`, startsAt: `${dayOffset(1)}T18:00` });
    await site.goto(`${BASE}/foretag`);
    await starLinks().first().waitFor();
    assert.deepEqual(await starLinks().evaluateAll((els) => els.map((a) => a.getAttribute("href"))), ["/evenemang/star"]);

    // Långt bort och utan "star" i adressen: bara valet i Inställningar kan peka ut det.
    const massan = await createEvent({ title: `E2E-mässan ${uniqueId()}`, startsAt: `${dayOffset(400)}T10:00` });
    const save = async (value) => {
      await page.goto(`${BASE}/admin/installningar`);
      await waitForHydration(page, page.locator('select[name="star_event_id"]'));
      await page.selectOption('select[name="star_event_id"]', value);
      await page.getByRole("button", { name: "Spara" }).first().click();
      await page.getByText("Inställningarna är sparade.").waitFor();
    };
    await save(massan.url.split("/").pop());
    await site.goto(`${BASE}/foretag`);
    await site.locator(`main a[href="/evenemang/${massan.slug}"]`).waitFor();

    await save("");
    await removeEvent(massan.url);
    await removeEvent(starta.url);
  });

  await visitor.context.close();
}
