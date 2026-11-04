import type Database from "better-sqlite3";

/**
 * Gallrar revisionsloggen (SD-31): inloggningar och misslyckade inloggningar efter 90 dagar, övriga rader efter 24 månader – det
 * som integritetssidan (/integritet) lovar. Körs när databasen öppnas (getDb) och från audit() högst en gång per dygn, så att en
 * process som kör länge också gallrar; tidpunkten står i settings (audit_pruned_at). Ett fel loggas men stoppar aldrig sajten.
 */
export function pruneAuditLog(db: Database.Database, { onlyIfDue = false } = {}) {
  try {
    const recent = "SELECT 1 FROM settings WHERE key = 'audit_pruned_at' AND value > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day')";
    if (onlyIfDue && db.prepare(recent).get()) return;
    db.transaction(() => {
      db.prepare(
        "DELETE FROM audit_log WHERE action IN ('login', 'login_failed') AND created_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-90 days')",
      ).run();
      db.prepare("DELETE FROM audit_log WHERE created_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-24 months')").run();
      db.prepare(
        `INSERT INTO settings (key, value) VALUES ('audit_pruned_at', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      ).run();
    })();
  } catch (err) {
    console.error("[statlin] Gallringen av revisionsloggen misslyckades:", err);
  }
}
