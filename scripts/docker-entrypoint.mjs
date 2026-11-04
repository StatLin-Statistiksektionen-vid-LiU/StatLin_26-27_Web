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
  // DATA_DIR själv får vara en symlänk, men bara en som root äger – den har den som driftsätter lagt dit. En länk som
  // appanvändaren äger (DATA_DIR i en katalog den kan skriva i) kan peka vart som helst och behandlas som alla andra symlänkar.
  const top = fs.lstatSync(dataDir);
  chownTree(top.isSymbolicLink() && top.uid !== 0 ? dataDir : fs.realpathSync(dataDir));
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

// Utan CLIENT_IP_HEADER kan inloggningsspärren inte skilja besökarna åt i produktionen (clientIp i src/lib/auth/rate-limit.ts, SD-23).
if (process.env.NODE_ENV === "production" && !process.env.CLIENT_IP_HEADER?.trim()) {
  console.warn(
    "[statlin] Varning: CLIENT_IP_HEADER är inte satt, så inloggningsspärren räknar alla besökare som en: 20 inloggningsförsök " +
      "på en kvart, från vem som helst, spärrar inloggningen för alla resten av kvarten. Sätt CLIENT_IP_HEADER till rubriken " +
      "med besökarens IP som värden eller proxyn framför sajten skriver – fly-client-ip på Fly.io, x-real-ip bakom nginx " +
      "(README → Miljövariabler).",
  );
}

await import(path.join(process.cwd(), "server.js"));
