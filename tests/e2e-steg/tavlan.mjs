// Uppdragstavlans två vyer: korten på tavlan är länkar till uppdragen, listan sorterar efter vad som är närmast i tiden, och filter
// och vy följer med varandra i adressen. På en smal telefon får inget sticka ut och tomma statuskolumner ska inte synas.
import assert from "node:assert";
import { uniqueId, waitForHydration } from "../e2e-hjalp.mjs";

const ADMIN = "admin@statlin.se";

const todaySwedish = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date());
const addDays = (date, days) => new Date(Date.parse(`${date}T12:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

export default async function tavlanSteg({ BASE, page, step, switchAccount }) {
  const id = uniqueId();
  const today = todaySwedish();
  const overdue = `E2E tavla försenat ${id}`;
  const soon = `E2E tavla snart ${id}`;
  const later = `E2E tavla senare ${id}`;
  const noDate = `E2E tavla utan datum ${id}`;
  const done = `E2E tavla färdig ${id}`;
  const sorted = [overdue, soon, later, noDate, done];

  /** Skickar ett öppet uppdrag från administratören och stannar på uppdragets sida. */
  const newTask = async (title, dueDate) => {
    await page.goto(`${BASE}/admin/uppdrag/ny`);
    const send = page.getByRole("button", { name: "Skicka uppdraget" });
    await waitForHydration(page, send);
    await page.fill('input[name="title"]', title);
    await page.selectOption('select[name="to_user_id"]', "");
    if (dueDate) await page.fill('input[name="due_date"]', dueDate);
    await Promise.all([page.waitForURL(/\/admin\/uppdrag\/\d+\?skapat=1/), send.click()]);
  };

  const taskLink = (text) => page.locator('main a[href^="/admin/uppdrag/"]', { hasText: text }).filter({ visible: true });
  /** Uppdragen från det här steget i den ordning de står på sidan. Den föregående sidan ligger kvar dold, därav bara det synliga. */
  const rows = () => taskLink(id).allInnerTexts();
  const order = (texts) => texts.map((text) => sorted.find((title) => text.includes(title)));

  const filters = () => page.getByRole("navigation", { name: "Vilka uppdrag" });
  const views = () => page.getByRole("navigation", { name: "Visning" });
  /** Väntar in sidan efter ett klick på en länk i ett av valen. Adressen byts innan det nya innehållet har kommit. */
  const waitForActive = (nav, label) => nav.locator('a[aria-current="true"]', { hasText: label }).waitFor();

  await step("Uppdragstavlan: korten är länkar till uppdragen", async () => {
    await switchAccount(page, ADMIN);
    // Skapas i blandad ordning, så att ordningen i listan inte kan komma av hur de skapades.
    await newTask(later, addDays(today, 10));
    await newTask(noDate, null);
    await newTask(overdue, addDays(today, -2));
    await newTask(soon, addDays(today, 1));
    await newTask(done, addDays(today, -3));
    const finish = page.getByRole("button", { name: "Klart", exact: true });
    await waitForHydration(page, finish);
    await finish.click();
    await page.locator('button[aria-pressed="true"]', { hasText: "Klart" }).waitFor();

    await page.goto(`${BASE}/admin/uppdrag`);
    await waitForActive(views(), "Tavla");
    const card = page.getByRole("link", { name: overdue });
    await card.waitFor();
    assert.match(await card.getAttribute("href"), /^\/admin\/uppdrag\/\d+$/);
    assert.match(await card.getAttribute("title"), /Från .+ till vem som helst/);
    const klart = page.getByRole("region", { name: "Klart" }).getByRole("link", { name: done });
    await klart.waitFor();
    await card.click();
    await page.waitForURL(/\/admin\/uppdrag\/\d+$/);
    await page.getByRole("heading", { name: overdue }).waitFor();
  });

  await step("Uppdragstavlan: listan har det försenade först och det klara sist", async () => {
    await page.goto(`${BASE}/admin/uppdrag`);
    await views().getByRole("link", { name: "Lista" }).click();
    await page.waitForURL(/\?vy=lista$/);
    await waitForActive(views(), "Lista");
    await taskLink(overdue).waitFor();
    const texts = await rows();
    assert.deepEqual(order(texts), sorted);
    assert.match(texts[0], /Försenat/);
    assert.match(texts[0], /Planerat/i);
    assert.doesNotMatch(texts[4], /Försenat/);
    assert.match(texts[4], /Klart/i);
  });

  await step("Uppdragstavlan: filtret och vyn följer med varandra", async () => {
    await page.goto(`${BASE}/admin/uppdrag?vy=lista`);
    await filters().getByRole("link", { name: "Från dig" }).click();
    await waitForActive(filters(), "Från dig");
    let query = new URL(page.url()).searchParams;
    assert.equal(query.get("visa"), "fran");
    assert.equal(query.get("vy"), "lista");
    await waitForActive(views(), "Lista");
    assert.deepEqual(order(await rows()), sorted);

    const board = views().getByRole("link", { name: "Tavla" });
    assert.equal(await board.getAttribute("href"), "/admin/uppdrag?visa=fran");
    await board.click();
    await waitForActive(views(), "Tavla");
    query = new URL(page.url()).searchParams;
    assert.equal(query.get("visa"), "fran");
    assert.equal(query.get("vy"), null);
    await page.getByRole("link", { name: overdue }).waitFor();

    assert.equal(await filters().getByRole("link", { name: "Alla" }).getAttribute("href"), "/admin/uppdrag");
    await views().getByRole("link", { name: "Lista" }).click();
    await waitForActive(views(), "Lista");
    assert.equal(await filters().getByRole("link", { name: "Alla" }).getAttribute("href"), "/admin/uppdrag?vy=lista");
  });

  await step("Uppdragstavlan: inget sticker ut på en smal telefon, och tomma kolumner syns inte", async () => {
    const size = page.viewportSize();
    await page.setViewportSize({ width: 320, height: 640 });
    try {
      for (const path of ["/admin/uppdrag", "/admin/uppdrag?vy=lista"]) {
        await page.goto(`${BASE}${path}`);
        await taskLink(overdue).waitFor();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(overflow <= 0, `${path} sticker ut ${overflow} px`);
        assert.equal(await page.getByText("Inget här").filter({ visible: true }).count(), 0, path);
      }
    } finally {
      await page.setViewportSize(size);
    }
  });
}
