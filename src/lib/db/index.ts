import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { bootstrap } from "./bootstrap";
import { migrate } from "./migrations";
import { pruneAuditLog } from "./prune-audit-log";

/**
 * All data (databas + uppladdade filer) ligger i DATA_DIR så att en enda volym
 * räcker vid drift (Docker, VPS, volym hos Fly m.fl.).
 */
const DATA_DIR = path.resolve(process.env.DATA_DIR ?? path.join(/* turbopackIgnore: true */ process.cwd(), "data"));
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
/** Originalen till uppladdade bilder (SD-30). Ligger utanför UPLOADS_DIR, så /media/ kan aldrig servera dem. */
export const ORIGINALS_DIR = path.join(DATA_DIR, "originals");

declare global {
  var __statlinDb: Database.Database | undefined;
}

/** Högst så ofta frågar getDb() om revisionsloggen behöver gallras (SD-31) – ett sidbesök räcker för att sätta i gång den. */
const PRUNE_CHECK_MS = 60 * 60 * 1000;
let pruneCheckedAt = 0;

/**
 * Serverkomponenter läser via readDb() (src/lib/data/db.ts) eller efter cookies(), som getSession. better-sqlite3 är synkront, så ett
 * anrop direkt under förrenderingen skulle baka in byggets data i sidan – Date.now() nedan gör att bygget stoppar det i stället.
 */
export function getDb(): Database.Database {
  if (globalThis.__statlinDb) {
    // Den vanliga vägen kostar ett Date.now(). En gång i timmen tittar gallringen på sin tidsstämpel (en primärnyckelsuppslagning)
    // och gallrar om senaste gallringen är äldre än ett dygn – så att en process som kör länge också gallrar. Date.now() med avsikt, inte
    // performance.now(): Next räknar Date.now() som IO i förrenderingen (cacheComponents), så en serverkomponent som anropar getDb()
    // direkt under förrenderingen stoppar bygget med en stack hit – i stället för att tyst baka in byggets databas i sidan.
    if (Date.now() - pruneCheckedAt >= PRUNE_CHECK_MS) {
      pruneCheckedAt = Date.now();
      pruneAuditLog(globalThis.__statlinDb, { onlyIfDue: true });
    }
  } else {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    const db = new Database(path.join(DATA_DIR, "statlin.db"));
    try {
      db.pragma("journal_mode = WAL");
      db.pragma("foreign_keys = ON");
      db.pragma("busy_timeout = 5000");
      db.pragma("synchronous = NORMAL");
      migrate(db);
      bootstrap(db);
      pruneAuditLog(db);
      pruneCheckedAt = Date.now();
    } catch (err) {
      // Nästa begäran försöker igen med ett nytt handtag, så det här måste stängas – annars läcker varje försök filhandtag.
      db.close();
      throw err;
    }
    globalThis.__statlinDb = db;
  }
  return globalThis.__statlinDb;
}
