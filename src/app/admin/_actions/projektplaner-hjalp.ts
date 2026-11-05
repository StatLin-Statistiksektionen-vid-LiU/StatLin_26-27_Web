import "server-only";
import { getDb } from "@/lib/db";

/**
 * Kontot som sköter en post eller ett utskott, eller null. Ansvarig är fri text, så här avgörs det först när ett uppdrag skapas.
 * Styrelsens konton går före utskottens, och finns flera konton i ett utskott blir uppdraget öppet: ingen ska få det av en slump.
 */
export function findResponsibleAccount(responsible: string): number | null {
  const wanted = responsible.trim();
  if (!wanted) return null;
  const db = getDb();
  const byPost = db.prepare("SELECT id FROM users WHERE active = 1 AND post = ? COLLATE NOCASE LIMIT 2").all(wanted) as { id: number }[];
  if (byPost.length === 1) return byPost[0].id;
  const byCommittee = db
    .prepare("SELECT u.id FROM users u JOIN committees c ON c.id = u.committee_id WHERE u.active = 1 AND c.short_name = ? COLLATE NOCASE LIMIT 2")
    .all(wanted) as { id: number }[];
  return byCommittee.length === 1 ? byCommittee[0].id : null;
}
