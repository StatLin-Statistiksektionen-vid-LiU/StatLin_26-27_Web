import "server-only";
import type { WheelItem, WheelState } from "@/lib/arshjul";
import type { SessionUser } from "@/lib/types";
import { canSeeTask } from "@/lib/auth/permissions";
import { readDb } from "./db";

export async function listWheelItems(): Promise<WheelItem[]> {
  const db = await readDb();
  return db.prepare("SELECT * FROM wheel_items ORDER BY month IS NULL, month, title").all() as WheelItem[];
}

export async function getWheelItem(id: number): Promise<WheelItem | null> {
  const db = await readDb();
  return (db.prepare("SELECT * FROM wheel_items WHERE id = ?").get(id) as WheelItem | undefined) ?? null;
}

/** Läget för punkterna under de givna åren. Svarar med en funktion, eftersom korten i december läser två år. */
export async function wheelStates(years: number[]): Promise<(itemId: number, year: number) => WheelState | undefined> {
  const db = await readDb();
  const rows = db
    .prepare(
      `SELECT s.item_id, s.year, s.status, s.task_id, s.project_plan_id, t.status AS task_status
       FROM wheel_item_state s LEFT JOIN tasks t ON t.id = s.task_id
       WHERE s.year IN (${years.map(() => "?").join(",")})`,
    )
    .all(...years) as WheelState[];
  const map = new Map(rows.map((r) => [`${r.item_id}:${r.year}`, r]));
  return (itemId, year) => map.get(`${itemId}:${year}`);
}

/** Posterna och utskotten som förslag i fältet Ansvarig. Fältet är fritt, eftersom konton byts men posten finns kvar. */
export async function listResponsibleOptions(): Promise<string[]> {
  const db = await readDb();
  const rows = db
    .prepare(
      `SELECT post AS name FROM users WHERE active = 1 AND post != ''
       UNION SELECT post FROM board_members WHERE post != ''
       UNION SELECT short_name FROM committees WHERE kind != 'styrelse'
       ORDER BY name`,
    )
    .all() as { name: string }[];
  return rows.map((r) => r.name);
}

export interface ProjectPlan {
  id: number;
  title: string;
  template: string;
  plan_date: string;
  responsible: string;
  goal: string;
  budget: string;
  lessons: string;
  owner_user_id: number | null;
  wheel_item_id: number | null;
  created_at: string;
  updated_at: string;
  total: number;
  done: number;
}

const PLAN_SELECT = `
  SELECT p.*,
    (SELECT COUNT(*) FROM plan_steps s WHERE s.plan_id = p.id) AS total,
    (SELECT COUNT(*) FROM plan_steps s LEFT JOIN tasks t ON t.id = s.task_id WHERE s.plan_id = p.id AND (s.done = 1 OR t.status = 'klar')) AS done
  FROM project_plans p`;

export async function listProjectPlans(): Promise<ProjectPlan[]> {
  const db = await readDb();
  return db.prepare(`${PLAN_SELECT} ORDER BY p.plan_date DESC, p.id DESC`).all() as ProjectPlan[];
}

export async function getProjectPlan(id: number): Promise<ProjectPlan | null> {
  const db = await readDb();
  return (db.prepare(`${PLAN_SELECT} WHERE p.id = ?`).get(id) as ProjectPlan | undefined) ?? null;
}

/** Ett steg i en plan. Är det skickat till tavlan kommer rubrik, datum och status från uppdraget. */
export interface PlanStep {
  id: number;
  task_id: number | null;
  title: string;
  description: string;
  due_date: string | null;
  status: string | null;
  done: boolean;
  label: string | null;
  open: boolean;
  hidden: boolean;
}

export async function listPlanSteps(planId: number, user: SessionUser): Promise<PlanStep[]> {
  const db = await readDb();
  const rows = db
    .prepare(
      `SELECT s.id, s.task_id, s.done, COALESCE(t.title, s.title) AS title, COALESCE(t.description, s.description) AS description, COALESCE(t.due_date, s.due_date) AS due_date,
         t.status, t.from_user_id, t.to_user_id, t.shared, COALESCE(NULLIF(u.post, ''), u.name) AS label
       FROM plan_steps s
       LEFT JOIN tasks t ON t.id = s.task_id
       LEFT JOIN users u ON u.id = t.to_user_id
       WHERE s.plan_id = ?
       ORDER BY COALESCE(t.due_date, s.due_date) IS NULL, COALESCE(t.due_date, s.due_date), s.id`,
    )
    .all(planId) as {
    id: number;
    task_id: number | null;
    done: number;
    title: string;
    description: string;
    due_date: string | null;
    status: string | null;
    from_user_id: number | null;
    to_user_id: number | null;
    shared: number;
    label: string | null;
  }[];
  return rows.map((r) => ({
    id: r.id,
    task_id: r.task_id,
    title: r.title,
    description: r.description,
    due_date: r.due_date,
    status: r.status,
    done: r.done === 1 || r.status === "klar",
    label: r.label,
    open: r.task_id !== null && r.to_user_id === null,
    hidden: r.task_id !== null && !canSeeTask(user, r),
  }));
}

export interface PlanLessons {
  id: number;
  title: string;
  plan_date: string;
  lessons: string;
}

/** Lärdomarna från tidigare planer från samma årshjulspunkt, senaste först. */
export async function listLessons(wheelItemId: number, excludePlanId?: number): Promise<PlanLessons[]> {
  const db = await readDb();
  return db
    .prepare(
      `SELECT id, title, plan_date, lessons FROM project_plans
       WHERE wheel_item_id = ? AND lessons != '' AND id != ?
       ORDER BY plan_date DESC LIMIT 3`,
    )
    .all(wheelItemId, excludePlanId ?? -1) as PlanLessons[];
}
