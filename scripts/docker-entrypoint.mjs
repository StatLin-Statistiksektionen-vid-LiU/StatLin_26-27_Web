/**
 * Startskript i Docker-bilden. Molnvärdar (Railway, Fly.io m.fl.) monterar datavolymen
 * som root, så containern startar som root, ger appanvändaren äganderätt till DATA_DIR
 * och släpper sedan root-behörigheten innan webbservern startas.
 */
import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve(process.env.DATA_DIR ?? "/data");
const uid = Number(process.env.APP_UID ?? 1001);
const gid = Number(process.env.APP_GID ?? 1001);

function chownRecursive(dir) {
  fs.chownSync(dir, uid, gid);
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) chownRecursive(p);
    else fs.chownSync(p, uid, gid);
  }
}

fs.mkdirSync(dataDir, { recursive: true });

if (process.getuid?.() === 0) {
  chownRecursive(dataDir);
  // Ordningen spelar roll: tilläggsgrupperna (t.ex. root) måste bort innan gid/uid byts.
  process.setgroups([gid]);
  process.setgid(gid);
  process.setuid(uid);
}

// Kontrollera tidigt att datakatalogen går att skriva till – ger ett begripligt fel i loggen.
try {
  fs.accessSync(dataDir, fs.constants.W_OK);
} catch {
  console.error(`[statlin] Kan inte skriva till ${dataDir}. Kontrollera att volymen är monterad och skrivbar.`);
  process.exit(1);
}

await import(path.join(process.cwd(), "server.js"));
