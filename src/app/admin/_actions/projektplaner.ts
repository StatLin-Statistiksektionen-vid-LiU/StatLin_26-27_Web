"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type FormState, formObject, formVersion, invalid, STALE, zRequired, zText } from "@/lib/admin/form";
import { audit, forbidden, nowIso } from "@/lib/admin/helpers";
import { yearInRange } from "@/lib/arshjul";
import { canChangePlan } from "@/lib/auth/permissions";
import { actionUser, renewSessionIfDue } from "@/lib/auth/session";
import { todayLocal } from "@/lib/dates";
import { getDb } from "@/lib/db";
import { isValidDate, planTemplate } from "@/lib/projektplan-mallar";
import { findResponsibleAccount } from "./projektplaner-hjalp";

const revalidateAdmin = () => revalidatePath("/admin", "layout");

type PlanRow = { id: number; title: string; owner_user_id: number | null; responsible: string; template: string; updated_at: string };
const loadPlan = (id: number) => getDb().prepare("SELECT id, title, owner_user_id, responsible, template, updated_at FROM project_plans WHERE id = ?").get(id) as PlanRow | undefined;

const zDate = (label: string) => z.string().refine(isValidDate, `${label} måste vara ett giltigt datum.`);

const MAX_STEPS = 40;

const createSchema = z.object({
  title: zRequired(140, "Namnet"),
  template: z.string().refine((v) => !!planTemplate(v), "Välj en mall."),
  plan_date: zDate("Datumet"),
  responsible: zText(80, "Ansvarig"),
  goal: zText(2000, "Målet"),
  wheel_item_id: z
    .string()
    .optional()
    .transform((v) => (v && /^\d+$/.test(v) ? Number(v) : null)),
  year: z
    .string()
    .optional()
    .transform((v) => (v && /^\d{4}$/.test(v) ? Number(v) : null)),
});

export async function createPlan(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await actionUser({ renew: false });
  if ("error" in user) return user;
  const parsed = createSchema.safeParse(formObject(fd));
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;

  // Stegen kommer i ordning från förhandsvisningen, ett titelfält, ett datumfält och en beskrivning per steg.
  const titles = fd.getAll("step_title").map((v) => String(v).trim());
  const dues = fd.getAll("step_due").map(String);
  const descriptions = fd.getAll("step_description").map((v) => String(v).trim().slice(0, 2000));
  if (titles.length !== dues.length || titles.length !== descriptions.length) return { error: "Stegen kom inte fram rätt. Ladda om sidan och försök igen." };
  if (titles.length === 0) return { error: "Behåll minst ett steg, annars blir planen tom." };
  if (titles.length > MAX_STEPS) return { error: `En plan får ha högst ${MAX_STEPS} steg.` };
  if (titles.some((t) => !t || t.length > 140)) return { error: "Varje steg behöver en rubrik på högst 140 tecken." };
  if (dues.some((v) => !isValidDate(v))) return { error: "Varje steg behöver ett giltigt datum." };

  const db = getDb();
  const today = todayLocal();
  const year = d.year !== null && yearInRange(d.year, today) ? d.year : Number(d.plan_date.slice(0, 4));
  if (d.wheel_item_id !== null && !db.prepare("SELECT 1 FROM wheel_items WHERE id = ?").get(d.wheel_item_id)) {
    return { error: "Årshjulspunkten finns inte längre. Skapa planen från början i stället." };
  }

  // Ansvarig post får stegen. Hittas ingen får den som skapar planen dem, så att de inte ligger öppna utan att någon vet om det.
  const to = findResponsibleAccount(d.responsible) ?? user.id;
  const assigned = to !== user.id ? nowIso() : null;

  const planId = db.transaction(() => {
    if (d.wheel_item_id !== null) {
      const state = db.prepare("SELECT project_plan_id FROM wheel_item_state WHERE item_id = ? AND year = ?").get(d.wheel_item_id, year) as { project_plan_id: number | null } | undefined;
      if (state?.project_plan_id) return { existing: state.project_plan_id };
    }
    const res = db
      .prepare("INSERT INTO project_plans (title, template, plan_date, responsible, goal, owner_user_id, wheel_item_id) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(d.title, d.template, d.plan_date, d.responsible, d.goal, user.id, d.wheel_item_id);
    const id = Number(res.lastInsertRowid);
    const insertTask = db.prepare("INSERT INTO tasks (title, description, from_user_id, to_user_id, shared, due_date, assigned_at, project_plan_id) VALUES (?, ?, ?, ?, 1, ?, ?, ?)");
    titles.forEach((title, i) => insertTask.run(title, descriptions[i], user.id, to, dues[i], assigned, id));
    if (d.wheel_item_id !== null) {
      db.prepare(
        `INSERT INTO wheel_item_state (item_id, year, status, project_plan_id, updated_at) VALUES (@itemId, @year, 'planerad', @id, @now)
         ON CONFLICT(item_id, year) DO UPDATE SET status = 'planerad', project_plan_id = @id, updated_at = @now`,
      ).run({ itemId: d.wheel_item_id, year, id, now: nowIso() });
    }
    return { created: id };
  })();
  if ("existing" in planId) redirect(`/admin/projektplaner/${planId.existing}`);
  audit(user.id, "create", "project_plan", planId.created, d.title);
  await renewSessionIfDue();
  revalidateAdmin();
  redirect(`/admin/projektplaner/${planId.created}?skapad=1`);
}

const planSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
  title: zRequired(140, "Namnet"),
  plan_date: zDate("Datumet"),
  responsible: zText(80, "Ansvarig"),
  goal: zText(4000, "Målet"),
  budget: zText(4000, "Budgeten"),
  lessons: zText(8000, "Lärdomarna"),
});

export async function savePlan(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await actionUser({ renew: false });
  if ("error" in user) return user;
  const parsed = planSchema.safeParse(formObject(fd));
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;
  const existing = loadPlan(d.id);
  if (!existing) return { error: "Planen finns inte längre." };
  if (!canChangePlan(user, existing)) return forbidden();
  const updatedAt = nowIso();
  // Stegen flyttas inte med datumet: någon kan redan ha bokat efter dem. Det står vid fältet.
  const res = getDb()
    .prepare("UPDATE project_plans SET title = ?, plan_date = ?, responsible = ?, goal = ?, budget = ?, lessons = ?, updated_at = ? WHERE id = ? AND updated_at = ?")
    .run(d.title, d.plan_date, d.responsible, d.goal, d.budget, d.lessons, updatedAt, d.id, formVersion(fd));
  if (res.changes === 0) return STALE;
  audit(user.id, "update", "project_plan", d.id, d.title);
  await renewSessionIfDue();
  revalidateAdmin();
  return { ok: true, message: "Planen är sparad.", data: { updated_at: updatedAt } };
}

const stepSchema = z.object({
  plan_id: z.string().regex(/^\d+$/).transform(Number),
  title: zRequired(140, "Rubriken"),
  due_date: zDate("Datumet"),
});

export async function addPlanStep(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await actionUser({ renew: false });
  if ("error" in user) return user;
  const parsed = stepSchema.safeParse(formObject(fd));
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;
  const plan = loadPlan(d.plan_id);
  if (!plan) return { error: "Planen finns inte längre." };
  if (!canChangePlan(user, plan)) return forbidden();
  const to = findResponsibleAccount(plan.responsible) ?? user.id;
  const res = getDb()
    .prepare("INSERT INTO tasks (title, from_user_id, to_user_id, shared, due_date, assigned_at, project_plan_id) VALUES (?, ?, ?, 1, ?, ?, ?)")
    .run(d.title, user.id, to, d.due_date, to !== user.id ? nowIso() : null, plan.id);
  audit(user.id, "create", "task", Number(res.lastInsertRowid), `${d.title} (${plan.title})`);
  await renewSessionIfDue();
  revalidateAdmin();
  return { ok: true, message: "Steget ligger på tavlan." };
}

export async function deletePlan(fd: FormData): Promise<FormState> {
  const user = await actionUser({ renew: false });
  if ("error" in user) return user;
  const id = Number(fd.get("id"));
  const existing = loadPlan(id);
  if (!existing) return { error: "Planen finns inte längre." };
  if (!canChangePlan(user, existing)) return forbidden();
  // Uppdragen står kvar på tavlan utan plan (ON DELETE SET NULL), och årshjulspunkten blir öppen igen om inget annat är planerat.
  getDb().prepare("DELETE FROM project_plans WHERE id = ?").run(id);
  audit(user.id, "delete", "project_plan", id, existing.title);
  await renewSessionIfDue();
  revalidateAdmin();
  redirect("/admin/projektplaner?raderad=1");
}
