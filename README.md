# StatLin – webbplats och adminpanel

Webbplats för **StatLin – Statistiksektionen i Linköping**, byggd efter sektionens [grafiska styrdokument](public/brand/download/grafiskt-styrdokument.pdf). Besökare möts av sektionsloggan som svävar i 3D över en levande tidsserie, och sektionens poster kan logga in och själva lägga upp evenemang, nyheter och bilder.

![Startsidan](public/og.png)

## Innehåll

**Publik webbplats**

- **Startsida** med den svävande sektionsloggan. Den röda StatLin-grafiken ritas fram som en stigande graf, och loggan lutar efter muspekaren. Under heron finns ett löpband med kommande evenemang, nyckeltal, utskott, nyheter och genvägar för nya studenter och företag.
- **Evenemang**: listvy, månadskalender, filter per utskott, detaljsidor med bildgalleri och lightbox. Det går att lägga till ett enskilt evenemang i kalendern (iCal eller Google), och hela kalendern finns som prenumererbart flöde (`/kalender.ics`).
- **Nyheter** med fästa inlägg, schemalagd publicering och avsändande utskott.
- **Sektionen**: om StatLin, styrelsen, utskott (en egen sida per utskott med deras evenemang och nyheter), galleri, dokument och **grafisk profil**. Den sista är en interaktiv version av styrdokumentet med loggvarianter, färgkoder som kopieras med ett klick och nedladdningar.
- **Utbildning**, **Ny student** (med overallen ritad enligt styrdokumentet) och **För företag** (med STAR), plus **Kontakt**.
- **In English** (`/en` och `/en/masters`) för masterprogrammet, som ges på engelska. Texterna redigeras under *Sidor*, och knappen EN/SV i sidhuvudet växlar språk. Övriga sidor är på svenska; inget på sajten blockerar webbläsarens inbyggda översättning.
- SEO: metadata, Open Graph-bild, sitemap, robots och strukturerad data (schema.org/Event) för evenemang.
- Fungerar på mobil, med tangentbord och skärmläsare, respekterar "minska rörelse" och visar allt innehåll även utan JavaScript.

**Adminpanel för poster (`/admin`)**

- Inloggning per post med roller (se nedan). Kontot spärras tillfälligt efter upprepade felförsök.
- **Evenemang** med bildgalleri. Dra in flera bilder samtidigt, så laddas de upp med förloppsindikator. Bilderna roteras automatiskt rätt, skalas om till flera storlekar och får **GPS- och EXIF-data borttagna**. Bildtexter, ordning (dra och släpp) och omslag ändras direkt i galleriet.
- **Nyheter**, **sidtexter**, **styrelsen** (namn, porträtt, ordning), **utskott** (beskrivning, logga, färg), **dokument** (PDF och liknande) och **partners**.
- Markdown-editor med verktygsrad, förhandsvisning och bilder som dras in eller klistras in direkt i texten.
- **Konton** (endast admin). Nya konton får ett läsbart engångslösenord, till exempel `kvartil-median-4821`, som måste bytas vid första inloggningen.
- **Granskning**: administratörerna bockar av evenemang som granskade. Nya och ändrade evenemang från utskotten och info samlas under *Att granska* i översikten. Bocken påverkar aldrig om ett evenemang visas på sajten.
- **Revisionslogg**: översikten visar vem som ändrade vad.

## Roller

| Roll | Typiskt för | Får göra |
| --- | --- | --- |
| **Administratör** | Webbansvarig, ordförande, vice ordförande | Allt, inklusive konton och granskning av evenemang |
| **Redaktör** | Informationsansvarig | Allt innehåll och sajtens inställningar: evenemang, nyheter, bilder, sidor, styrelse, dokument, partners, kontaktuppgifter |
| **Utskott** | SCB, UBU, SASU, StatPub, STIG, eSTIG … | Det egna utskottets evenemang, nyheter, bilder och utskottssida |

Behörigheten kontrolleras på servern i varje sida, server action och uppladdning, inte bara i gränssnittet.

## Testa i webbläsaren (utan att installera något)

Med ett GitHub-konto kan du köra hela sajten, inklusive inloggningen, i GitHub Codespaces:

1. Gå till repot på GitHub och byt till grenen du vill testa.
2. Klicka på **Code → Codespaces → Create codespace on …**.
3. Vänta några minuter medan allt installeras och byggs. Sajten öppnas sedan i en ny flik (annars: fliken **Ports** → port 3000 → klotikonen).

Demokonton i Codespaces:

| Konto | Lösenord | Roll |
| --- | --- | --- |
| `admin@statlin.se` | `admin-statlin-2026` | Administratör |
| `info@statlin.se` | `demo-statlin-2026` | Redaktör |
| `scb@statlin.se` | `demo-statlin-2026` | Utskott (SCB) |

Logga in på `/logga-in`. Codespaces är privat för ditt konto, och lösenorden gäller bara där. Stäng av eller ta bort codespacet när du är klar (*Code → Codespaces → … → Delete*) så att du inte förbrukar din gratiskvot.

## Kom igång lokalt

Kräver Node.js 20.9 eller senare.

```bash
npm install
npm run seed -- --demo   # grunddata + exempelevenemang, exempelnyheter och demokonton
npm run dev              # http://localhost:3000
```

**Windows utan C++-byggverktyg:** `npm install` avbryts med `gyp ERR! find VS`. npm försöker kompilera better-sqlite3 eftersom paketet har en `binding.gyp`, trots att den förbyggda binären följer med och är den som används (därför installerar `Dockerfile` python3, make och g++). Hoppa över installationsskripten och kör sedan bara de två som behövs:

```bash
npm ci --ignore-scripts
npm rebuild esbuild unrs-resolver
```

Kör inte ett vanligt `npm rebuild` efteråt – det försöker kompilera better-sqlite3 igen. Alternativt installerar du det node-gyp kräver på Windows (Visual Studio Build Tools med *Desktop development with C++* samt Python 3), så fungerar `npm install` som vanligt.

Seed-skriptet skriver ut inloggningsuppgifterna. Vill du välja lösenorden själv:

```bash
ADMIN_PASSWORD=mitt-losenord DEMO_PASSWORD=demo-losenord npm run seed -- --demo
```

Utan `--demo` läggs bara grunddatan in: utskotten från styrdokumentet, styrelseposter, sidtexter och styrdokumentet som PDF. All grunddata läggs också in automatiskt första gången sajten startar.

## Driftsättning

All data (SQLite-databas och uppladdade filer) ligger i en enda katalog, `DATA_DIR`. Sajten behöver därför en server med beständig disk: en VPS, Docker, eller Fly.io/Railway/Render med volym.

### Docker (rekommenderat)

```bash
cp .env.example .env     # fyll i SITE_URL, ADMIN_EMAIL och ADMIN_PASSWORD
docker compose up -d --build
```

Vid första start skapas grunddata och administratören från `.env`. Logga in på `/logga-in` och byt lösenord. Lägg en omvänd proxy med HTTPS framför, till exempel Caddy eller nginx.

### Railway (eller annan värd med Docker och volym)

1. Skapa ett projekt från GitHub-repot (gren `main`). Dockerfilen används automatiskt, och varje merge till `main` driftsätts.
2. Lägg till en volym med monteringssökvägen `/data`. Utan den försvinner databasen och alla uppladdningar vid nästa driftsättning.
3. Sätt variablerna `ADMIN_EMAIL`, `ADMIN_PASSWORD` och `SITE_URL`. Railway skickar dem även till bygget, där `SITE_URL` behövs.
4. Slå på schemalagda säkerhetskopior av volymen och, om värden har det, hälsokontroll på `/api/health`.
5. Kontrollera driftsättningen med `node tests/smoke.mjs https://din-adress`.

Skapa en ny administratör eller återställ lösenordet för en befintlig:

```bash
docker compose exec -u statlin web node scripts/create-admin.mjs ordforande@statlin.se "Förnamn Efternamn"
```

### Fly.io

Inställningarna finns i `fly.toml`: appen `statlin-web` i region `arn` (Stockholm), en maskin med 1 GB minne och volymen `statlin_data` monterad på `/data`. Första gången:

```bash
fly apps create statlin-web
fly volumes create statlin_data --region arn --size 3
fly deploy --ha=false
```

Därefter räcker `fly deploy` för att driftsätta en ny version.

- Appen måste köra på **exakt en maskin**, eftersom SQLite-databasen ligger på volymen. Skala aldrig upp med `fly scale count`.
- Maskinen stängs av när ingen besöker sajten och startar automatiskt vid nästa besök, vilket tar några sekunder. Sätt `min_machines_running = 1` i `fly.toml` för att alltid ha den igång.
- Fly tar en ögonblicksbild av volymen varje dag och sparar den i fem dagar (`fly volumes snapshots list <volym-id>`). Volymen växer automatiskt upp till 10 GB.
- Skapa sektionens konton (ordförande, vice, info och ett per utskott) med engångslösenord: `fly ssh console -u statlin -C "node scripts/create-accounts.mjs"`. Konton som redan finns lämnas orörda.
- Skapa en ny administratör eller återställ lösenordet: `fly ssh console -u statlin -C "node scripts/create-admin.mjs ordforande@statlin.se"`.
- **Egen domän:** kör `fly certs add statlin.se` och lägg in DNS-posterna som kommandot visar hos domänregistratorn. Byt sedan `SITE_URL` på båda ställena i `fly.toml` och kör `fly deploy`.

### Utan Docker

```bash
npm ci && npm run build
cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
DATA_DIR=/var/lib/statlin SITE_URL=https://statlin.se node .next/standalone/server.js
```

### Miljövariabler

| Variabel | Beskrivning |
| --- | --- |
| `SITE_URL` | Publik adress. Används i kalenderflöde, sitemap och delningsbilder. Måste finnas redan när sajten byggs, eftersom den bakas in i förrenderade sidor: Docker-bilden tar den som byggargument (`ARG SITE_URL`), och Railway skickar tjänstens variabler dit automatiskt. Bygg om efter att du ändrat den. |
| `DATA_DIR` | Katalog för databas och uppladdningar (standard `./data`, `/data` i Docker). |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Skapar första administratören om databasen saknar konton. |
| `COOKIE_SECURE` | Behövs normalt inte: inloggningskakan blir automatiskt `Secure` när sajten nås via HTTPS (även bakom en proxy som skickar `X-Forwarded-Proto`). Sätt `true` för att alltid kräva HTTPS. |
| `ALLOWED_ORIGINS` | Extra värdar som får skicka formulär, kommaseparerade (t.ex. `statlin.se,*.statlin.se`). Behövs bara om en proxy inte skickar vidare rätt `Host`/`X-Forwarded-Host`. I GitHub Codespaces sätts `*.app.github.dev` automatiskt. |
| `CLIENT_IP_HEADER` | Behövs normalt inte. Spärren mot upprepade inloggningsförsök räknar per IP och använder det sista värdet i `X-Forwarded-For`, det som proxyn framför sajten lade till (besökaren kan själv fylla i de tidigare). Sätter värden en egen rubrik med besökarens IP kan den anges här, till exempel `x-real-ip` (Railway) eller `fly-client-ip` (Fly.io). |

### Säkerhetskopiering

Kopiera `DATA_DIR`. För en säker kopia av databasen medan sajten kör:

```bash
sqlite3 data/statlin.db ".backup 'backup-$(date +%F).db'"
```

## Guide för poster

1. Logga in på **/logga-in** med postens e-postadress.
2. **Nytt evenemang**: fyll i titel, tid och plats. Utan omslagsbild genereras ett omslag i utskottets färger med utskottets logga.
3. **Efter evenemanget**: öppna det under *Evenemang*, scrolla till *Bildgalleri* och dra in bilderna. De dyker upp direkt på sajten och i galleriet. Klicka på ★ för att välja omslag.
4. **Nyheter** publiceras direkt, eller vid en viss tid om du anger ett framtida datum.

Översikten visar evenemang som har varit men saknar bilder. Ordförande och vice ser också *Att granska*: evenemang som utskotten eller info har skapat eller ändrat sedan de senast granskades.

## Teknik

- **Next.js 16** (App Router, Cache Components, Partial Prerendering, server actions) och **React 19**.
- **SQLite** via `better-sqlite3`, med versionerade migreringar i `src/lib/db/migrations.ts`.
- **sharp** för bildbehandling (WebP i 480/1200/2000 px, rotering efter EXIF, metadata borttagen).
- **Tailwind CSS 4** med egna designtokens (`src/app/globals.css`).
- Sessioner i databasen (slumpad token, endast SHA-256-hashen lagras), lösenord med bcrypt, CSRF-skydd via SameSite-cookies och kontroll av ursprung.
- Typsnitt (Archivo, JetBrains Mono) är självhostade via Fontsource, så inga externa anrop görs. Citat och formler använder systemtypsnittet Georgia.

```
src/
  app/(site)/        publika sidor
  app/admin/         adminpanelen (+ _actions/ med server actions)
  app/api/           uppladdning och hälsokontroll
  app/media/         serverar uppladdade filer från DATA_DIR
  components/        UI (brand/, content/, home/, layout/, admin/)
  lib/               databas, auth, data, markdown, media, datum (Europe/Stockholm), iCal
scripts/             seed, create-admin och create-accounts
public/brand/        loggor (SVG-varianter, utskottsloggor, nedladdningar)
```

### Loggan

Sektionsloggan är vektoriserad från originalet i styrdokumentet. Ringen är en ren cirkel, medan texten, rutnätet och den röda signaturen är spårade banor. Lagren ligger var för sig i `src/lib/brand/logo-paths.ts`. Det gör att varianterna från styrdokumentet (standard, inverterad, svart, vit, röd) genereras exakt, och att heron kan animera lagren utan att formen ändras. Slutläget är alltid den oförändrade loggan.

## Kommandon

| Kommando | Gör |
| --- | --- |
| `npm run dev` | Utvecklingsserver |
| `npm run build` / `npm start` | Produktionsbygge / kör bygget |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run seed [-- --demo]` | Grunddata (och demodata) |
| `npm run create-admin -- <e-post>` | Skapa admin eller återställ lösenord |
| `npm run create-accounts` | Skapa ordförande, vice, info och ett konto per utskott (hoppar över befintliga) |
| `node tests/e2e.mjs <url>` | End-to-end-test (inloggning, roller, evenemang, bildgalleri) mot en nyseedad server – se kommentaren i filen |
| `node tests/smoke.mjs <url>` | Snabbkontroll av en körande sajt: sidor, hälsokontroll, kalenderflöde, sitemap, delningsbilder. Läser bara, så den är säker att köra mot produktion. Kräver bara Node. |

## Att göra

- E-post för "glömt lösenord" (i dag återställer en administratör lösenordet).
- Hela sajten på engelska under samma `/en/...`-adresser (i dag finns `/en` och `/en/masters`), gärna med automatisk översättning när en post sparar en text.
- Anmälningar direkt på sajten i stället för externa formulär.

Exempelinnehållet (evenemang, nyheter, styrelsenamn, e-postadresser på `@statlin.se` och exempelbilder i galleriet) är platshållare. Byt ut det i adminpanelen innan sajten publiceras.
