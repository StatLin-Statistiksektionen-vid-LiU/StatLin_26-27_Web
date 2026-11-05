/**
 * Demodata till frågelådan, för att prova den lokalt: slår på funktionen i testdatabasen, ger UBU en ägare och fyller lådorna med
 * påhittade frågor. Går att köra flera gånger utan dubbletter. Körs aldrig av seed eller start.
 *
 *   DATA_DIR=<samma som servern> npx tsx scripts/demo-fragelada.ts
 *
 * Prova: /fragelada?kod=STAT26 och /fragelada/ubu. Inloggad som scb@statlin.se finns lådan med koden under /admin/fragelada.
 */
import crypto from "node:crypto";
import { getDb } from "../src/lib/db";
import { todayLocal } from "../src/lib/dates";

if (process.env.NODE_ENV === "production") {
  console.error("demo-fragelada vägras när NODE_ENV=production: påhittade frågor hör bara hemma i en lokal databas.");
  process.exit(1);
}

const db = getDb();
const userId = (email: string) => (db.prepare("SELECT id FROM users WHERE email = ? AND active = 1").get(email) as { id: number } | undefined)?.id ?? null;
const month = todayLocal().slice(0, 7);
const lastMonth = (() => {
  const [y, m] = month.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
})();

const DEMO_CODE = "STAT26";
const DEMO_QUESTIONS: Record<string, [string, string][]> = {
  [DEMO_CODE]: [
    ["(Påhittad) Kommer det att finnas gamla tentor att öva på innan omtentan?", month],
    ["(Påhittad) Går det att få inspelningarna från föreläsning 3 och 4? Jag hann inte med derivatorna.", month],
    ["(Påhittad) Labben tog mycket längre tid än vad som stod i kursplanen.\n\nÄr det meningen?", lastMonth],
  ],
  ubu: [["(Påhittad) Rättningen av tentan i kursen tog över sex veckor. Vem kan man prata med om det?", month]],
};

db.transaction(() => {
  db.prepare("INSERT INTO settings (key, value) VALUES ('fragelada_oppen', '1') ON CONFLICT(key) DO UPDATE SET value = excluded.value").run();

  const scb = userId("scb@statlin.se") ?? userId("admin@statlin.se");
  if (!db.prepare("SELECT 1 FROM question_boxes WHERE code = ?").get(DEMO_CODE)) {
    db.prepare("INSERT INTO question_boxes (code, title, description, owner_id) VALUES (?, ?, ?, ?)").run(
      DEMO_CODE,
      "Regressionsanalys, demolåda",
      "Påhittad låda att prova med. Frågor om kursen, stora som små.",
      scb,
    );
  }
  db.prepare("UPDATE question_boxes SET owner_id = COALESCE(owner_id, ?) WHERE slug = 'ubu'").run(userId("ubu@statlin.se") ?? userId("admin@statlin.se"));
  db.prepare("UPDATE question_boxes SET owner_id = COALESCE(owner_id, ?) WHERE slug = 'amo'").run(userId("amo@statlin.se") ?? userId("admin@statlin.se"));

  const insert = db.prepare("INSERT INTO box_questions (id, box_id, body, month) VALUES (?, ?, ?, ?)");
  const exists = db.prepare("SELECT 1 FROM box_questions WHERE box_id = ? AND body = ?");
  for (const [key, questions] of Object.entries(DEMO_QUESTIONS)) {
    const box = db.prepare("SELECT id FROM question_boxes WHERE code = ? OR slug = ?").get(key, key) as { id: number };
    for (const [body, m] of questions) {
      if (!exists.get(box.id, body)) insert.run(crypto.randomInt(1, 2 ** 47), box.id, body, m);
    }
  }
})();

console.log(`Frågelådan är på i ${process.env.DATA_DIR ?? "data"}. Prova /fragelada?kod=${DEMO_CODE} och /fragelada/ubu.`);
