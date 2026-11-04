"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { changedId, type FormState, formObject, formVersion, invalid, STALE, zOptionalId, zRequired, zText } from "@/lib/admin/form";
import { audit, nowIso } from "@/lib/admin/helpers";
import { canEditTask, canSeeTask, canUpdateTask } from "@/lib/auth/permissions";
import { actionUser, renewSessionIfDue } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { TASK_STATUSES, type TaskStatus } from "@/lib/types";

const forbidden: FormState = { error: "Du har inte behörighet att göra det här." };

type TaskRow = { id: number; title: string; from_user_id: number | null; to_user_id: number | null; shared: number; status: TaskStatus; assigned_at: string | null };

function loadTask(id: number): TaskRow | undefined {
  return getDb().prepare("SELECT id, title, from_user_id, to_user_id, shared, status, assigned_at FROM tasks WHERE id = ?").get(id) as TaskRow | undefined;
}

/** Uppdrag kan bara ges till aktiva konton. */
function recipientProblem(to: number | null): FormState | null {
  if (to === null || getDb().prepare("SELECT 1 FROM users WHERE id = ? AND active = 1").get(to)) return null;
  return { error: "Mottagaren finns inte längre.", fieldErrors: { to_user_id: "Välj en mottagare i listan." } };
}

/** Siffran i mottagarens meny tänds bara när någon annan ger uppdraget till hen. */
const assignedAt = (to: number | null, by: number) => (to !== null && to !== by ? nowIso() : null);

/** Tavlan, sidomenyns siffra och översikten ligger alla under /admin. */
const revalidateBoard = () => revalidatePath("/admin", "layout");

const taskSchema = z.object({
  id: zOptionalId,
  title: zRequired(140, "Rubriken"),
  description: zText(4000, "Beskrivningen"),
  to_user_id: zOptionalId,
  visibility: z.enum(["alla", "privat"]).default("alla"),
  due_date: z
    .string()
    .optional()
    .transform((v) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)),
  event_id: zOptionalId,
});

export async function saveTask(_prev: FormState, fd: FormData): Promise<FormState> {
  // Sessionen förlängs först när sparningen gått igenom (renewSessionIfDue nedan): kakan renderar om sidan.
  const user = await actionUser({ renew: false });
  if ("error" in user) return user;
  const parsed = taskSchema.safeParse(formObject(fd));
  if (!parsed.success) return invalid(parsed.error);
  const d = parsed.data;
  const db = getDb();

  if (d.event_id !== null && !db.prepare("SELECT 1 FROM events WHERE id = ?").get(d.event_id)) {
    return { error: "Evenemanget finns inte längre.", fieldErrors: { event_id: "Välj ett evenemang i listan." } };
  }
  const shared = d.visibility === "alla" ? 1 : 0;

  if (d.id) {
    const existing = loadTask(d.id);
    if (!existing || !canEditTask(user, existing)) return forbidden;
    // Mottagaren skrivs bara när fältet ändrats, och bara om uppdraget fortfarande har mottagaren som formuläret
    // laddades med – annars släppte en sparning ett uppdrag som någon tagit under tiden.
    const to = changedId(fd, "to_user_id", d.to_user_id, existing.to_user_id);
    if (to === undefined) return STALE;
    if (to !== existing.to_user_id) {
      const problem = recipientProblem(to);
      if (problem) return problem;
    }
    const assigned = existing.to_user_id === to ? existing.assigned_at : assignedAt(to, user.id);
    // Bara om uppdraget inte ändrats sedan formuläret laddades – annars skrev en gammal flik över en nyare version.
    const updatedAt = nowIso();
    const res = db
      .prepare(
        "UPDATE tasks SET title = ?, description = ?, to_user_id = ?, shared = ?, due_date = ?, event_id = ?, assigned_at = ?, updated_at = ? WHERE id = ? AND updated_at = ?",
      )
      .run(d.title, d.description, to, shared, d.due_date, d.event_id, assigned, updatedAt, d.id, formVersion(fd));
    if (res.changes === 0) return STALE;
    audit(user.id, "update", "task", d.id, d.title);
    await renewSessionIfDue();
    revalidateBoard();
    return { ok: true, message: "Uppdraget är sparat.", data: { updated_at: updatedAt } };
  }

  const problem = recipientProblem(d.to_user_id);
  if (problem) return problem;
  const res = db
    .prepare("INSERT INTO tasks (title, description, from_user_id, to_user_id, shared, due_date, event_id, assigned_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(d.title, d.description, user.id, d.to_user_id, shared, d.due_date, d.event_id, assignedAt(d.to_user_id, user.id));
  audit(user.id, "create", "task", Number(res.lastInsertRowid), d.title);
  await renewSessionIfDue();
  revalidateBoard();
  redirect(`/admin/uppdrag/${res.lastInsertRowid}?skapat=1`);
}

export async function setTaskStatus(fd: FormData) {
  const user = await actionUser();
  if ("error" in user) return;
  const id = Number(fd.get("id"));
  const status = String(fd.get("status")) as TaskStatus;
  const existing = loadTask(id);
  // Object.hasOwn och inte `in`: "constructor" och "toString" finns på alla objekt och hade räknats som giltiga statusar.
  if (!existing || !Object.hasOwn(TASK_STATUSES, status) || !canUpdateTask(user, existing)) redirect("/admin/uppdrag");
  if (existing.status === status) return;
  // updated_at skrivs inte: statusknapparna ligger på samma sida som uppdragets formulär, som inte skriver status eller
  // completed_at. Versionen tillhör formulärets egen sparning – annars laddades formuläret om och osparad text försvann (SD-06).
  getDb()
    .prepare("UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?")
    .run(status, status === "klar" ? nowIso() : null, id);
  audit(user.id, "status", "task", id, `${existing.title} → ${TASK_STATUSES[status]}`);
  revalidateBoard();
}

/** Öppna uppdrag (utan mottagare) kan vem som helst som ser dem ta. */
export async function claimTask(fd: FormData) {
  const user = await actionUser();
  if ("error" in user) return;
  const id = Number(fd.get("id"));
  const existing = loadTask(id);
  if (!existing || existing.to_user_id !== null || !canSeeTask(user, existing)) redirect("/admin/uppdrag");
  // updated_at skrivs inte: knappen ligger på samma sida som uppdragets formulär, som skriver mottagaren bara via changedId.
  // Versionen tillhör formulärets egen sparning – annars laddades formuläret om och osparad text försvann (SD-06).
  getDb()
    .prepare("UPDATE tasks SET to_user_id = ?, assigned_at = NULL, status = CASE status WHEN 'planerad' THEN 'pagar' ELSE status END WHERE id = ?")
    .run(user.id, id);
  audit(user.id, "claim", "task", id, existing.title);
  revalidateBoard();
}

export async function addTaskComment(_prev: FormState, fd: FormData): Promise<FormState> {
  const user = await actionUser();
  if ("error" in user) return user;
  const parsed = z.object({ task_id: zOptionalId, body: zRequired(2000, "Kommentaren") }).safeParse(formObject(fd));
  if (!parsed.success) return invalid(parsed.error);
  const existing = parsed.data.task_id ? loadTask(parsed.data.task_id) : undefined;
  if (!existing || !canSeeTask(user, existing)) return forbidden;
  const db = getDb();
  // Uppdragets updated_at skrivs inte: kommentarsfältet ligger på samma sida som uppdragets formulär, som inte rör
  // kommentarerna. Versionen tillhör formulärets egen sparning – annars laddades formuläret om och osparad text försvann (SD-06).
  db.prepare("INSERT INTO task_comments (task_id, user_id, body) VALUES (?, ?, ?)").run(existing.id, user.id, parsed.data.body);
  revalidateBoard();
  return { ok: true, message: "Kommentaren är skickad." };
}

export async function deleteTask(fd: FormData): Promise<FormState> {
  // Felsvaren visas i bekräftelsen, så sessionen förlängs först när raderingen gått igenom: en kaka i ett felsvar renderar om sidan.
  const user = await actionUser({ renew: false });
  if ("error" in user) return user;
  const id = Number(fd.get("id"));
  const existing = loadTask(id);
  if (!existing) return { error: "Uppdraget finns inte längre." };
  if (!canEditTask(user, existing)) return forbidden;
  getDb().prepare("DELETE FROM tasks WHERE id = ?").run(id);
  audit(user.id, "delete", "task", id, existing.title);
  await renewSessionIfDue();
  revalidateBoard();
  redirect("/admin/uppdrag?raderat=1");
}

/** Nollställer siffran i sidomenyn när tavlan öppnas. */
export async function markTasksSeen() {
  const user = await actionUser();
  if ("error" in user) return;
  getDb().prepare("UPDATE users SET tasks_seen_at = ? WHERE id = ?").run(nowIso(), user.id);
  revalidateBoard();
}
