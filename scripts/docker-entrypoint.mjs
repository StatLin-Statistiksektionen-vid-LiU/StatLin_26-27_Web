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

/**
 * Löser upp sökvägen p led för led från roten och följer bara symlänkar som root äger (SD-18). Varje led prövas med lstat. En
 * vanlig katalog eller fil går vi förbi. En root-ägd symlänk ersätts med sitt mål – ett absolut mål räknas från roten, ett relativt
 * från länkens katalog – följt av resten av vägen, och upplösningen börjar om från roten; högst 40 länkhopp sammanlagt. Ett led som
 * inte finns än räknas, liksom alla led efter det, som en vanlig katalog som mkdirSync sedan skapar. Andra fel från lstat kastas vidare.
 * @param {string} p absolut sökväg
 * @returns {string | null} den upplösta absoluta sökvägen, eller null om vägen går genom en symlänk som någon annan än root äger
 *   eller kräver fler än 40 länkhopp
 */
function resolveRootOwned(p) {
  let rest = p.split(path.sep).filter(Boolean);
  let resolved = path.sep;
  let hops = 0;
  while (rest.length > 0) {
    const next = path.join(resolved, rest[0]);
    let st;
    try {
      st = fs.lstatSync(next);
    } catch (err) {
      if (err.code === "ENOENT") return path.join(resolved, ...rest);
      throw err;
    }
    if (st.isSymbolicLink()) {
      if (st.uid !== 0 || ++hops > 40) return null;
      rest = path.resolve(path.dirname(next), fs.readlinkSync(next), ...rest.slice(1)).split(path.sep).filter(Boolean);
      resolved = path.sep;
    } else {
      resolved = next;
      rest = rest.slice(1);
    }
  }
  return resolved;
}

if (process.getuid?.() === 0) {
  // DATA_DIR och varje led i vägen dit får vara symlänkar bara om root äger dem – dem har den som driftsätter lagt i bilden. En länk
  // som någon annan äger stoppar starten, eftersom appanvändaren annars kunde få root att byta ägare på vad som helst vid nästa start.
  const resolved = resolveRootOwned(dataDir);
  if (resolved === null) {
    console.error(
      `[statlin] DATA_DIR ${dataDir} går genom en symlänk som inte ägs av root och följs inte (SD-18). Lägg länken som root, eller låt DATA_DIR peka direkt på katalogen.`,
    );
    process.exit(1);
  }
  fs.mkdirSync(resolved, { recursive: true });
  chownTree(resolved);
  // Ordningen spelar roll: tilläggsgrupperna (t.ex. root) måste bort innan gid/uid byts.
  process.setgroups([gid]);
  process.setgid(gid);
  process.setuid(uid);
} else {
  // Startad utan root (docker run --user): ingen ägare att byta, så katalogen skapas bara om den saknas.
  fs.mkdirSync(dataDir, { recursive: true });
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
