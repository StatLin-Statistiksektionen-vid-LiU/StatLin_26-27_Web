// Metadata, språk och JavaScript på de publika sidorna: det som ska fungera också utan JavaScript, innan det har laddats och på de engelska sidorna.
import assert from "node:assert";
import { createEditor, newVisitor, waitForHydration } from "../e2e-hjalp.mjs";

const ADMIN = "admin@statlin.se";

export default async function metadataSteg({ BASE, browser, page, step, switchAccount }) {
  await step("Fel lösenord utan JavaScript visar inloggningssidan med felmeddelandet (SB-27)", async () => {
    const { context, page: visitor } = await newVisitor(browser, { javaScriptEnabled: false });
    await visitor.goto(`${BASE}/logga-in?next=/admin/evenemang`);
    await visitor.fill("#email", "finns-inte@statlin.se");
    await visitor.fill("#password", "ett-felaktigt-losenord");
    await visitor.click('button[type="submit"]');
    await visitor.getByText("Fel e-postadress eller lösenord.").waitFor({ timeout: 15_000 });
    await visitor.locator("#email").waitFor();
    assert.equal(await visitor.locator('input[name="next"]').getAttribute("value"), "/admin/evenemang", "Sidan man kom från ska följa med");
    assert.ok(!visitor.url().includes("finns-inte"), `E-postadressen ska inte stå i adressen: ${visitor.url()}`);
    await context.close();
  });

  await step("Rätt lösenord utan JavaScript loggar in", async () => {
    await switchAccount(page, ADMIN);
    const { email, password } = await createEditor(page, BASE);
    const { context, page: visitor } = await newVisitor(browser, { javaScriptEnabled: false });
    await visitor.goto(`${BASE}/logga-in`);
    await visitor.fill("#email", email);
    await visitor.fill("#password", password);
    await visitor.click('button[type="submit"]');
    await visitor.waitForURL(/\/admin\/konto\?byt=1/, { timeout: 15_000 });
    await context.close();
  });

  await step("Bara kända felkoder i adressen ger en text på inloggningssidan", async () => {
    const { context, page: visitor } = await newVisitor(browser, { javaScriptEnabled: false });
    const alertText = async (query) => {
      await visitor.goto(`${BASE}/logga-in?${query}`);
      return visitor.locator('form [role="alert"]').allTextContents();
    };
    assert.deepEqual(await alertText("fel=forsok"), ["För många inloggningsförsök. Vänta en stund och försök igen."]);
    assert.deepEqual(await alertText("fel=avstangt"), ["Kontot är avstängt – kontakta en administratör."]);
    for (const query of ["fel=constructor", "fel=__proto__", "fel=Ring+oss+p%C3%A5+070", "fel=a&fel=b"]) {
      const res = await visitor.goto(`${BASE}/logga-in?${query}`);
      assert.equal(res.status(), 200, `${query} gav status ${res.status()}`);
      assert.equal(await visitor.locator('form [role="alert"]').count(), 0, `${query} ska inte visa någon text`);
    }
    await context.close();
  });

  await step("Utan JavaScript visar /dokument sina dokument och sidfoten kontaktuppgifterna (SB-27)", async () => {
    const { context, page: visitor } = await newVisitor(browser, { javaScriptEnabled: false });
    for (const path of ["/", "/dokument", "/kontakt"]) {
      await visitor.goto(`${BASE}${path}`);
      const mail = visitor.locator('footer a[href^="mailto:"]').first();
      assert.ok(await mail.isVisible(), `${path}: sidfoten saknar e-postadressen`);
    }
    await visitor.goto(`${BASE}/dokument`);
    assert.equal(await visitor.locator("main h1").count(), 1, "/dokument saknar rubrik");
    assert.ok((await visitor.locator('main li a[target="_blank"]').count()) > 0, "/dokument visar inga dokument");
    assert.equal(await visitor.locator("main .animate-pulse").count(), 0, "/dokument visar ett skelett");
    await context.close();
  });

  await step("Utan JavaScript säger en sida med skelett varför innehållet saknas (SB-27)", async () => {
    const { context, page: visitor } = await newVisitor(browser, { javaScriptEnabled: false });
    await visitor.goto(`${BASE}/sektionen`);
    // getByText letar inte i noscript, och innerText ger bara det som syns.
    const notes = (await visitor.locator("main").innerText()).match(/behöver JavaScript/g) ?? [];
    assert.equal(notes.length, 1, `Beskedet står ${notes.length} gånger`);
    const shown = await visitor.locator(".animate-pulse:visible").count();
    assert.equal(shown, 0, `${shown} skelettblock pulserar för evigt`);
    await visitor.goto(`${BASE}/en/masters`);
    assert.match(await visitor.locator("main").innerText(), /needs JavaScript/, "De engelska sidorna ska säga det på engelska");
    await context.close();
  });

  await step("Med JavaScript syns varken beskedet eller standardvärdena, och /dokument går att nå inom sajten", async () => {
    const { context, page: visitor } = await newVisitor(browser);
    await visitor.goto(`${BASE}/sektionen`);
    await visitor.locator("main h1").waitFor();
    assert.ok(!(await visitor.locator("body").innerText()).includes("behöver JavaScript"), "Beskedet till besökare utan JavaScript syns");
    await waitForHydration(visitor, visitor.locator('footer a[href="/dokument"]'));
    await visitor.locator('footer a[href="/dokument"]').click();
    await visitor.waitForURL(/\/dokument$/);
    await visitor.locator('main li a[target="_blank"]:visible').first().waitFor();
    await context.close();
  });

  await step("Språkväxlaren leder till motsvarande sida på det andra språket (SB-21)", async () => {
    const { context, page: visitor } = await newVisitor(browser);
    const pairs = [
      ["/", "/en"],
      ["/en", "/"],
      ["/studenter/master", "/en/masters"],
      ["/en/masters", "/studenter/master"],
      ["/evenemang", "/en"],
    ];
    for (const [from, to] of pairs) {
      await visitor.goto(`${BASE}${from}`);
      // Rubriken är ett av hålen i skalet, så när den syns har sidhuvudet också fått adressen.
      await visitor.locator("main h1").first().waitFor();
      const link = visitor.locator("header a[hreflang]").first();
      await waitForHydration(visitor, link);
      assert.equal(await link.getAttribute("href"), to, `Från ${from}`);
    }
    await context.close();
  });

  await step("Datumen på /en/masters är på engelska och på /studenter/master på svenska (SB-29)", async () => {
    const { context, page: visitor } = await newVisitor(browser);
    await visitor.goto(`${BASE}/en/masters`);
    const rows = visitor.locator('main a[href^="/evenemang/"]:not([href$=".ics"])');
    await rows.first().waitFor();
    const english = (await rows.allInnerTexts()).join(" ");
    assert.match(english, /\b(mon|tue|wed|thu|fri|sat|sun)\b/i, `Ingen engelsk veckodag i: ${english}`);
    assert.doesNotMatch(english, /\b(mån|tis|ons|tors|fre|lör|sön|heldag)\b/i, `Svenska i: ${english}`);
    await visitor.goto(`${BASE}/studenter/master`);
    await rows.first().waitFor();
    const swedish = (await rows.allInnerTexts()).join(" ");
    assert.match(swedish, /(mån|tis|ons|tors|fre|lör|sön)/i, `Ingen svensk veckodag i: ${swedish}`);
    await context.close();
  });
}
