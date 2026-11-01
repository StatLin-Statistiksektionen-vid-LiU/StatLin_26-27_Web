import type Database from "better-sqlite3";

/**
 * Migreringar körs i ordning och spåras med PRAGMA user_version.
 * Lägg alltid till nya steg sist – ändra aldrig ett steg som redan körts i drift.
 */
const steps: string[] = [
  /* 1: grundschema */ `
  CREATE TABLE media (
    id            INTEGER PRIMARY KEY,
    kind          TEXT NOT NULL CHECK (kind IN ('image','file')),
    path_base     TEXT NOT NULL,
    ext           TEXT NOT NULL,
    variants      TEXT NOT NULL DEFAULT '',
    original_name TEXT NOT NULL,
    mime          TEXT NOT NULL,
    size          INTEGER NOT NULL,
    width         INTEGER,
    height        INTEGER,
    color         TEXT,
    alt           TEXT NOT NULL DEFAULT '',
    uploaded_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );

  CREATE TABLE committees (
    id             INTEGER PRIMARY KEY,
    slug           TEXT NOT NULL UNIQUE,
    name           TEXT NOT NULL,
    short_name     TEXT NOT NULL,
    tagline        TEXT NOT NULL DEFAULT '',
    description_md TEXT NOT NULL DEFAULT '',
    logo_url       TEXT,
    accent         TEXT NOT NULL DEFAULT '#ff0707',
    email          TEXT NOT NULL DEFAULT '',
    instagram      TEXT NOT NULL DEFAULT '',
    kind           TEXT NOT NULL DEFAULT 'utskott' CHECK (kind IN ('styrelse','utskott','ovrigt')),
    sort_order     INTEGER NOT NULL DEFAULT 0,
    visible        INTEGER NOT NULL DEFAULT 1,
    updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );

  CREATE TABLE users (
    id                   INTEGER PRIMARY KEY,
    email                TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name                 TEXT NOT NULL,
    post                 TEXT NOT NULL DEFAULT '',
    role                 TEXT NOT NULL CHECK (role IN ('admin','editor','committee')),
    committee_id         INTEGER REFERENCES committees(id) ON DELETE SET NULL,
    password_hash        TEXT NOT NULL,
    must_change_password INTEGER NOT NULL DEFAULT 0,
    active               INTEGER NOT NULL DEFAULT 1,
    failed_logins        INTEGER NOT NULL DEFAULT 0,
    locked_until         TEXT,
    last_login_at        TEXT,
    created_at           TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );

  CREATE TABLE sessions (
    id           TEXT PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    expires_at   TEXT NOT NULL,
    user_agent   TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX sessions_user ON sessions(user_id);

  CREATE TABLE board_members (
    id             INTEGER PRIMARY KEY,
    post           TEXT NOT NULL,
    name           TEXT NOT NULL DEFAULT '',
    email          TEXT NOT NULL DEFAULT '',
    bio            TEXT NOT NULL DEFAULT '',
    photo_media_id INTEGER REFERENCES media(id) ON DELETE SET NULL,
    committee_id   INTEGER REFERENCES committees(id) ON DELETE SET NULL,
    sort_order     INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE events (
    id             INTEGER PRIMARY KEY,
    slug           TEXT NOT NULL UNIQUE,
    title          TEXT NOT NULL,
    summary        TEXT NOT NULL DEFAULT '',
    body_md        TEXT NOT NULL DEFAULT '',
    starts_at      TEXT NOT NULL,
    ends_at        TEXT,
    all_day        INTEGER NOT NULL DEFAULT 0,
    location       TEXT NOT NULL DEFAULT '',
    location_url   TEXT NOT NULL DEFAULT '',
    committee_id   INTEGER REFERENCES committees(id) ON DELETE SET NULL,
    cover_media_id INTEGER REFERENCES media(id) ON DELETE SET NULL,
    signup_url     TEXT NOT NULL DEFAULT '',
    price          TEXT NOT NULL DEFAULT '',
    published      INTEGER NOT NULL DEFAULT 1,
    created_by     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX events_starts ON events(starts_at);

  CREATE TABLE event_images (
    id          INTEGER PRIMARY KEY,
    event_id    INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    media_id    INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
    caption     TEXT NOT NULL DEFAULT '',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX event_images_event ON event_images(event_id, sort_order);

  CREATE TABLE news (
    id             INTEGER PRIMARY KEY,
    slug           TEXT NOT NULL UNIQUE,
    title          TEXT NOT NULL,
    excerpt        TEXT NOT NULL DEFAULT '',
    body_md        TEXT NOT NULL DEFAULT '',
    cover_media_id INTEGER REFERENCES media(id) ON DELETE SET NULL,
    committee_id   INTEGER REFERENCES committees(id) ON DELETE SET NULL,
    published      INTEGER NOT NULL DEFAULT 1,
    pinned         INTEGER NOT NULL DEFAULT 0,
    published_at   TEXT NOT NULL,
    author_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX news_published ON news(published_at);

  CREATE TABLE documents (
    id          INTEGER PRIMARY KEY,
    title       TEXT NOT NULL,
    category    TEXT NOT NULL CHECK (category IN ('styrdokument','protokoll','grafiskt','ovrigt')),
    description TEXT NOT NULL DEFAULT '',
    media_id    INTEGER REFERENCES media(id) ON DELETE SET NULL,
    url         TEXT NOT NULL DEFAULT '',
    doc_date    TEXT,
    published   INTEGER NOT NULL DEFAULT 1,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );

  CREATE TABLE pages (
    slug       TEXT PRIMARY KEY,
    title      TEXT NOT NULL,
    lead       TEXT NOT NULL DEFAULT '',
    body_md    TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE partners (
    id            INTEGER PRIMARY KEY,
    name          TEXT NOT NULL,
    url           TEXT NOT NULL DEFAULT '',
    description   TEXT NOT NULL DEFAULT '',
    logo_media_id INTEGER REFERENCES media(id) ON DELETE SET NULL,
    tier          TEXT NOT NULL DEFAULT 'partner' CHECK (tier IN ('huvudpartner','partner')),
    sort_order    INTEGER NOT NULL DEFAULT 0,
    active        INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE audit_log (
    id         INTEGER PRIMARY KEY,
    user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action     TEXT NOT NULL,
    entity     TEXT NOT NULL,
    entity_id  TEXT,
    summary    TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX audit_created ON audit_log(created_at);
  `,
  /* 2: styrelsens granskning av evenemang – det som redan finns räknas som granskat */ `
  ALTER TABLE events ADD COLUMN checked_at TEXT;
  ALTER TABLE events ADD COLUMN checked_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
  UPDATE events SET checked_at = strftime('%Y-%m-%dT%H:%M:%fZ','now');
  `,
  /* 3: Studenter-fliken – sidtexter som fortfarande är ursprungliga nämner nu även mastern */ `
  UPDATE pages SET title = 'Kandidat' WHERE slug = 'utbildning' AND title = 'Utbildning';
  UPDATE pages SET lead = 'Grattis till platsen! Här är allt du behöver veta inför starten – på kandidaten eller mastern.'
    WHERE slug = 'ny-student' AND lead = 'Grattis till platsen! Här är allt du behöver veta inför starten på Statistik och dataanalys.';
  `,
  /* 4: uppdragstavlan – uppdrag mellan styrelsens poster (ett konto per post) */ `
  CREATE TABLE tasks (
    id           INTEGER PRIMARY KEY,
    title        TEXT NOT NULL,
    description  TEXT NOT NULL DEFAULT '',
    from_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    to_user_id   INTEGER REFERENCES users(id) ON DELETE SET NULL, -- NULL = öppet, vem som helst kan ta det
    status       TEXT NOT NULL DEFAULT 'planerad' CHECK (status IN ('planerad','pagar','hjalp','klar')),
    shared       INTEGER NOT NULL DEFAULT 1,                      -- syns för hela styrelsen
    due_date     TEXT,
    event_id     INTEGER REFERENCES events(id) ON DELETE SET NULL,
    assigned_at  TEXT,                                            -- när någon annan gav uppdraget till mottagaren
    created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    completed_at TEXT
  );
  CREATE INDEX tasks_to ON tasks(to_user_id, status);
  CREATE INDEX tasks_from ON tasks(from_user_id);
  CREATE TABLE task_comments (
    id         INTEGER PRIMARY KEY,
    task_id    INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    body       TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX task_comments_task ON task_comments(task_id, created_at);
  ALTER TABLE users ADD COLUMN tasks_seen_at TEXT;
  `,
  /* 5: /sektionen läser nu sin rubrik från sidan, med StatLin i rött som tidigare – om ingen har ändrat den */ `
  UPDATE pages SET title = 'Om *StatLin*' WHERE slug = 'om' AND title = 'Om StatLin';
  `,
  /* 6: länksidan för studenter, programmens kurser och en cache för tentastatistiken */ `
  CREATE TABLE links (
    id          INTEGER PRIMARY KEY,
    label       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    url         TEXT NOT NULL,
    keywords    TEXT NOT NULL DEFAULT '',                         -- extra sökord, t.ex. "timeedit kalender"
    category    TEXT NOT NULL CHECK (category IN ('studier','tentor','it','campus','stod','statlin')),
    icon        TEXT NOT NULL DEFAULT 'link',
    featured    INTEGER NOT NULL DEFAULT 0,                        -- med i genvägsraden
    sort_order  INTEGER NOT NULL DEFAULT 0,
    active      INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE courses (
    id         INTEGER PRIMARY KEY,
    code       TEXT NOT NULL UNIQUE,
    name       TEXT NOT NULL,
    credits    REAL NOT NULL,
    program    TEXT NOT NULL CHECK (program IN ('kandidat','master')),
    term       INTEGER NOT NULL,
    period     TEXT NOT NULL DEFAULT '',
    elective   INTEGER NOT NULL DEFAULT 0,
    url        TEXT NOT NULL DEFAULT '',                           -- t.ex. kurshemsidan
    sort_order INTEGER NOT NULL DEFAULT 0,
    active     INTEGER NOT NULL DEFAULT 1
  );
  CREATE INDEX courses_program ON courses(program, term, sort_order);
  CREATE TABLE exam_stats (
    course_code TEXT PRIMARY KEY,
    data        TEXT NOT NULL,                                     -- källans svar, normaliserat
    fetched_at  TEXT NOT NULL
  );
  `,
  /* 7: grafiskt ansvar – kontot byter omslag, galleribilder och loggor på hela sajten och laddar upp grafiskt material */ `
  ALTER TABLE users ADD COLUMN design INTEGER NOT NULL DEFAULT 0;
  `,
  /* 8: programmens kurslista tas bort – tentastatistiken söks på kurskod – och länken till Y-sektionens tentastatistik */ `
  DROP TABLE IF EXISTS courses;
  DELETE FROM links WHERE url LIKE 'https://ysektionen.se/%';
  `,
];

export function migrate(db: Database.Database) {
  const current = db.pragma("user_version", { simple: true }) as number;
  if (current >= steps.length) return;
  const run = db.transaction(() => {
    for (let v = current; v < steps.length; v++) {
      db.exec(steps[v]);
    }
    db.pragma(`user_version = ${steps.length}`);
  });
  run();
}
