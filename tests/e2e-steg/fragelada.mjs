// Frågelådan: av och på, koden och de fasta lådorna, vem som får läsa, spärrarna. Steget lämnar funktionen avstängd, som den är i en färsk databas.
import assert from "node:assert";
import { newVisitor, uniqueId, waitForHydration } from "../e2e-hjalp.mjs";

const ADMIN = "admin@statlin.se";
const EDITOR = "info@statlin.se";
const OWNER = "scb@statlin.se";
const WRONG = "Koden fungerar inte";
const CLOSED_PAGE = "Frågelådan öppnar snart";
const RECEIPT = "Frågan ligger i lådan.";

const codeInput = (p) => p.locator('input[name="kod"]');

/** Går till kodsidan och väntar tills fältet svarar. */
async function openCodePage(p, BASE) {
  await p.goto(`${BASE}/fragelada`);
  await codeInput(p).waitFor();
  await waitForHydration(p, codeInput(p));
}

/** Skriver hela koden, vilket skickar formuläret av sig självt, och väntar på svaret. */
async function enterCode(p, code) {
  const answered = p.waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname === "/fragelada");
  await codeInput(p).fill(code);
  await answered;
}

async function openNote(p, BASE, path) {
  await p.goto(`${BASE}${path}`);
  await p.locator("#fraga").waitFor();
  await waitForHydration(p, p.locator("#fraga"));
}

async function send(p, text) {
  await p.locator("#fraga").fill(text);
  await p.getByRole("button", { name: "Skicka frågan" }).click();
}

async function setSwitch(page, BASE, on) {
  await page.goto(`${BASE}/admin/fragelada`);
  const toggle = page.getByRole("switch", { name: "Frågelådan öppen för besökare" });
  await toggle.waitFor();
  await waitForHydration(page, toggle);
  if ((await toggle.getAttribute("aria-checked")) !== String(on)) await toggle.click();
  await page.getByText(on ? "Frågelådan är på" : "Frågelådan är av").waitFor();
}

export default async function frageladaSteg({ BASE, browser, page, step, switchAccount }) {
  const { context, page: visitor } = await newVisitor(browser);
  const marker = uniqueId();
  const firstQuestion = `Fråga ${marker} <img src=x onerror="window.__xss=1"> *inte fet*`;
  let code;
  let boxUrl;

  await step("Frågelådan: avstängd visar ett lugnt besked, inga länkar och noindex", async () => {
    await visitor.goto(`${BASE}/fragelada`);
    await visitor.getByText(CLOSED_PAGE).waitFor();
    assert.match((await visitor.locator('meta[name="robots"]').first().getAttribute("content")) ?? "", /noindex/);
    assert.equal(await codeInput(visitor).count(), 0, "kodfältet ska inte finnas");
    await visitor.goto(`${BASE}/fragelada/ubu`);
    await visitor.getByText(CLOSED_PAGE).waitFor();
    assert.equal(await visitor.locator("#fraga").count(), 0, "lappen ska inte finnas");
    for (const path of ["/studenter/kandidat", "/studenter/master", "/utskott/ubu", "/utskott/amo", "/en/masters", "/integritet"]) {
      await visitor.goto(`${BASE}${path}`);
      assert.equal(await visitor.locator('a[href^="/fragelada"]').count(), 0, `${path} ska inte länka till lådan när den är av`);
    }
    assert.equal(await visitor.getByText("Frågelådan").count(), 0, "integritetssidan ska inte nämna lådan när den är av");
  });

  await step("Frågelådan: en post får inte slå på funktionen, och ser inget reglage", async () => {
    await switchAccount(page, OWNER);
    await page.goto(`${BASE}/admin/fragelada`);
    await page.getByText("Dina lådor").waitFor();
    assert.equal(await page.getByRole("switch").count(), 0);
    await page.getByText("Frågelådan är inte öppen för besökare än").waitFor();
  });

  await step("Frågelådan: administratören slår på, och länkarna syns", async () => {
    await switchAccount(page, ADMIN);
    await setSwitch(page, BASE, true);
    await visitor.goto(`${BASE}/studenter/kandidat`);
    assert.ok((await visitor.locator('main a[href="/fragelada/ubu"]').count()) > 0, "länken till UBU:s låda saknas");
  });

  await step("Frågelådan: en post skapar en låda och får en kod utan förväxlingsbara tecken", async () => {
    await switchAccount(page, OWNER);
    await page.goto(`${BASE}/admin/fragelada/ny`);
    const create = page.getByRole("button", { name: "Skapa låda" });
    await create.waitFor();
    await waitForHydration(page, create);
    await page.fill('input[name="title"]', `Testkurs ${marker}`);
    await create.click();
    await page.waitForURL(/\/admin\/fragelada\/\d+\?skapad=1/);
    boxUrl = new URL(page.url()).pathname;
    code = (await page.locator('section[aria-label="Kod och länk"] p.font-mono').textContent()).trim();
    assert.match(code, /^[A-HJKMNP-Z2-9]{6}$/);
  });

  await step("Frågelådan: fel kod stoppas, rätt kod öppnar, och utloggad kan skicka", async () => {
    await openCodePage(visitor, BASE);
    await enterCode(visitor, "ZZZZZZ");
    await visitor.getByText(WRONG).waitFor();
    // Skriver man över en hel kod skickas den också, utan att knappen behövs. Små bokstäver går bra.
    await enterCode(visitor, code.toLowerCase());
    await visitor.getByRole("heading", { name: `Testkurs ${marker}` }).waitFor();
    await visitor.locator("#fraga").waitFor();
    await send(visitor, firstQuestion);
    await visitor.getByText(RECEIPT).waitFor({ state: "attached" });
    await visitor.getByRole("button", { name: "Skicka en till" }).click();
    await visitor.locator("#fraga").waitFor();
    assert.equal(await visitor.locator("#fraga").inputValue(), "", "nästa lapp ska vara tom");
  });

  await step("Frågelådan: länken med kod går direkt till lappen, och en inklistrad länk fungerar i fältet", async () => {
    await openNote(visitor, BASE, `/fragelada?kod=${code}`);
    await visitor.getByRole("heading", { name: `Testkurs ${marker}` }).waitFor();
    await openCodePage(visitor, BASE);
    await enterCode(visitor, `${BASE}/fragelada?kod=${code}`);
    await visitor.getByRole("heading", { name: `Testkurs ${marker}` }).waitFor();
    await visitor.goto(`${BASE}/fragelada?kod=ZZZZZZ`);
    await visitor.getByText(WRONG).waitFor();
  });

  await step("Frågelådan: en för lång fråga nekas på servern och texten står kvar", async () => {
    await openNote(visitor, BASE, `/fragelada?kod=${code}`);
    await visitor.locator("#fraga").evaluate((el) => el.removeAttribute("maxlength"));
    const tooLong = "x".repeat(2001);
    await send(visitor, tooLong);
    await visitor.getByText("högst 2000 tecken").waitFor();
    assert.equal(await visitor.locator("#fraga").inputValue(), tooLong);
  });

  await step("Frågelådan: honungsfällan får ett vanligt kvitto men sparar inget", async () => {
    await openNote(visitor, BASE, `/fragelada?kod=${code}`);
    await visitor.locator('input[name="webbplats"]').evaluate((el) => {
      el.value = "https://example.com";
    });
    await send(visitor, `Robot ${marker}`);
    await visitor.getByText(RECEIPT).waitFor({ state: "attached" });
  });

  await step("Frågelådan: ägaren ser en siffra i menyn och läser frågan som ren text, utan namn och klockslag", async () => {
    await switchAccount(page, OWNER);
    await page.goto(`${BASE}/admin/fragelada`);
    // Menyn finns dold en gång till för mobilen.
    await page.locator('a[href="/admin/fragelada"]:visible').getByText("nya").waitFor({ state: "attached" });
    const seen = page.waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname === boxUrl);
    await page.goto(`${BASE}${boxUrl}`);
    await page.getByText(firstQuestion).waitFor();
    await seen;
    assert.equal(await page.getByText(`Robot ${marker}`).count(), 0, "honungsfällans fråga ska inte sparas");
    assert.equal(await page.locator('main img[src="x"]').count(), 0, "frågan ska inte tolkas som HTML");
    assert.equal(await page.evaluate(() => window.__xss), undefined);
    const card = page.locator("li", { hasText: firstQuestion });
    const text = await card.textContent();
    assert.match(text, /(januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december) \d{4}/);
    assert.doesNotMatch(text, /\d{1,2}:\d{2}/, "inget klockslag");
    // Sidan markerar frågan som läst när den visas, så siffran försvinner.
    await assert.doesNotReject(async () => {
      for (let i = 0; i < 20; i++) {
        await page.goto(`${BASE}/admin/fragelada`);
        await page.getByText("Dina lådor").waitFor();
        if ((await page.locator('a[href="/admin/fragelada"]:visible').getByText("nya").count()) === 0) return;
        await page.waitForTimeout(250);
      }
      throw new Error("siffran i menyn försvann inte");
    });
  });

  await step("Frågelådan: administratören och andra konton kommer inte åt frågorna, varken på sidan eller i en action", async () => {
    // Ägarens sida är öppen när kakan byts: det som skickas nu är administratörens anrop mot ägarens fråga.
    await switchAccount(page, OWNER);
    await page.goto(`${BASE}${boxUrl}`);
    const card = page.locator("li", { hasText: firstQuestion });
    const handled = card.getByRole("button", { name: "Markera som hanterad" });
    await handled.waitFor();
    await waitForHydration(page, handled);
    await switchAccount(page, ADMIN);
    await handled.click();
    await page.waitForURL(/\/admin\/fragelada\?nekad=1/);

    await switchAccount(page, OWNER);
    await page.goto(`${BASE}${boxUrl}`);
    const remove = card.getByRole("button", { name: "Ta bort" });
    await remove.waitFor();
    await waitForHydration(page, remove);
    await remove.click();
    const dialog = card.getByRole("alertdialog");
    await dialog.waitFor();
    await switchAccount(page, ADMIN);
    // Svaret är en nekning, och sidan ritas om som administratörens. Att frågan finns kvar kontrolleras längst ned.
    const refused = page.waitForResponse((r) => r.request().method() === "POST" && new URL(r.url()).pathname === boxUrl);
    await dialog.getByRole("button", { name: "Ta bort" }).click();
    await refused;

    for (const email of [ADMIN, EDITOR]) {
      await switchAccount(page, email);
      await page.goto(`${BASE}${boxUrl}`);
      await page.waitForURL(/\/admin\/fragelada\?nekad=1/);
      await page.getByText("Bara kontot som äger lådan kan öppna den.").waitFor();
      assert.equal((await page.content()).includes(`Fråga ${marker}`), false, `${email} ska inte kunna läsa frågan`);
    }

    // Administratören ser titel och antal i översikten, inte texten.
    await switchAccount(page, ADMIN);
    await page.goto(`${BASE}/admin/fragelada`);
    await page.getByText(`Testkurs ${marker}`, { exact: true }).waitFor();
    assert.equal((await page.content()).includes(`Fråga ${marker}`), false);

    await switchAccount(page, OWNER);
    await page.goto(`${BASE}${boxUrl}`);
    await page.getByText(firstQuestion).waitFor();
    assert.equal(await page.locator("li", { hasText: firstQuestion }).getByRole("button", { name: "Markera som hanterad" }).count(), 1, "frågan ska vara orörd");
  });

  await step("Frågelådan: en stängd låda ger samma svar som fel kod, och texten står kvar på lappen", async () => {
    await openNote(visitor, BASE, `/fragelada?kod=${code}`);
    const text = `Står kvar ${marker}`;

    await switchAccount(page, OWNER);
    await page.goto(`${BASE}${boxUrl}`);
    await page.getByText("Inställningar för lådan").click();
    const close = page.getByRole("button", { name: "Stäng lådan" });
    await waitForHydration(page, close);
    await close.click();
    await page.getByRole("button", { name: "Öppna lådan" }).waitFor({ state: "attached" });

    await send(visitor, text);
    await visitor.getByText(WRONG).waitFor();
    assert.equal(await visitor.locator("#fraga").inputValue(), text);

    await openCodePage(visitor, BASE);
    await enterCode(visitor, code);
    await visitor.getByText(WRONG).waitFor();

    await page.reload();
    await page.getByText("Inställningar för lådan").click();
    const reopen = page.getByRole("button", { name: "Öppna lådan" });
    await waitForHydration(page, reopen);
    await reopen.click();
    await page.getByRole("button", { name: "Stäng lådan" }).waitFor({ state: "attached" });
  });

  await step("Frågelådan: spärren för gissningar slår till, och stoppar även rätt kod", async () => {
    const { context: guesser, page: g } = await newVisitor(browser);
    await openCodePage(g, BASE);
    for (let i = 0; i < 20; i++) {
      // Sex tecken som aldrig blir en kod: koder innehåller inte O.
      await enterCode(g, `OOOOO${"ABCDEFGHJKMNPQRSTUVW"[i]}`.replaceAll("O", "Z"));
      await g.getByText(WRONG).waitFor();
    }
    await enterCode(g, "ZZZZZX");
    await g.getByText("försökt för många gånger").waitFor();
    await enterCode(g, code);
    await g.getByText("försökt för många gånger").waitFor();
    assert.equal(await g.locator("#fraga").count(), 0);
    await guesser.close();

    // Andra besökare påverkas inte.
    await openCodePage(visitor, BASE);
    await enterCode(visitor, code);
    await visitor.locator("#fraga").waitFor();
  });

  await step("Frågelådan: de fasta lådorna behöver ingen kod, och en låda utan ägare tar inte emot något", async () => {
    await openNote(visitor, BASE, "/fragelada/ubu");
    await send(visitor, `Till UBU ${marker}`);
    await visitor.getByText(RECEIPT).waitFor({ state: "attached" });

    await visitor.goto(`${BASE}/fragelada/amo`);
    await visitor.getByText("Den här lådan är inte öppen just nu").waitFor();

    await switchAccount(page, ADMIN);
    await page.goto(`${BASE}/admin/fragelada`);
    const amo = page.locator("li", { hasText: "AMO, arbetsmiljöombudet" }).last();
    const save = amo.getByRole("button", { name: "Spara ägare" });
    await save.waitFor();
    await waitForHydration(page, save);
    await amo.locator('select[name="owner_id"]').selectOption({ index: 1 });
    await save.click();
    await amo.getByText("Ägaren är bytt.").waitFor();

    await openNote(visitor, BASE, "/fragelada/amo");
    await send(visitor, `Till AMO ${marker}`);
    await visitor.getByText(RECEIPT).waitFor({ state: "attached" });
  });

  await step("Frågelådan: ägarbyte på en fast låda kräver att frågorna raderas", async () => {
    await page.goto(`${BASE}/admin/fragelada`);
    const ubu = page.locator("li", { hasText: "UBU, utbildningsbevakningen" }).last();
    const save = ubu.getByRole("button", { name: "Spara ägare" });
    await save.waitFor();
    await waitForHydration(page, save);
    const select = ubu.locator('select[name="owner_id"]');
    const current = await select.inputValue();
    assert.notEqual(current, "", "UBU:s låda ska ha fått sin ägare när funktionen slogs på");
    const other = await select.locator("option").evaluateAll((options, skip) => options.map((o) => o.value).find((v) => v && v !== skip), current);
    await select.selectOption(other);
    await save.click();
    await ubu.getByText("Kryssa i att de raderas").first().waitFor();
    await page.goto(`${BASE}/admin/fragelada`);
    await page.locator("li", { hasText: "UBU, utbildningsbevakningen" }).last().locator('select[name="owner_id"]').waitFor();
    assert.equal(await page.locator("li", { hasText: "UBU, utbildningsbevakningen" }).last().locator('select[name="owner_id"]').inputValue(), current);
  });

  await step("Frågelådan: avstängd på nytt nekar på servern, och texten står kvar", async () => {
    await openNote(visitor, BASE, `/fragelada?kod=${code}`);
    const text = `Avstängd ${marker}`;
    await switchAccount(page, ADMIN);
    await setSwitch(page, BASE, false);
    await send(visitor, text);
    await visitor.getByText(WRONG).waitFor();
    assert.equal(await visitor.locator("#fraga").inputValue(), text);
    await visitor.goto(`${BASE}/fragelada`);
    await visitor.getByText(CLOSED_PAGE).waitFor();
    await visitor.goto(`${BASE}/studenter/kandidat`);
    assert.equal(await visitor.locator('a[href^="/fragelada"]').count(), 0);
  });

  await step("Frågelådan: ägaren tömmer lådan, och administratören kan ta bort en låda utan att läsa den", async () => {
    await switchAccount(page, OWNER);
    await page.goto(`${BASE}${boxUrl}`);
    const empty = page.getByRole("button", { name: "Töm lådan" });
    await empty.waitFor();
    await waitForHydration(page, empty);
    await empty.click();
    const dialog = page.getByRole("alertdialog").filter({ hasText: "Radera alla" });
    await dialog.waitFor();
    await dialog.getByRole("button", { name: "Töm lådan" }).click();
    await page.getByText("Lådan är tom.").waitFor();

    await switchAccount(page, ADMIN);
    await page.goto(`${BASE}/admin/fragelada`);
    const row = page.locator("li", { hasText: `Testkurs ${marker}` });
    const del = row.getByRole("button", { name: "Ta bort" }).first();
    await del.waitFor();
    await waitForHydration(page, del);
    await del.click();
    const confirm = row.getByRole("alertdialog");
    await confirm.waitFor();
    await confirm.getByRole("button", { name: "Ta bort" }).click();
    await page.getByText("Lådan är borttagen").waitFor();
  });

  await context.close();
}
