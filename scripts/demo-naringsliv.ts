/**
 * Fyller STAR-sidan och önskelistan med påhittat innehåll, så att sidorna går att titta på innan riktiga företag finns.
 *
 *   DATA_DIR=<samma mapp som servern> npx tsx scripts/demo-naringsliv.ts
 *
 * Går att köra flera gånger: raderna känns igen på namnet och läggs inte till igen. Vägrar köra i produktion och körs aldrig av
 * seed eller start. Loggorna är enkla bilder som skriptet ritar själv.
 */
import sharp from "sharp";
import { getDb } from "../src/lib/db";
import { todayLocal } from "../src/lib/dates";
import { storeImage } from "../src/lib/media-store";

if (process.env.NODE_ENV === "production") {
  console.error("Demodatan är påhittad och får inte hamna i produktionen.");
  process.exit(1);
}

const COMPANIES = [
  { name: "Exempel AB", role: "huvudsponsor", seeks: "exjobb sommarjobb heltid", url: "https://example.com/exempel", logo: "#0b1530", description: "Påhittat företag som bygger prognoser åt påhittade kunder. Finns bara i testdatan." },
  { name: "Fiktiva Konsult", role: "sponsor", seeks: "trainee heltid", url: "https://example.com/fiktiva", logo: "#8f1d1d", description: "Konsulter inom dataanalys, på låtsas. Söker folk som gillar riktiga data." },
  { name: "Låtsasbanken", role: "sponsor", seeks: "exjobb trainee", url: "https://example.org/banken", logo: "#262626", description: "Kreditrisk och bedrägerimodeller i en bank som inte finns." },
  { name: "Testdata Analytics", role: "utstallare", seeks: "exjobb sommarjobb", url: "https://example.net/testdata", logo: null, description: "Hjälper påhittade företag att förstå sina påhittade kunder." },
  { name: "Påhittat Försäkring", role: "utstallare", seeks: "sommarjobb trainee heltid", url: "", logo: "#3d5bb8", description: "Aktuarier och statistiker. Ett exempel, inte ett riktigt företag." },
  { name: "Provföretaget i Linköping", role: "utstallare", seeks: "heltid", url: "https://example.org/prov", logo: null, description: "Maskininlärning i produktion, åtminstone i exemplet." },
  { name: "Modell & Son", role: "utstallare", seeks: "exjobb", url: "", logo: null, description: "Liten byrå med stora modeller. Påhittad." },
  { name: "Slumpvis Data", role: "utstallare", seeks: "sommarjobb", url: "https://example.com/slumpvis", logo: "#0a0a0a", description: "Experimentdesign och A/B-test, helt slumpmässigt påhittat." },
  { name: "Exempelkommunen", role: "utstallare", seeks: "exjobb heltid", url: "", logo: null, description: "Offentlig statistik i en kommun som inte finns på kartan." },
] as const;

const WISHES = [
  { title: "Hur blir man aktuarie? (exempel)", comment: "Påhittat önskemål: vad gör man egentligen om dagarna?", status: "onskad", votes: 34 },
  { title: "Maskininlärning i produktion hos Exempel AB", comment: "", status: "pa_gang", votes: 27 },
  { title: "Kausalitet i praktiken", comment: "Påhittat: när räcker det inte med regression?", status: "onskad", votes: 19 },
  { title: "Statistiker på en myndighet (exempel)", comment: "", status: "onskad", votes: 11 },
  { title: "Från regression till produktion", comment: "", status: "bokad", votes: 42, lunch: true },
  { title: "Så skriver du ett exjobb med ett företag", comment: "Exempel: hur hittar man rätt handledare?", status: "onskad", votes: 6 },
  { title: "Bayesianska metoder i industrin", comment: "", status: "genomford", votes: 23 },
  { title: "Nytt önskemål som väntar på granskning (exempel)", comment: "Syns bara i adminpanelen tills det är godkänt.", status: "ny", votes: 0 },
] as const;

async function logo(name: string, color: string): Promise<File> {
  const text = name.replace(/&/g, "&amp;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="300"><rect width="900" height="300" fill="#fff"/><circle cx="110" cy="150" r="70" fill="${color}"/><text x="210" y="178" font-family="Arial, sans-serif" font-size="74" font-weight="700" fill="${color}">${text}</text></svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new File([new Uint8Array(png)], `demo-${name.toLowerCase().replace(/[^a-z]+/g, "-")}.png`, { type: "image/png" });
}

async function main() {
  const db = getDb();
  let companies = 0;
  for (const [i, c] of COMPANIES.entries()) {
    if (db.prepare("SELECT 1 FROM star_companies WHERE name = ?").get(c.name)) continue;
    const media = c.logo ? await storeImage(await logo(c.name, c.logo), null, "") : null;
    db.prepare("INSERT INTO star_companies (name, url, logo_media_id, description, seeks, role, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      c.name,
      c.url,
      media?.id ?? null,
      c.description,
      c.seeks,
      c.role,
      (i + 1) * 10,
    );
    companies++;
  }
  let wishes = 0;
  const lunchEvent = db.prepare("SELECT id FROM events WHERE slug LIKE 'lunch%' ORDER BY starts_at LIMIT 1").get() as { id: number } | undefined;
  for (const w of WISHES) {
    if (db.prepare("SELECT 1 FROM lecture_wishes WHERE title = ?").get(w.title)) continue;
    db.prepare("INSERT INTO lecture_wishes (title, comment, status, votes, event_id, created_on) VALUES (?, ?, ?, ?, ?, ?)").run(
      w.title,
      w.comment,
      w.status,
      w.votes,
      "lunch" in w ? (lunchEvent?.id ?? null) : null,
      todayLocal(),
    );
    wishes++;
  }
  console.log(`Klart: ${companies} nya företag och ${wishes} nya önskemål.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
