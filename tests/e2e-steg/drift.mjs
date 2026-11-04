// Drift: sajtens CSP får inte stoppa något som sidorna behöver (SD-19). Sviten skriver konsolfel men blir inte röd av dem, därför ett eget steg.
import assert from "node:assert";
import { newVisitor, waitForHydration } from "../e2e-hjalp.mjs";

const ADMIN = "admin@statlin.se";

export default async function driftSteg({ BASE, browser, page, step, switchAccount }) {
  await step("Startsidan, ett evenemang, inloggningen och adminpanelen kör utan CSP-fel", async () => {
    const violations = [];
    const watch = (on) => {
      const listener = (m) => {
        if (/Content Security Policy/i.test(m.text())) violations.push(`${on.url()}: ${m.text()}`);
      };
      on.on("console", listener);
      return () => on.off("console", listener);
    };
    const visit = async (on, path) => {
      const res = await on.goto(`${BASE}${path}`);
      assert.equal(res.status(), 200, `${path} gav status ${res.status()}`);
      // Inline-skriptet i layouten sätter klassen, och Nexts egna skript hydrerar sidan. Stoppar CSP dem händer inget av det.
      await on.waitForFunction(() => document.documentElement.classList.contains("js"), null, { timeout: 15_000 }).catch((e) => {
        throw new Error(`${path} kom inte igång: ${violations[0] ?? e.message}`);
      });
      await waitForHydration(on, on.locator("a").first());
    };

    const { context, page: visitor } = await newVisitor(browser);
    const stopVisitor = watch(visitor);
    await visit(visitor, "/");
    await visit(visitor, "/evenemang");
    const event = await visitor.locator('main a[href^="/evenemang/"]:not([href$=".ics"])').first().getAttribute("href");
    await visit(visitor, event);
    await visit(visitor, "/logga-in");
    stopVisitor();
    await context.close();

    await switchAccount(page, ADMIN);
    const stopAdmin = watch(page);
    await visit(page, "/admin");
    await visit(page, "/admin/evenemang");
    stopAdmin();

    assert.equal(violations.length, 0, `CSP stoppade ${violations.length} saker, till exempel ${violations[0]}`);
  });
}
