/**
 * Fyller databasen med grunddata (utskott, poster, sidtexter, inställningar).
 *
 *   npm run seed            → grunddata + första admin
 *   npm run seed -- --demo  → även exempelevenemang, exempelnyheter och demokonton
 *
 * Skriptet är idempotent för grunddata: befintligt innehåll skrivs inte över.
 */
import sharp from "sharp";
import { getDb } from "../src/lib/db";
import { hashPassword, generatePassword } from "../src/lib/auth/password";
import { storeImage } from "../src/lib/media-store";
import { addDaysLocal, nowLocal } from "../src/lib/dates";
import type { ExamOccasion, ExamStats } from "../src/lib/exam-stats";
import { mulberry32 } from "../src/lib/utils";

const demo = process.argv.includes("--demo");
const db = getDb();

function committeeId(slug: string): number {
  return (db.prepare("SELECT id FROM committees WHERE slug = ?").get(slug) as { id: number }).id;
}

async function main() {
  // Grunddata (utskott, poster, sidtexter, styrdokument) läggs in av bootstrap() när getDb() öppnar databasen.

  /* ---- Första admin ---- */
  const userCount = (db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n;
  const created: { email: string; password: string; role: string }[] = [];
  if (userCount === 0) {
    const email = process.env.ADMIN_EMAIL ?? "admin@statlin.se";
    const password = process.env.ADMIN_PASSWORD ?? generatePassword();
    db.prepare(
      `INSERT INTO users (email, name, post, role, committee_id, password_hash, must_change_password)
       VALUES (?, ?, ?, 'admin', ?, ?, ?)`,
    ).run(email, "Webbansvarig", "Administratör", committeeId("styrelsen"), await hashPassword(password), process.env.ADMIN_PASSWORD ? 0 : 1);
    created.push({ email, password, role: "admin" });
  }

  if (demo) await seedDemo(created);

  console.log("\n✓ Databasen är klar.");
  if (created.length) {
    console.log("\nKonton som skapades (spara lösenorden – de visas bara nu):");
    for (const c of created) console.log(`  ${c.role.padEnd(10)} ${c.email.padEnd(26)} ${c.password}`);
  }
  console.log("");
}

async function seedDemo(created: { email: string; password: string; role: string }[]) {
  const existing = (db.prepare("SELECT COUNT(*) AS n FROM events").get() as { n: number }).n;
  if (existing > 0) {
    console.log("Demodata finns redan – hoppar över.");
    return;
  }

  const demoUsers = [
    { email: "info@statlin.se", name: "Namn Efternamn", post: "Informationsansvarig", role: "editor", committee: "styrelsen" },
    { email: "scb@statlin.se", name: "Namn Efternamn", post: "Ordförande SCB", role: "committee", committee: "scb" },
    { email: "ubu@statlin.se", name: "Namn Efternamn", post: "Utbildningsansvarig", role: "committee", committee: "ubu" },
    { email: "grafiskt@statlin.se", name: "Namn Efternamn", post: "Grafiskt ansvarig", role: "committee", committee: "styrelsen", design: 1 },
  ];
  for (const u of demoUsers) {
    const exists = db.prepare("SELECT 1 FROM users WHERE email = ?").get(u.email);
    if (exists) continue;
    const password = process.env.DEMO_PASSWORD ?? generatePassword();
    db.prepare(
      `INSERT INTO users (email, name, post, role, committee_id, design, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(u.email, u.name, u.post, u.role, committeeId(u.committee), u.design ?? 0, await hashPassword(password));
    created.push({ email: u.email, password, role: u.role });
  }
  const adminId = (db.prepare("SELECT id FROM users WHERE role = 'admin' ORDER BY id LIMIT 1").get() as { id: number }).id;

  const today = nowLocal().slice(0, 10);
  const at = (days: number, time: string) => addDaysLocal(`${today}T${time}`, days);

  const events = [
    { slug: "pubkvall-halloween", title: "Pubkväll: Halloween-edition", committee: "statpub", start: at(3, "18:00"), end: at(4, "01:00"), location: "Kårallen, Campus Valla", price: "Gratis inträde",
      summary: "Klä ut dig, ta med kursarna och häng med på höstens läskigaste pub.",
      body: "StatPub bjuder in till temapub! Bästa utklädnaden vinner pris, och det finns både alkoholfritt och snacks.\n\n**Tips:** Kom tidigt – de bästa borden går fort." },
    { slug: "hostsittning", title: "Höstsittning med SCB", committee: "scb", start: at(6, "18:00"), end: at(7, "01:00"), location: "Kårallen, Campus Valla", price: "295 kr", signup: "https://forms.gle/",
      summary: "Trerätters, sånger och tal. Klädkod: kavaj.",
      body: "Mästeriet dukar upp för höstens finaste sittning. Sångboken delas ut på plats.\n\n- Klädkod: kavaj\n- Specialkost anges vid anmälan\n- Alkoholfritt paket finns" },
    { slug: "lunchforelasning-data-science", title: "Lunchföreläsning: Från regression till produktion", committee: "sasu", start: at(9, "12:15"), end: at(9, "13:00"), location: "B-huset, Campus Valla", price: "Lunch ingår",
      summary: "Hur ser vardagen ut för en data scientist? Lunch ingår för de första 40.",
      body: "SASU bjuder in en företagspartner som berättar om hur statistiska modeller tar sig från notebook till produktion – och vad de letar efter hos nyexaminerade." },
    { slug: "lan-kvall", title: "LAN-kväll", committee: "estig", start: at(12, "18:00"), end: at(13, "02:00"), location: "Campus Valla", price: "Gratis",
      summary: "Ta med datorn – eSTIG fixar nätverk, el och turneringsschema.",
      body: "Turneringar, sällskapsspel och pizza. Nybörjare och veteraner är lika välkomna." },
    { slug: "innebandy", title: "Innebandy med STIG", committee: "stig", start: at(15, "17:30"), end: at(15, "19:00"), location: "Campushallen", price: "Gratis",
      summary: "Klubbor finns att låna. Inga förkunskaper krävs.",
      body: "Vi delar upp oss i blandade lag och kör så länge orken räcker." },
    { slug: "kursutvarderingsfika", title: "Kursutvärderingsfika", committee: "ubu", start: at(20, "12:00"), end: at(20, "13:00"), location: "Campus Valla", price: "Fika bjuds",
      summary: "Tyck till om höstens kurser – UBU bjuder på fika.",
      body: "Era synpunkter går vidare till programråd och kursansvariga. Anonymt, enkelt och med kanelbulle." },
    { slug: "star", title: "STAR – StatLins Arbetsmarknadsdag", committee: "sasu", start: at(34, "10:00"), end: at(34, "16:00"), location: "Campus Valla", price: "Gratis",
      summary: "Sektionens största arbetsmarknadsdag. Träffa företag, hitta exjobb och sommarjobb.",
      body: "STAR samlar arbetsgivare som letar efter statistiker, analytiker och data scientists.\n\n## Program\n- **10.00** Mässan öppnar\n- **12.15** Lunchpanel: Karriärvägar efter statistikexamen\n- **14.00** CV-granskning\n- **16.00** Mingel" },
    { slug: "julsittning", title: "Julsittning", committee: "scb", start: at(45, "18:00"), end: at(46, "01:00"), location: "Kårallen, Campus Valla", price: "325 kr", signup: "https://forms.gle/",
      summary: "Terminens sista sittning – med julbord, tomtar och snapsvisor.",
      body: "Avsluta terminen med stil. Anmälan öppnar två veckor innan." },
    { slug: "hostmote", title: "Höstmöte", committee: "styrelsen", start: at(60, "17:15"), end: at(60, "19:00"), location: "Campus Valla", price: "",
      summary: "Sektionsmöte med budget, verksamhetsplan och val.",
      body: "Alla medlemmar har rösträtt. Handlingar publiceras under **Dokument** en vecka innan mötet." },
    { slug: "valkomstpub", title: "Välkomstpub", committee: "statpub", start: at(-50, "18:00"), end: at(-49, "00:00"), location: "Kårallen, Campus Valla", price: "",
      summary: "Terminsstartens första pub.", body: "Tack alla som kom!" },
    { slug: "mottagningsgasque", title: "Mottagningsgasque", committee: "scb", start: at(-38, "18:00"), end: at(-37, "01:00"), location: "Kårallen, Campus Valla", price: "",
      summary: "Mottagningens höjdpunkt – bilder från kvällen finns i galleriet.", body: "En magisk kväll med sång, tal och dans. Bilderna här är exempelbilder." },
    { slug: "fotbollsturnering", title: "Fotbollsturnering", committee: "stig", start: at(-21, "13:00"), end: at(-21, "17:00"), location: "Campus Valla", price: "",
      summary: "Sektionsfotboll i strålande höstsol.", body: "Grattis till vinnarlaget!" },
  ];

  // Exemplen skapas av administratören och räknas därför som granskade, precis som i adminpanelen.
  const insertEvent = db.prepare(
    `INSERT INTO events (slug, title, summary, body_md, starts_at, ends_at, location, committee_id, signup_url, price, created_by, checked_at, checked_by)
     VALUES (@slug, @title, @summary, @body, @start, @end, @location, @committee_id, @signup, @price, @created_by,
       strftime('%Y-%m-%dT%H:%M:%fZ','now'), @created_by)`,
  );
  for (const e of events) {
    insertEvent.run({ ...e, signup: e.signup ?? "", committee_id: committeeId(e.committee), created_by: adminId });
  }

  // Exempelgalleri: generativ grafik i StatLins färger, så att galleri och lightbox syns i demot.
  const gasqueId = (db.prepare("SELECT id FROM events WHERE slug = 'mottagningsgasque'").get() as { id: number }).id;
  const insertImage = db.prepare(
    `INSERT INTO event_images (event_id, media_id, caption, sort_order, uploaded_by) VALUES (?, ?, ?, ?, ?)`,
  );
  for (let i = 0; i < 7; i++) {
    const png = await sharp(Buffer.from(demoArt(i))).png().toBuffer();
    const media = await storeImage(new File([new Uint8Array(png)], `exempelbild-${i + 1}.png`, { type: "image/png" }), adminId, `Exempelbild ${i + 1}`);
    insertImage.run(gasqueId, media.id, `Exempelbild ${i + 1}`, i, adminId);
    if (i === 0) db.prepare("UPDATE events SET cover_media_id = ? WHERE id = ?").run(media.id, gasqueId);
  }

  // Påhittad tentastatistik för en av våra kurser och en annan LiU-kurs, så att diagrammen syns i demot
  // och e2e-testet fungerar utan att källan behöver nås. Kodlistan är de koder sajten tror att källan har.
  const insertStats = db.prepare("INSERT OR REPLACE INTO exam_stats (course_code, data, fetched_at) VALUES (?, ?, ?)");
  const demoStats = [
    demoExamStats({ code: "732G33", sv: "Programmering i R", en: "Programming in R", module: "DAT1", grades: ["U", "G", "VG"], pass: 0.55, seed: 1 }),
    demoExamStats({ code: "TATA24", sv: "Linjär algebra", en: "Linear Algebra", module: "TEN1", grades: ["U", "3", "4", "5"], pass: 0.6, seed: 2 }),
  ];
  for (const stats of demoStats) insertStats.run(stats.code, JSON.stringify(stats), new Date().toISOString());
  const setSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value");
  setSetting.run("exam_stats_codes", JSON.stringify(demoStats.map((s) => s.code)));
  setSetting.run("exam_stats_codes_at", new Date().toISOString());

  const news = [
    { slug: "valkommen-till-nya-statlin-se", title: "Välkommen till nya statlin.se", committee: "styrelsen", pinned: 1, days: 0,
      excerpt: "Ny webb med kalender, galleri och inloggning för sektionens poster.",
      body: "Sektionen har fått en ny hemsida! Här hittar du alla evenemang, nyheter, styrelsen och utskotten – och du kan prenumerera på kalendern direkt i mobilen.\n\n## Nytt för poster\nAlla poster kan logga in och lägga upp evenemang, nyheter och bilder för sitt utskott. Informationsansvarig och styrelsen kan redigera allt innehåll.\n\nHittar du något som är fel? Hör av dig till info@statlin.se." },
    { slug: "star-anmalan-foretag", title: "STAR: anmälan för företag är öppen", committee: "sasu", pinned: 0, days: -3,
      excerpt: "Vill ditt företag träffa Linköpings statistikstudenter? Nu kan ni boka plats.",
      body: "SASU och SCB:s sponsoransvariga öppnar nu anmälan för årets STAR. Läs mer under **För företag** eller kontakta näringslivsansvarig." },
    { slug: "kursutvarderingar", title: "Kursutvärderingar: så påverkar du din utbildning", committee: "ubu", pinned: 0, days: -8,
      excerpt: "Fem minuter av din tid gör skillnad för nästa årskurs.",
      body: "Kursutvärderingarna är det viktigaste verktyget vi har för att förbättra kurserna. UBU går igenom resultaten tillsammans med kursansvariga varje termin.\n\n> Det du skriver läses – och leder till förändring." },
    { slug: "hostens-sittningar", title: "Höstens sittningar är spikade", committee: "scb", pinned: 0, days: -12,
      excerpt: "Höstsittning och julsittning – boka in datumen redan nu.",
      body: "Mästeriet har satt datumen för terminens sittningar. Anmälan öppnar två veckor innan respektive sittning. Se **Evenemang** för detaljer." },
  ];
  const insertNews = db.prepare(
    `INSERT INTO news (slug, title, excerpt, body_md, committee_id, pinned, published_at, author_id)
     VALUES (@slug, @title, @excerpt, @body, @committee_id, @pinned, @published_at, @author_id)`,
  );
  for (const n of news) {
    insertNews.run({
      ...n,
      committee_id: committeeId(n.committee),
      published_at: new Date(Date.now() + n.days * 86_400_000).toISOString(),
      author_id: adminId,
    });
  }
}

/** Fyra tentatillfällen om året de senaste åren: två ordinarie med många skrivande och två omtentor. */
function demoExamStats(o: { code: string; sv: string; en: string; module: string; grades: string[]; pass: number; seed: number }): ExamStats {
  const rnd = mulberry32(o.seed * 104729 + 7);
  const today = nowLocal().slice(0, 10);
  const year = Number(today.slice(0, 4));
  const [fail, ...passes] = o.grades;
  const occasions: ExamOccasion[] = [];
  for (let y = year - 3; y <= year; y++) {
    for (const [monthDay, size] of [["01-12", 22], ["06-02", 90], ["08-20", 18], ["10-29", 70]] as const) {
      const date = `${y}-${monthDay}`;
      if (date >= today) continue;
      const total = Math.round(size * (0.7 + rnd() * 0.6));
      const passed = Math.round(total * Math.min(0.95, Math.max(0.1, o.pass + (rnd() - 0.5) * 0.35)));
      // Fler av de lägre godkända betygen än av det högsta.
      const weights = passes.map((_, i) => passes.length - i * 0.6 + rnd());
      const sum = weights.reduce((a, b) => a + b, 0);
      const counts = weights.map((w) => Math.floor((passed * w) / sum));
      counts[0] += passed - counts.reduce((a, b) => a + b, 0);
      occasions.push({
        date,
        total,
        passed,
        grades: [{ grade: fail, count: total - passed }, ...passes.map((grade, i) => ({ grade, count: counts[i] }))],
      });
    }
  }
  occasions.sort((a, b) => b.date.localeCompare(a.date));
  return { code: o.code, title: { sv: o.sv, en: o.en }, modules: [{ code: o.module, title: "Tentamen", occasions }], sourceUpdatedAt: null };
}

/** Abstrakt "datakonst": spridningsdiagram, kurvor och rutnät i rött/svart/vitt. */
function demoArt(seed: number): string {
  const rnd = mulberry32(seed * 7919 + 13);
  const W = 1600;
  const H = 1067;
  const dark = seed % 3 !== 1;
  const bg = dark ? "#0a0a0a" : "#f4f2ee";
  const fg = dark ? "#ffffff" : "#0a0a0a";
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="${bg}"/>`;
  for (let x = 0; x <= W; x += 80) s += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${fg}" stroke-opacity="0.07"/>`;
  for (let y = 0; y <= H; y += 80) s += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${fg}" stroke-opacity="0.07"/>`;
  const slope = 0.3 + rnd() * 0.5;
  for (let i = 0; i < 260; i++) {
    const x = rnd() * W;
    const noise = (rnd() + rnd() + rnd() - 1.5) * 260;
    const y = H - (x * slope + 120 + noise);
    const r = 3 + rnd() * 9;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${rnd() > 0.82 ? "#ff0707" : fg}" fill-opacity="${(0.25 + rnd() * 0.6).toFixed(2)}"/>`;
  }
  let d = `M 0 ${H - 120}`;
  for (let x = 0; x <= W; x += 20) d += ` L ${x} ${(H - (x * slope + 120) + Math.sin(x / 90 + seed) * 30).toFixed(1)}`;
  s += `<path d="${d}" fill="none" stroke="#ff0707" stroke-width="10" stroke-linecap="round"/>`;
  s += `</svg>`;
  return s;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
