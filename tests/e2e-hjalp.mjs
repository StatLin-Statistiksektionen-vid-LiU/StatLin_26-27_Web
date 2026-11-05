// Hjälpfunktioner till stegen i tests/e2e-steg/. Här står inga lösenord, och de tillfälliga som läses från sidan skrivs aldrig ut.

let counter = 0;
/** En del av en adress eller rubrik som inte krockar med något som redan finns. */
export const uniqueId = () => `${Date.now().toString(36)}${++counter}`;

const ipPrefix = `10.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
let lastIp = 0;

/**
 * En besökare med egen webbläsarkontext och egen IP-adress, så att stegets inloggningar inte tär på svitens 20 försök
 * (rate-limit.ts räknar per IP). `npm run dev` läser adressen ur X-Forwarded-For. Mot `npm start` krävs CLIENT_IP_HEADER=x-forwarded-for.
 * `options` går vidare till kontexten, till exempel `{ javaScriptEnabled: false }`.
 */
export async function newVisitor(browser, options = {}) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    extraHTTPHeaders: { "x-forwarded-for": `${ipPrefix}.${++lastIp}` },
    ...options,
  });
  return { context, page: await context.newPage() };
}

/** Väntar tills React har tagit över elementet. Före det gör knappar och formulär ingenting, eller skickar något annat. */
export async function waitForHydration(page, locator) {
  await page.waitForFunction((el) => Object.keys(el).some((k) => k.startsWith("__react")), await locator.elementHandle());
}

export async function openLogin(page, BASE) {
  await page.goto(`${BASE}/logga-in`);
  await waitForHydration(page, page.locator("#email"));
}

/** Skickar inloggningsformuläret och svarar med felmeddelandet, eller null om inloggningen lyckades. Formuläret ska vara hydrerat. */
export async function tryLogin(page, email, password) {
  await page.fill("#email", email);
  await page.fill("#password", password);
  const answered = page.waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname === "/logga-in");
  await page.click('button[type="submit"]');
  await answered;
  // Knappen är låst tills svaret har ritats. Efter en lyckad inloggning är den låst tills sidan har bytts.
  await page.waitForFunction(() => location.pathname !== "/logga-in" || !document.querySelector('button[type="submit"]').disabled);
  return new URL(page.url()).pathname === "/logga-in" ? page.locator('form [role="alert"]').textContent() : null;
}

/** Skapar ett redaktörskonto. Sidan ska vara inloggad som administratör. Svarar med adressen och det tillfälliga lösenordet. */
export async function createEditor(page, BASE) {
  const email = `e2e-${uniqueId()}@statlin.se`;
  await page.goto(`${BASE}/admin/konton`);
  await waitForHydration(page, page.getByRole("button", { name: "Skapa konto" }));
  await page.fill('input[name="name"]', "E2E Testsson");
  await page.fill('input[name="email"]', email);
  await page.locator('label:has(input[name="role"][value="editor"])').click();
  await page.getByRole("button", { name: "Skapa konto" }).click();
  await page.getByText(`Kontot för ${email} är skapat`).waitFor();
  return { email, password: await page.locator("code").first().textContent() };
}

/** Byter det tillfälliga lösenordet på sidan som tvångsbytet leder till. Svarar med det nya lösenordet. */
export async function changeTemporaryPassword(page, temporary) {
  const next = `${temporary}-bytt`;
  await page.getByText("Välj ett eget lösenord för att komma igång.").waitFor();
  await waitForHydration(page, page.locator('input[name="current"]'));
  await page.fill('input[name="current"]', temporary);
  await page.fill('input[name="password"]', next);
  await page.fill('input[name="confirm"]', next);
  await page.getByRole("button", { name: "Byt lösenord" }).click();
  await page.getByText("Lösenordet är bytt.").waitFor();
  return next;
}

/**
 * Guiden i redigeringsbubblan öppnas första gången någon är inloggad, och då står resten av sidan stilla. Alla steg utom de
 * som provar guiden ska se sidan som en redaktör som redan har gått igenom den. `browser.newContextWithGuide` är den vanliga.
 */
export function skipEditGuide(browser) {
  const plain = browser.newContext.bind(browser);
  browser.newContextWithGuide = plain;
  browser.newContext = async (options) => {
    const context = await plain(options);
    await context.addInitScript(() => {
      try {
        localStorage.setItem("statlin-redigeringsguide", "sedd");
      } catch {
        // Sidor utan lagring, som about:blank.
      }
    });
    return context;
  };
}
