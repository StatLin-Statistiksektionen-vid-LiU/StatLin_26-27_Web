import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { bootstrap } from "./bootstrap";
import { migrate } from "./migrations";

/**
 * All data (databas + uppladdade filer) ligger i DATA_DIR så att en enda volym
 * räcker vid drift (Docker, VPS, Fly/Railway-volym).
 */
export const DATA_DIR = path.resolve(process.env.DATA_DIR ?? path.join(/* turbopackIgnore: true */ process.cwd(), "data"));
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

declare global {
  var __statlinDb: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (!globalThis.__statlinDb) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    const db = new Database(path.join(DATA_DIR, "statlin.db"));
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    db.pragma("busy_timeout = 5000");
    db.pragma("synchronous = NORMAL");
    migrate(db);
    bootstrap(db);
    globalThis.__statlinDb = db;
  }
  return globalThis.__statlinDb;
}
