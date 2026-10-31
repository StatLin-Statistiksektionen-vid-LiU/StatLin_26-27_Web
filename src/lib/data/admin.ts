import "server-only";
import { readDb } from "./db";
import { nowLocal } from "@/lib/dates";
import type { Role } from "@/lib/types";

export interface UserListItem {
  id: number;
  email: string;
  name: string;
  post: string;
  role: Role;
  committee_id: number | null;
  committee_name: string | null;
  active: number;
  must_change_password: number;
  design: number;
  last_login_at: string | null;
  created_at: string;
}

export async function listUsers(): Promise<UserListItem[]> {
  const db = await readDb();
  return db
    .prepare(
      `SELECT u.id, u.email, u.name, u.post, u.role, u.committee_id, c.short_name AS committee_name, u.active,
        u.must_change_password, u.design, u.last_login_at, u.created_at
       FROM users u LEFT JOIN committees c ON c.id = u.committee_id
       ORDER BY CASE u.role WHEN 'admin' THEN 0 WHEN 'editor' THEN 1 ELSE 2 END, u.name`,
    )
    .all() as UserListItem[];
}

export async function getUser(id: number): Promise<UserListItem | null> {
  const db = await readDb();
  return (
    (db
      .prepare(
        `SELECT u.id, u.email, u.name, u.post, u.role, u.committee_id, c.short_name AS committee_name, u.active,
          u.must_change_password, u.design, u.last_login_at, u.created_at
         FROM users u LEFT JOIN committees c ON c.id = u.committee_id WHERE u.id = ?`,
      )
      .get(id) as UserListItem) ?? null
  );
}

export interface AuditItem {
  id: number;
  action: string;
  entity: string;
  entity_id: string | null;
  summary: string;
  created_at: string;
  user_name: string | null;
  user_post: string | null;
}

export async function listAudit(limit = 12, userId?: number): Promise<AuditItem[]> {
  const db = await readDb();
  return db
    .prepare(
      `SELECT a.id, a.action, a.entity, a.entity_id, a.summary, a.created_at, u.name AS user_name, u.post AS user_post
       FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
       WHERE a.action != 'login' ${userId ? "AND a.user_id = @userId" : ""}
       ORDER BY a.id DESC LIMIT @limit`,
    )
    .all({ limit, userId: userId ?? null }) as AuditItem[];
}

export async function dashboardStats(committeeId: number | null) {
  const db = await readDb();
  const now = nowLocal();
  const where = committeeId ? "AND committee_id = @c" : "";
  const p = { now, c: committeeId };
  const one = (sql: string) => (db.prepare(sql).get(p) as { n: number }).n;
  return {
    upcoming: one(`SELECT COUNT(*) AS n FROM events WHERE published = 1 AND starts_at >= @now ${where}`),
    drafts: one(`SELECT COUNT(*) AS n FROM events WHERE published = 0 ${where}`) + one(`SELECT COUNT(*) AS n FROM news WHERE published = 0 ${where}`),
    images: one(`SELECT COUNT(*) AS n FROM event_images ei JOIN events e ON e.id = ei.event_id WHERE 1=1 ${committeeId ? "AND e.committee_id = @c" : ""}`),
    news: one(`SELECT COUNT(*) AS n FROM news WHERE published = 1 ${where}`),
  };
}

export async function sessionCount(userId: number): Promise<number> {
  const db = await readDb();
  return (db.prepare("SELECT COUNT(*) AS n FROM sessions WHERE user_id = ? AND expires_at > ?").get(userId, new Date().toISOString()) as { n: number }).n;
}
