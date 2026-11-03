import type Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { envPasswordProblem } from "../auth/password";
import { SEED_BOARD, SEED_COMMITTEES, SEED_LINKS, SEED_PAGES } from "../seed-content";

/**
 * Skapar första administratören om databasen saknar konton – vid första start (bootstrap nedan) och i
 * npm run seed, som anropar samma funktion. Lösenordet måste bytas vid första inloggningen. En känd platshållare
 * eller ett lösenord som är tomt eller kortare än 10 tecken efter trim vägras med ett fel. Returnerar true om kontot skapades.
 */
export function createFirstAdmin(db: Database.Database, email: string, password: string): boolean {
  if ((db.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number }).n > 0) return false;
  const problem = envPasswordProblem("ADMIN_PASSWORD", password);
  if (problem) throw new Error(`[statlin] ${problem} Administratören skapades inte.`);
  const normalized = email.trim().toLowerCase();
  const styrelsen = db.prepare("SELECT id FROM committees WHERE slug = 'styrelsen'").get() as { id: number } | undefined;
  db.prepare(
    "INSERT INTO users (email, name, post, role, committee_id, password_hash, must_change_password) VALUES (?, 'Administratör', 'Webbansvarig', 'admin', ?, ?, 1)",
  ).run(normalized, styrelsen?.id ?? null, bcrypt.hashSync(password.trim(), 11));
  console.log(`[statlin] Skapade administratören ${normalized} (byt lösenord vid första inloggningen).`);
  return true;
}

/**
 * Körs första gången databasen öppnas: lägger in grunddata (utskott, poster, sidtexter, länkar)
 * om databasen är tom, och skapar ett administratörskonto från ADMIN_EMAIL/ADMIN_PASSWORD
 * om det inte finns några konton. Gör en ny installation körbar utan manuella steg.
 */
export function bootstrap(db: Database.Database) {
  const count = (table: string) => (db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n;

  db.transaction(() => {
    const insertCommittee = db.prepare(
      `INSERT OR IGNORE INTO committees (slug, name, short_name, kind, logo_url, accent, email, tagline, description_md, sort_order)
       VALUES (@slug, @name, @short_name, @kind, @logo_url, @accent, @email, @tagline, @description_md, @sort_order)`,
    );
    if (count("committees") === 0) SEED_COMMITTEES.forEach((c, i) => insertCommittee.run({ ...c, sort_order: i * 10 }));

    const committeeId = (slug: string) => (db.prepare("SELECT id FROM committees WHERE slug = ?").get(slug) as { id: number } | undefined)?.id ?? null;

    if (count("board_members") === 0) {
      const insertBoard = db.prepare("INSERT INTO board_members (post, name, email, bio, committee_id, sort_order) VALUES (?, ?, ?, ?, ?, ?)");
      SEED_BOARD.forEach((b, i) => insertBoard.run(b.post, "", b.email, b.bio, committeeId(b.committee), i * 10));
    }

    const insertPage = db.prepare("INSERT OR IGNORE INTO pages (slug, title, lead, body_md) VALUES (@slug, @title, @lead, @body_md)");
    SEED_PAGES.forEach((p) => insertPage.run(p));

    // Länkarna läggs in en gång (även i befintliga databaser). Tar någon bort dem kommer de inte tillbaka.
    if (!db.prepare("SELECT 1 FROM settings WHERE key = 'seeded_links'").get()) {
      const insertLink = db.prepare(
        "INSERT INTO links (label, description, url, keywords, category, icon, featured, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      );
      SEED_LINKS.forEach((l, i) => insertLink.run(l.label, l.description, l.url, l.keywords ?? "", l.category, l.icon ?? "link", l.featured ? 1 : 0, i * 10));
      db.prepare("INSERT INTO settings (key, value) VALUES ('seeded_links', '1')").run();
    }

    if (count("documents") === 0) {
      db.prepare("INSERT INTO documents (title, category, description, url, doc_date, sort_order) VALUES (?, 'grafiskt', ?, ?, ?, 0)").run(
        "Grafiskt styrdokument",
        "Logotyper, färgkoder, typsnitt och klädregler för StatLin och utskotten.",
        "/brand/download/grafiskt-styrdokument.pdf",
        "2021-04-26",
      );
    }

    const email = process.env.ADMIN_EMAIL?.trim();
    const password = process.env.ADMIN_PASSWORD;
    if (email && password) createFirstAdmin(db, email, password);
  })();
}
