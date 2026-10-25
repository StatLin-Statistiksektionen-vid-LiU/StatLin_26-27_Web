import type Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { SEED_BOARD, SEED_COMMITTEES, SEED_PAGES } from "../seed-content";

/**
 * Körs första gången databasen öppnas: lägger in grunddata (utskott, poster, sidtexter)
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

    if (count("documents") === 0) {
      db.prepare("INSERT INTO documents (title, category, description, url, doc_date, sort_order) VALUES (?, 'grafiskt', ?, ?, ?, 0)").run(
        "Grafiskt styrdokument",
        "Logotyper, färgkoder, typsnitt och klädregler för StatLin och utskotten.",
        "/brand/download/grafiskt-styrdokument.pdf",
        "2021-04-26",
      );
    }

    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (count("users") === 0 && email && password) {
      db.prepare(
        "INSERT INTO users (email, name, post, role, committee_id, password_hash, must_change_password) VALUES (?, 'Administratör', 'Webbansvarig', 'admin', ?, ?, 1)",
      ).run(email, committeeId("styrelsen"), bcrypt.hashSync(password, 11));
      console.log(`[statlin] Skapade administratören ${email} (byt lösenord vid första inloggningen).`);
    }
  })();
}
