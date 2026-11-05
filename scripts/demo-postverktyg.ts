/**
 * Exempeldata för årshjulet och projektplanerna, för att prova lokalt. Allt är påhittat och planerna heter "(exempel)".
 *
 *   npx tsx scripts/demo-postverktyg.ts
 *
 * Går att köra flera gånger utan att något läggs in två gånger. Vägrar i produktion och körs aldrig av seed eller start.
 */
import { addDaysLocal, todayLocal } from "../src/lib/dates";
import { getDb } from "../src/lib/db";
import { termOfMonth } from "../src/lib/arshjul";
import { WHEEL_SUGGESTIONS } from "../src/lib/arshjul-forslag";
import { planTemplate, stepDate } from "../src/lib/projektplan-mallar";

if (process.env.NODE_ENV === "production") {
  console.error("Exempeldata för årshjulet läggs inte in i produktion.");
  process.exit(1);
}

const db = getDb();
const today = todayLocal();
const year = Number(today.slice(0, 4));

const admin = db.prepare("SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1").get() as { id: number } | undefined;
if (!admin) {
  console.error("Hittar inget administratörskonto. Kör npm run seed först.");
  process.exit(1);
}

const insertItem = db.prepare(
  "INSERT OR IGNORE INTO wheel_items (title, description, responsible, month, term, depends_on, template, seed_key) VALUES (@title, @description, @responsible, @month, @term, @depends_on, @template, @seed_key)",
);
const itemId = (key: string) => (db.prepare("SELECT id FROM wheel_items WHERE seed_key = ?").get(key) as { id: number }).id;
const setState = (key: string, status: string, taskId: number | null = null, planId: number | null = null, stateYear = year) =>
  db
    .prepare(
      `INSERT INTO wheel_item_state (item_id, year, status, task_id, project_plan_id) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(item_id, year) DO UPDATE SET status = excluded.status, task_id = excluded.task_id, project_plan_id = excluded.project_plan_id`,
    )
    .run(itemId(key), stateYear, status, taskId, planId);

/** Skapar planen med mallens steg om den inte redan finns. De första `done` stegen är klara. */
function plan(o: { title: string; template: string; date: string; responsible: string; key: string; goal: string; budget?: string; lessons?: string; done: number; year: number }) {
  if (db.prepare("SELECT 1 FROM project_plans WHERE title = ?").get(o.title)) return;
  const template = planTemplate(o.template);
  if (!template) throw new Error(`Mallen ${o.template} finns inte`);
  const id = Number(
    db
      .prepare("INSERT INTO project_plans (title, template, plan_date, responsible, goal, budget, lessons, owner_user_id, wheel_item_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(o.title, o.template, o.date, o.responsible, o.goal, o.budget ?? "", o.lessons ?? "", admin!.id, itemId(o.key)).lastInsertRowid,
  );
  const insertTask = db.prepare("INSERT INTO tasks (title, description, from_user_id, to_user_id, status, shared, due_date, completed_at, project_plan_id) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)");
  template.steps.forEach((s, i) => {
    const done = i < o.done;
    const due = stepDate(o.date, s.weeks);
    insertTask.run(s.title, s.description, admin!.id, admin!.id, done ? "klar" : "planerad", due, done ? `${due}T12:00:00.000Z` : null, id);
  });
  setState(o.key, "planerad", null, id, o.year);
}

db.transaction(() => {
  for (const s of WHEEL_SUGGESTIONS) insertItem.run({ ...s, term: s.month !== null ? termOfMonth(s.month) : s.term });

  plan({
    title: `Julsittning ${year - 1} (exempel)`,
    template: "sittning",
    date: `${year - 1}-12-05`,
    responsible: "SCB",
    key: "julsittning",
    goal: "Sittning för 80 personer som går jämnt ut.",
    budget: "Budget 24 000 kr, utfall 23 150 kr.",
    lessons: "Boka lokalen före sommaren, Kårallen var nästan full redan i september.\nBiljetterna tog slut på två dagar, så vi hade kunnat ta tio fler platser.",
    done: 20,
    year: year - 1,
  });
  plan({
    title: `Gästföreläsning på hösten ${year} (exempel)`,
    template: "gastforelasning",
    date: addDaysLocal(today, 28).slice(0, 10),
    responsible: "UBU",
    key: "gast-ht",
    goal: "En alumn berättar om statistik i arbetslivet för minst 40 studenter.",
    done: 2,
    year,
  });
  setState("mottagning", "klar");
  setState("hostmote", "klar");
  setState("kursutvardering-ht", "hoppad");
})();

console.log("Klart: hjulet är fyllt och två exempelplaner finns under Projektplaner.");
