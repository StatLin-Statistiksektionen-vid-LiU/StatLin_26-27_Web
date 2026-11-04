/**
 * Startskript i Docker-bilden. Molnvärdar (Fly.io m.fl.) monterar datavolymen
 * som root, så containern startar som root, ger appanvändaren äganderätt till DATA_DIR
 * och släpper sedan root-behörigheten innan webbservern startas.
 */
import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve(process.env.DATA_DIR ?? "/data");
const uid = Number(process.env.APP_UID ?? 1001);
const gid = Number(process.env.APP_GID ?? 1001);

/**
 * Ger appanvändaren äganderätt till allt under DATA_DIR (SD-18). Symlänkar hoppas över – de varken följs eller byter ägare – så att
 * en länk i volymen inte kan ge appanvändaren en fil utanför den (t.ex. /etc/passwd). lchown i stället för chown: byts en post mot
 * en symlänk mellan lstat och lchown ändras länken, inte målet. Bara poster med fel ägare ändras, men hela trädet gås alltid igenom.
 */
function chownTree(p) {
  const st = fs.lstatSync(p);
  if (st.isSymbolicLink()) return;
  if (st.uid !== uid || st.gid !== gid) fs.lchownSync(p, uid, gid);
  if (st.isDirectory()) for (const name of fs.readdirSync(p)) chownTree(path.join(p, name));
}

fs.mkdirSync(dataDir, { recursive: true });

if (process.getuid?.() === 0) {
  // DATA_DIR själv får vara en symlänk: den sätts av den som driftsätter, inte av appen.
  chownTree(fs.realpathSync(dataDir));
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
