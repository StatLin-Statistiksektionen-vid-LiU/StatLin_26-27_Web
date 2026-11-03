# Åtgärdsplan för statlin-web – verifierad checklista ur fyra planer

Datum: 2026-11-03, kontrollerad mot HEAD 93daf3b på Main-Real. Ingen kod är ändrad; den här filen är det enda nya i repot.

## Så läser du

**Källor** (planfilerna som slagits ihop):

- A = `C:\Users\Nezzo\.claude\plans\ultrareview-this-code-and-squishy-frost.md` – kodgranskning: H1, M1–M36, L1–L44, S1–S17, åtgärdsplan (A:896–997), verifieringslista (A:998–1070) och dubbelkoll (A:1072–1197).
- B = `C:\Users\Nezzo\.claude\plans\fr-ga-vad-skulle-varje-cuddly-wombat.md` – Frågelådan, posttabellen, fyra verktyg och "Småfel jag såg på live-sidan".
- C = `C:\Users\Nezzo\.claude\plans\fr-ga-r-de-m-jligt-polished-pizza.md` – Kvitton till Fortnox (funktionsplan i tre faser).
- D = `C:\Users\Nezzo\.claude\plans\vilka-f-rb-ttring-kan-vi-iridescent-reddy.md` – tio förbättringar för livslängd.

**Käll-id** i fältet Källa: `A/H1`, `A/M1`–`A/M36`, `A/L1`–`A/L44`, `A/S1`–`A/S17`, `A/steg-N` (ett steg i A:s åtgärdsplan), `A/rad-N` (en rad i A); `B/tre-1..3` (B:s "tre saker"), `B/post` (posttabellen), `B/verktyg-2..4`, `B/fragelada`, `B/småfel-1..5`, `B/rad-N`; `C/fas-1..3`, `C/rad-N`; `D#1`–`D#10`, `D/rad-N`. `Live` = egen GET mot statlin-web.fly.dev 2026-11-03. `NY-n` och `N-n` = nya fynd från dubbelkollen (tre granskande agenter 2026-11-03), numrerade som i deras rapporter.

**Fält per punkt:** Källa · Fil och rad · Kodrad (citat — fil:rad, kontrollerat mot HEAD) · Saknas/Saknar (frånvaro som kontrollerats: en fil som inte finns, en sträng som inte förekommer) · Belägg (rad i `node_modules/next/dist/docs/` eller Nexts kod, bara när Next-beteende bedöms) · Felscenario · Åtgärd · Verifiering · Status.

**Status:**

- `Öppen – belagd 2026-11-03`: kodraden och konsekvensen är kontrollerade.
- `Öppen – delvis belagd (<vad som återstår>)`: kodraden är belagd men konsekvensen är inte provad – det som återstår är webbläsare, Fly, en minnesmätning eller produktionsdatabasen.
- `Öppen – väntar på beslut B-n`: åtgärden beror på ett val i avsnitt 7 och får inte väljas här.
- `Förslag – belagd`: en förbättring, inte ett fel.
- Avsnitt 9: `Refuterad` (koden säger emot påståendet), `Vederlagd åtgärd` (ett åtgärdsförslag som A:s egen dubbelkoll visade vara fel – listat så att ingen gör om det), `Obelagd – kräver <X>` (går inte att belägga i koden; X är det som skulle avgöra).

**Ordning:** 1 Säkerhetsnät (backup, deploy-rutin, CI) → 2 Säkerhet och dataförlust → 3 Synliga buggar → 4 Node → 5 Beroenden → 6 Städning → 7 Beslut krävs → 8 Funktionsförslag och uppgifter utanför koden → 9 Refuterat → 10 Täckningstabell. Inom avsnitt 3 kommer den publika sajten före admin.

**Dubbletter och motsägelser:** ett id per fel. När ett käll-id avsiktligt delas mellan två punkter står `se <id>` i båda. Varje motsägelse mellan planerna, och inom plan A (fyndtext mot åtgärdsplan mot dubbelkoll), står i avsnitt 7 – ingen punkt väljer själv, utan får status `väntar på beslut`. Två planer som anger värden som ryms i varandra (≥ 30 min mot ~60 min) eller som kompletterar varandra räknas inte som motsägelse och står i listan "Ingen motsägelse" i avsnitt 7. Faktamotsägelser är avgjorda genom mätning och redovisas med båda planernas påstående.

**Kontroll:** varje citat i Kodrad och Belägg, varje fil:rad, varje Saknas/Saknar, varje `se <id>` och `väntar på beslut B-n` samt täckningen av alla käll-id är kontrollerade maskinellt mot HEAD 2026-11-03 med ett skript (`kontroll.mjs`, utanför repot) som kräver att citatet står på just den raden i just den filen. Punkter vars konsekvens inte gick att prova står som *delvis belagd*; det som inte alls gick att belägga står i avsnitt 9.

Exempel på en punkt:

```markdown
### SN-00 Rubrik som beskriver felet
- **Källa:** A/H1, D#1; se SN-02
- **Fil och rad:** `fly.toml:21`; `Dockerfile:5`
- **Kodrad:** `source = "statlin_data"` — `fly.toml:21`; `FROM node:22-bookworm-slim AS deps` — `Dockerfile:5`
- **Saknas:** `scripts/backup.mjs`
- **Saknar:** `snapshot_retention` i `fly.toml`
- **Belägg:** `node_modules/next/dist/docs/01-app/02-guides/self-hosting.md:163` — `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`
- **Felscenario:** vad som händer, konkret.
- **Åtgärd:** vad som ska göras.
- **Verifiering:** hur man ser att det är löst (A:s verifieringslista när den har en rad).
- **Status:** Öppen – belagd 2026-11-03; väntar på beslut B-2
```

## 1 Säkerhetsnät (backup, deploy-rutin, CI)

Tio punkter. Fem väntar på beslut: SN-01 (B-2, B-3, B-16), SN-03 (B-1), SN-06 (B-8), SN-07 (B-17), SN-08 (B-21). Två är delvis belagda (SN-05, SN-10).

### SN-01 Enda säkerhetskopian är Flys ögonblicksbilder i fem dagar – inget eget backupskript
- **Källa:** A/H1, D#1, D#10; se SN-02, SN-07
- **Fil och rad:** `fly.toml:20-26`; `Dockerfile:5`; `Dockerfile:9`; `Dockerfile:35-37`; `README.md:165`; `README.md:195`; `src/lib/db/index.ts:18-27`; `next.config.ts:28`
- **Kodrad:** `source = "statlin_data"` — `fly.toml:21`; `auto_extend_size_limit = "10gb"` — `fly.toml:26`; `FROM node:22-bookworm-slim AS deps` — `Dockerfile:5`; `apt-get install -y --no-install-recommends python3 make g++` — `Dockerfile:9`; `Fly tar en ögonblicksbild av volymen varje dag och sparar den i fem dagar` — `README.md:161`; `const d=process.env.DATA_DIR||'data'` — `README.md:191`; `migrate(db);` — `src/lib/db/index.ts:26`; `"./scripts/**/*"` — `next.config.ts:28`
- **Saknas:** `scripts/backup.mjs`
- **Saknar:** `snapshot_retention` i `fly.toml`
- **Felscenario:** Volymen `statlin_data` är den enda platsen för databas och uppladdningar. Flys dagliga ögonblicksbild sparas i fem dagar (standardvärdet – ingen `snapshot_retention` är satt), så en skada som upptäcks efter en vecka – en felaktig migrering, en felradering i admin, en trasig volym – saknar kopia. README:s enda återställningsrecept (rad 195) kräver `sqlite3`-binären, som inte finns i imagen: `Dockerfile:9` installerar bara byggverktygen. Migreringarna körs lat vid första `getDb()` (`src/lib/db/index.ts:26`), ofta utlöst av hälsokontrollen – ingen kopia tas före dem. Kopian måste även täcka det som i kommande funktioner hamnar utanför `uploads/` (C: kvitton i `DATA_DIR/kvitton`, D: huvudkopior av bilder).
- **Åtgärd:** Ett backupskript `scripts/backup.mjs` (kopieras in i imagen som de tre skripten på `Dockerfile:35-37` – `next.config.ts:28` utesluter `scripts/` ur filspårningen) som tar kopian med better-sqlite3:s `db.backup()` till `backups/<datum>.db` plus `uploads.tgz`; hämtning med `fly ssh sftp get` till privat lagring; kopia före varje migrering och deploy; `snapshot_retention = 30` i `fly.toml` (A och D är överens; priset → U-07). Kadens, utlösare och lagringsplats: B-2. Kopia före migrering i deploy-skriptet eller inuti `migrate()`: B-3. Omfång mot raderingslöftena i Frågelådan/kvitton: B-16.
- **Verifiering:** `fly ssh console -C "node scripts/backup.mjs"` ger en fil som öppnas lokalt med `PRAGMA integrity_check` = `ok` och innehåller alla tabeller; en återställningsövning mot en tom volym (SN-02) en gång per år (A:1011, D/rad-88).
- **Status:** Öppen – belagd 2026-11-03; väntar på beslut B-2, B-3, B-16

### SN-02 Ingen återställnings- eller rollback-rutin; äldre kod startar tyst mot ett nyare schema
- **Källa:** A/H1, A/M27, D#1; se SN-01, SN-03
- **Fil och rad:** `src/lib/db/migrations.ts:279-289`; `README.md:155-168`
- **Kodrad:** `if (current >= steps.length) return;` — `src/lib/db/migrations.ts:281`; `for (let v = current; v < steps.length; v++) {` — `src/lib/db/migrations.ts:283`; `fly volumes create statlin_data --region arn --size 3` — `README.md:157`; ``Därefter räcker `fly deploy` för att driftsätta en ny version.`` — `README.md:161`
- **Saknas:** `scripts/restore.mjs`
- **Saknar:** `fly releases` i `README.md`; `--image` i `README.md`
- **Felscenario:** README beskriver skapande och deploy men inte hur databasen återställs ur en ögonblicksbild eller hur en deploy rullas tillbaka (`fly releases` och `fly deploy --image` nämns inte). `migrate()` är bara framåtriktad: en äldre image mot en databas med högre `user_version` returnerar på rad 281 utan fel och kör sedan mot tabeller och kolumner den inte känner – felet syns först som 500 i en action eller en sida. Ingen har övat återställning, så första gången sker under press.
- **Åtgärd:** Skriv rutinen i README (avsnittet Överlämning, SN-09): hämta ögonblicksbild → ny volym → `fly deploy --image <föregående>`; låt `migrate()` logga en varning (eller vägra starta) när `current` är större än `steps.length`; öva en återställning mot en tom volym årligen (D#1) och skriv datum i README.
- **Verifiering:** Rutinen följs en gång mot en testvolym; en kopia av databasen med `user_version` satt högre än antalet steg ger ett tydligt fel vid start i stället för tystnad.
- **Status:** Åtgärdad 2026-11-03 (commit cee830b); var Öppen – belagd 2026-11-03

### SN-03 Ingen deploy-rutin: `fly deploy` från arbetskatalogen tar med ocommittade filer och går utan kopia
- **Källa:** A/M27, D#5; se SN-02, SN-06, BE-02
- **Fil och rad:** `README.md:161`; `Dockerfile:20-21`; `.dockerignore:1-12`; `package.json:5-14`
- **Kodrad:** `COPY . .` — `Dockerfile:20`; `RUN npm run build` — `Dockerfile:21`; ``Därefter driftsätts nya versioner från grenen `Main-Real` med `fly deploy` `` — `README.md:157`; `"create-accounts": "node scripts/create-accounts.mjs"` — `package.json:13`
- **Saknas:** `scripts/deploy.mjs`; `.github`
- **Saknar:** `"deploy"` i `package.json`
- **Felscenario:** Deployen är ett manuellt `fly deploy` från den dator som råkar ha repot. Byggkontexten är hela arbetskatalogen (`Dockerfile:20`) minus `.dockerignore`, så halvfärdiga, ocommittade ändringar följer med till produktion utan att synas i git. Ingen kopia tas före (SN-01), inget test körs före (SN-06), och ingen annan än den som har flyctl och repot kan driftsätta. Att flyctl paketerar exakt arbetskatalogen är extern fakta (inte belagd i koden).
- **Åtgärd:** Ett deploy-skript (A: lokalt `scripts/deploy.mjs` som kräver rent arbetsträd på `Main-Real`, tar kopia och kör smoke efteråt) och/eller en GitHub Actions-knapp som fler kan trycka på (D) – valet är B-1; `fly volumes snapshots create` före deploy (A:419–423, D:40).
- **Verifiering:** En medvetet ocommittad ändring i arbetsträdet stoppar deployen; efter deploy visar `fly releases` versionen och `node tests/smoke.mjs https://statlin-web.fly.dev` är grön.
- **Status:** Öppen – belagd 2026-11-03; väntar på beslut B-1

### SN-04 Kopior enligt README hamnar i repo-roten, som inte ignorerar dem – och repot är publikt
- **Källa:** A/M26, A/rad-82
- **Fil och rad:** `README.md:195`; `.gitignore:45`; `.dockerignore:5`
- **Kodrad:** `sqlite3 data/statlin.db ".backup 'backup-$(date +%F).db'"` — `README.md:195`; `/data` — `.gitignore:45`; `data` — `.dockerignore:5`
- **Saknar:** `*.db` i `.gitignore`; `backups` i `.gitignore`; `.db` i `.dockerignore`
- **Felscenario:** Kommandot på README:195 skriver `backup-<datum>.db` i den katalog man står i – repo-roten – och `.gitignore` täcker bara `/data` (rad 45), inte `*.db` eller `backups/` (`git check-ignore backups/x.db x.db` 2026-11-03: ingen träff). Repot `StatLin-Statistiksektionen-vid-LiU/StatLin_26-27_Web` är publikt (GitHub-sidan svarar 200 utan inloggning, 2026-11-03), så ett `git add -A` publicerar hela databasen med lösenordshashar, sessioner och revisionslogg. `.dockerignore` tar dessutom med en sådan kopia i byggkontexten.
- **Åtgärd:** `*.db`, `*.db-wal`, `*.db-shm` och `/backups/` i både `.gitignore` och `.dockerignore`; README pekar kopian till `backups/` (SN-01).
- **Verifiering:** `git check-ignore backups/x.db x.db` ger två träffar; `git status` efter en testkopia i roten visar inget nytt.
- **Status:** Åtgärdad 2026-11-03 (commit b4020c2); var Öppen – belagd 2026-11-03

### SN-05 En lös volym med samma namn kan kopplas in i stället för den riktiga
- **Källa:** A/M29
- **Fil och rad:** `fly.toml:20-22`; `README.md:157`; `README.md:163`
- **Kodrad:** `source = "statlin_data"` — `fly.toml:21`; `fly volumes create statlin_data --region arn --size 3` — `README.md:157`; `eftersom SQLite-databasen ligger på volymen` — `README.md:163`
- **Saknar:** `vol_` i `README.md`; `vol_` i `fly.toml`
- **Felscenario:** Fly väljer volym efter namn (`source`), inte efter id. Enligt minnesanteckningen från 2026-10-31 finns två volymer med namnet `statlin_data` i appen: `vol_v3g8q8wewx6q3jx4` (kopplad) och `vol_491j0dldgmng2x5r` (okopplad). Vid `fly machine destroy` följt av ny maskin, vid `fly scale count` eller en flytt kan maskinen få den tomma volymen: sajten startar "ny" (bootstrap seedar grunddata), vilket ser ut som total dataförlust, och nya ändringar hamnar på fel volym. Varken README eller `fly.toml` säger vilken volym som är den levande. Fly-beteendet är inte belagt i koden – bara i Flys dokumentation och minnesanteckningen.
- **Åtgärd:** `fly volumes list`; om den okopplade volymen fortfarande finns beslutar användaren om `fly volumes destroy` (efter kontroll av att den är tom eller äldre); skriv den levande volymens id i README och i deploy-skriptet (SN-03).
- **Verifiering:** `fly volumes list` visar exakt en volym `statlin_data` i `arn`; README nämner dess id.
- **Status:** Åtgärdad 2026-11-03 (commit 2f3f3a5); var Öppen – delvis belagd (kräver `fly volumes list` för färskt läge; Fly-beteendet är obelagt i kod)

### SN-06 Ingen CI och inget `npm test`; e2e-sviten kan bara köras en gång och bygger på hårdkodade id:n
- **Källa:** A/M11, D#5; se BE-01, SN-03
- **Fil och rad:** `package.json:5-14`; `tests/e2e.mjs:16`; `tests/e2e.mjs:630`; `tests/e2e.mjs:673`; `tests/e2e.mjs:743-748`; `tests/e2e.mjs:833`; `src/app/admin/_actions/users.ts:44-45`; `scripts/seed.ts:87`
- **Kodrad:** `import { chromium } from "playwright";` — `tests/e2e.mjs:16`; `assert.equal(await page.inputValue('input[name="slug"]'), "testsittning-med-galleri");` — `tests/e2e.mjs:634`; `fd.append("eventId", "4");` — `tests/e2e.mjs:747`; `/admin/evenemang/4` — `tests/e2e.mjs:752`; `await page.fill('input[name="email"]', "stig@statlin.se");` — `tests/e2e.mjs:837`; `const clash = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(d.email, id ?? -1);` — `src/app/admin/_actions/users.ts:44`; `{ slug: "lan-kvall", title: "LAN-kväll", committee: "estig"` — `scripts/seed.ts:87`
- **Saknas:** `.github`
- **Saknar:** `"test"` i `package.json`
- **Felscenario:** Inget körs automatiskt: `package.json` har inget `test`-skript och repot saknar `.github/workflows`. e2e-sviten kan bara köras en gång per seedad databas – den skapar `stig@statlin.se` (rad 833) och andra gången svarar `src/app/admin/_actions/users.ts:44-45` att kontot finns; den antar att evenemang med id 4 är `lan-kvall` (rad 743 och 748 mot `scripts/seed.ts:87`) och att sluggen `testsittning-med-galleri` är ledig (rad 630, 673). Därför körs den sällan, och regressioner upptäcks i produktion.
- **Åtgärd:** `npm test` = smoke + e2e mot en färsk seed i en tempkatalog (`DATA_DIR`), unika e-postadresser och sluggar per körning (tidsstämpel), id slås upp via slug; GitHub Actions på pull request och `Main-Real` (lint, typecheck, build, test); `playwright` som devDependency (BE-01). Webbläsarmatris: B-8.
- **Verifiering:** `npm test` går grönt två gånger i rad mot samma databas; en pull request med ett medvetet fel blir röd i Actions (A:1026).
- **Status:** Öppen – belagd 2026-11-03; väntar på beslut B-8

### SN-07 Hälsokontrollen ser bara `SELECT 1`, fel loggas inte strukturerat och ingen övervakar utifrån
- **Källa:** A/M28, A/rad-430, D#10; se SN-01, SD-05
- **Fil och rad:** `src/app/api/health/route.ts:5-13`; `src/app/api/admin/upload/route.ts:79`; `src/lib/db/bootstrap.ts:54`; `fly.toml:26`; `fly.toml:42-47`
- **Kodrad:** `getDb().prepare("SELECT 1").get();` — `src/app/api/health/route.ts:8`; `return Response.json({ ok: false }, { status: 503 });` — `src/app/api/health/route.ts:11`; `console.error("Uppladdning misslyckades", err);` — `src/app/api/admin/upload/route.ts:79`; `Skapade administratören ${email}` — `src/lib/db/bootstrap.ts:54`; `auto_extend_size_limit = "10gb"` — `fly.toml:26`; `interval = "30s"` — `fly.toml:44`
- **Saknas:** `src/instrumentation.ts`
- **Belägg:** `node_modules/next/dist/docs/01-app/02-guides/instrumentation.md:72` — ``Next.js calls `register` in all environments``
- **Felscenario:** `/api/health` svarar 200 så länge en `SELECT 1` går igenom. En full volym (taket 10 GB på `fly.toml:26`, utan larm), en skrivskyddad databas (`SQLITE_READONLY` efter fel ägarskap, SD-18) eller fel i uppladdningar märks inte, och rutten sväljer felet (rad 10–11) utan att logga orsaken. Två `console`-anrop är all loggning i `src/`; ingen `instrumentation.ts` med `onRequestError` finns, så fel i server actions och sidor syns bara som rader i `fly logs` som ingen läser. Ingen extern övervakning anropar sajten – maskinen stoppar sig själv, så Flys eget intervall på 30 s säger inget om vad besökare får.
- **Åtgärd:** Hälsokontrollen gör ett skrivprov och `fs.statfsSync(DATA_DIR)` med gräns (A/rad-430) och loggar orsaken vid 503; `src/instrumentation.ts` med `onRequestError` bakom `NEXT_RUNTIME === "nodejs"` (A och D är överens; `register` körs i alla miljöer enligt belägget) – hanteraren får sökväg, frågesträng och rubriker, så vad som får loggas avgörs av B-17; extern övervakning mot `/api/health` var 30–60 minut (A ≥ 30 min, D ~60 min: ett parameterval, ingen motsägelse) plus larm när backupen uteblir (D#10).
- **Verifiering:** Skrivskyddad `DATA_DIR` lokalt ger 503 med loggad orsak på `/api/health`; ett kastat fel i en action ger en strukturerad loggrad (A:1008-1010).
- **Status:** Öppen – belagd 2026-11-03; väntar på beslut B-17

### SN-08 Produktionsimagen (standalone + sharp) provas aldrig före deploy
- **Källa:** A/L37
- **Fil och rad:** `next.config.ts:22`; `next.config.ts:25`; `tests/e2e.mjs:4-5`; `Dockerfile:23-43`
- **Kodrad:** `output: "standalone",` — `next.config.ts:22`; `serverExternalPackages: ["better-sqlite3", "sharp", "bcryptjs"],` — `next.config.ts:25`; `EXAM_STATS_URL=http://127.0.0.1:9 npm run dev` — `tests/e2e.mjs:5`; `COPY --from=build --chown=statlin:statlin /app/.next/standalone ./` — `Dockerfile:32`
- **Felscenario:** e2e körs mot `npm run dev` (rad 5) på Windows; produktionen är standalone-bygget i Docker med sharps Linux-binär. Allt som bara går sönder i standalone – saknade libvips-bibliotek (minnesanteckning: ett lokalt standalone-bygge hänger i admin), en fil som inte spåras (`outputFileTracingExcludes`), ett skript som inte kopieras (`Dockerfile:35-37`) – upptäcks först efter `fly deploy`. Docker finns inte lokalt (bara Flys fjärrbyggare), så A:s verifiering "i Docker/Linux" går inte att köra på den här datorn.
- **Åtgärd:** Kör smoke + e2e mot imagen i CI (`docker build` + `docker run` med tom `DATA_DIR` på en Linux-runner) som en del av SN-06; alternativt `fly deploy` till en separat test-app. Var det ska köras: B-21.
- **Verifiering:** CI-jobbet bygger imagen, och `node tests/smoke.mjs http://127.0.0.1:3000` plus e2e:s bilduppladdning går grönt mot containern innan `fly deploy`.
- **Status:** Öppen – belagd 2026-11-03; väntar på beslut B-21

### SN-09 README beskriver Railway och grenen `main`, har en tom kontotabell och saknar överlämning
- **Källa:** A/L20, A/steg-22, D#2; se ST-19
- **Fil och rad:** `README.md:53-55`; `README.md:139`; `Dockerfile:17`; `Dockerfile:39-40`; `.env.example:19-20`
- **Kodrad:** `| Konto | Roll | Används av |` — `README.md:53`; `Ett konto per post i styrelsen, 13 stycken.` — `README.md:55`; ``Skapa ett projekt från GitHub-repot (gren `main`).`` — `README.md:139`; `# Railway skickar tjänstens variabler som byggargument när de deklareras här.` — `Dockerfile:17`; `(Railway: x-real-ip, Fly.io: fly-client-ip)` — `.env.example:19`
- **Saknar:** `Main-Real` i `README.md`; `Överlämning` i `README.md`
- **Felscenario:** Tabellen på rad 53–54 har rubrik och avgränsare men ingen rad – texten på rad 55 renderas som löpande text direkt efter en tom tabell. Deploy-avsnittet säger Railway och `main` (rad 139) medan produktionen är Fly och grenen `Main-Real`; `Dockerfile:17`, `Dockerfile:39-40` och `.env.example:19-20` talar också om Railway. Det finns inget överlämningsavsnitt: nästa webbansvarig får inte veta att allt kör i en process (den minnesbaserade inloggningsspärren och `inflight`-kartan nollas vid varje kallstart), vilka konton och tjänster som finns, eller att större uppgraderingar bör ske i juni (D).
- **Åtgärd:** Rätta tabellen (en rad per post) och gren/värd; skriv avsnittet "Överlämning" (ägarskap U-01, deploy SN-03, återställning SN-02, en process och en maskin, årshjul); ta bort Railway-spåren eller flytta dem till en bilaga om andra värdar.
- **Verifiering:** README renderad på GitHub visar tabellen med rader; `grep -n "Railway" README.md Dockerfile .env.example` träffar bara bilagan; avsnittet Överlämning finns.
- **Status:** Åtgärdad 2026-11-03 (commit f64bf19); var Öppen – belagd 2026-11-03

### SN-10 e2e kan avsluta grönt fast ett steg kastat något som inte är ett `Error`
- **Källa:** A/L21, N4; se ST-25, SB-25
- **Fil och rad:** `tests/e2e.mjs:36-42`; `tests/e2e.mjs:1149-1158`
- **Kodrad:** ``results.push(`✗ ${name}: ${e.message.split("\n")[0]}`);`` — `tests/e2e.mjs:40`; `} catch {` — `tests/e2e.mjs:1149`; `process.exit(results.some((r) => r.startsWith("✗")) ? 1 : 0);` — `tests/e2e.mjs:1157`
- **Felscenario:** Kastar ett steg något annat än ett `Error` (en sträng, `undefined`, ett objekt utan `message`) blir `e.message` `undefined`, och `.split` på rad 40 kastar ett `TypeError` innan ✗-raden hunnit läggas i `results`. Det felet sväljs av den tomma `catch` på rad 1149, och `process.exit` på rad 1157 ser inga ✗ → avslutningskod 0, "allt grönt". Latent i dag: Playwright och `node:assert` kastar `Error`-instanser, så det kräver ett eget `throw` av något annat. A/rad-658:s exempel (inloggning mellan stegen) utlöser det inte – se R-04.
- **Åtgärd:** `String(e?.message ?? e)` på rad 40 och `process.exitCode = 1` i det yttre `catch`-blocket, så att allt som når det räknas som fel.
- **Verifiering:** Lägg tillfälligt `throw "x"` i ett steg → körningen avslutas med kod 1 och raden syns i utskriften.
- **Status:** Åtgärdad 2026-11-03 (commit 25fa5c1); var Öppen – delvis belagd (latent: inget befintligt steg kastar något annat än `Error`)

## 2 Säkerhet och dataförlust

Trettiosex punkter. Väntar på beslut: SD-01 (B-6, B-13), SD-02 (B-12), SD-32 (B-17). Delvis belagda: SD-22, SD-27, SD-29, SD-36. SD-30 är ett förslag, inte ett fel. Allvarligast: SD-36 (demoinnehåll i produktionen) och SD-01 (32 MB kropp utan inloggning).

### SD-01 Server actions tar emot 32 MB från vem som helst, och proxylagret buffrar kroppen före kakkontrollen
- **Källa:** A/M23, A/rad-368, N2; se SD-02
- **Fil och rad:** `next.config.ts:30-39`; `src/proxy.ts:11-22`; `src/proxy.ts:41`; `fly.toml:40`; `fly.toml:51`
- **Kodrad:** `bodySizeLimit: "32mb",` — `next.config.ts:33`; `proxyClientMaxBodySize: "32mb",` — `next.config.ts:38`; `return examStatsRedirect(request) ?? NextResponse.next();` — `src/proxy.ts:14`; `if (!request.cookies.has("statlin_session")) {` — `src/proxy.ts:16`; `matcher: ["/admin/:path*", "/tentastatistik", "/tentastatistik/:kod"],` — `src/proxy.ts:41`; `hard_limit = 250` — `fly.toml:40`; `memory = "1gb"` — `fly.toml:51`
- **Belägg:** `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/serverActions.md:61` — `By default, the maximum size of the request body sent to a Server Action is 1MB`; `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/proxyClientMaxBodySize.md:7` — `Next.js automatically clones the request body and buffers it in memory`; `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/proxyClientMaxBodySize.md:9` — `By default, the maximum body size is **10MB**`; `node_modules/next/dist/server/lib/server-action-request-meta.js:38` — `const isMultipartAction = Boolean(req.method === 'POST'`; `node_modules/next/dist/server/lib/server-action-request-meta.js:40` — `const isPossibleServerAction = Boolean(isFetchAction || isURLEncodedAction || isMultipartAction);`; `node_modules/next/dist/server/app-render/action-handler.js:513` — `const defaultBodySizeLimit = '1 MB';`; `node_modules/next/dist/server/app-render/action-handler.js:690` — `// Multipart POST, but not a fetch action.`; `node_modules/next/dist/server/app-render/action-handler.js:719` — `if (!areAllActionIdsValid(formData, serverModuleMap)) {`; `node_modules/next/dist/server/next-server.js:1224` — `body: hasRequestBody ? requestData.body.cloneBodyStream() : undefined`; `node_modules/next/dist/server/body-streams.js:30` — `const DEFAULT_BODY_CLONE_SIZE_LIMIT = 10 * 1024 * 1024`; `node_modules/next/dist/server/lib/router-utils/resolve-routes.js:125` — `const bodySizeLimit = config.experimental.proxyClientMaxBodySize;`; `node_modules/next/dist/server/config-shared.js:289` — `proxyClientMaxBodySize: 10485760,`
- **Felscenario:** Två lager. (1) Varje `POST` med `multipart/form-data` mot vilken sida som helst räknas som en möjlig server action (`server-action-request-meta.js:38-40`). Kroppen läses in och tolkas som `FormData` upp till `bodySizeLimit` *innan* action-id:t kontrolleras (`action-handler.js:690-719`) – utan kaka, utan inloggning. Gränsen är höjd från Nexts 1 MB till 32 MB för dokumentformulärets skull (`next.config.ts:32-33`). Några parallella 32 MB-anrop mot en maskin med 1 GB minne och 250 samtidiga anslutningar räcker för att fälla den. (2) För allt som matchern träffar (rad 41: `/admin/*` och `/tentastatistik*`) klonar Next kroppen i minnet upp till `proxyClientMaxBodySize` (satt till 32 MB, rad 38) innan proxyn ens körs (`next-server.js:1224`, `resolve-routes.js:125-126`). `/tentastatistik` passerar dessutom proxyn utan kakkontroll (rad 13–14), så även den vägen är öppen för alla. A:s åtgärdsförslag (A/rad-901: ta bort nyckeln) sänker bara taket till 10 MB – kopian finns kvar. Minnesåtgången är inte mätt; mekanismen är belagd i Nexts kod.
- **Åtgärd:** Sänk `bodySizeLimit` till standard och skicka filer via `/api/admin/upload` (A), eller behåll server actions för kvittofilen (C/rad-48) – B-6. Proxyns kopia: krymp matchern till det som behöver kakkontroll och/eller ta bort `/tentastatistik`-genomsläppet – B-13. Lägg en rubrikkontroll av `content-length` i proxyn som första spärr.
- **Verifiering:** `curl -X POST -F "x=@33MB.bin" https://statlin-web.fly.dev/` ger 413 inom en sekund utan att minnet i `fly machine status` rör sig; samma mot `/tentastatistik` och `/admin` (utan kaka) ger 413 eller 302 före kroppen är läst (A:1017 testar 33 MB).
- **Status:** Öppen – belagd 2026-11-03; väntar på beslut B-6, B-13

### SD-02 Uppladdningsrutten buffrar hela filen i minnet utan storlekskontroll före läsning
- **Källa:** A/M4; se SD-01
- **Fil och rad:** `src/app/api/admin/upload/route.ts:28-45`; `src/proxy.ts:41`; `src/lib/media-store.ts:36-38`; `src/lib/media-store.ts:87-92`
- **Kodrad:** `const user = await getSessionUser();` — `src/app/api/admin/upload/route.ts:33`; `fd = await request.formData();` — `src/app/api/admin/upload/route.ts:39`; `if (file.size > MAX_IMAGE_BYTES) throw new MediaError("Bilden är för stor (max 25 MB).");` — `src/lib/media-store.ts:37`; `const buffer = Buffer.from(await file.arrayBuffer());` — `src/lib/media-store.ts:38`; `const buffer = Buffer.from(await file.arrayBuffer());` — `src/lib/media-store.ts:92`
- **Saknar:** `content-length` i `src/app/api/admin/upload/route.ts`
- **Felscenario:** Rutten ligger under `/api/admin`, som proxyns matcher (`/admin/:path*`) inte täcker, så ingen kopia tas där – men `request.formData()` på rad 39 läser hela kroppen till minnet innan storleken kontrolleras (rad 37 i `media-store.ts`), och `arrayBuffer()` på rad 38/92 kopierar den en gång till. Sessionen kontrolleras först (rad 33–35), så anropet kräver inloggning; en inloggad användare, eller ett script med en stulen kaka, kan ändå skicka en 2 GB-fil och fälla processen. Ingen `content-length`-kontroll finns i rutten.
- **Åtgärd:** Avvisa anrop med `content-length` över `MAX_FILE_BYTES` före `formData()`, och räkna byte i en `TransformStream` som avbryter när gränsen passeras (A/rad-137–143). Vilken av varianterna som räcker: B-12.
- **Verifiering:** Inloggad `curl -F "file=@40MB.bin" -F purpose=file /api/admin/upload` ger 413 före uppladdningen är klar (A:1017).
- **Status:** Öppen – belagd 2026-11-03; väntar på beslut B-12

### SD-03 Krypteringsnyckeln för server actions slumpas per bygge – varje deploy ger "Failed to find Server Action" för öppna flikar
- **Källa:** A/M19; se SN-03
- **Fil och rad:** `.dockerignore:3`; `Dockerfile:20-21`; `fly.toml:15-18`
- **Kodrad:** `.next` — `.dockerignore:3`; `RUN npm run build` — `Dockerfile:21`; `SITE_URL = "https://statlin-web.fly.dev"` — `fly.toml:16`
- **Saknar:** `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` i `fly.toml`; `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` i `Dockerfile`; `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` i `README.md`
- **Belägg:** `node_modules/next/dist/docs/01-app/02-guides/self-hosting.md:159` — `a unique encryption key is generated for each build`; `node_modules/next/dist/docs/01-app/02-guides/self-hosting.md:161` — `Failed to find Server Action`; `node_modules/next/dist/docs/01-app/02-guides/self-hosting.md:163` — `Set a consistent encryption key using the`; `node_modules/next/dist/docs/01-app/02-guides/self-hosting.md:166` — `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=your-generated-key next build`; `node_modules/next/dist/docs/01-app/02-guides/self-hosting.md:169` — `The key is embedded in the build output and used automatically at runtime.`; `node_modules/next/dist/build/index.js:652` — `// Generate a random encryption key for this build.`; `node_modules/next/dist/server/app-render/encryption-utils-server.js:96` — `const providedKey = process.env.NEXT_SERVER_ACTIONS_ENCRYPTION_KEY;`; `node_modules/next/dist/server/app-render/action-handler.js:381` — `const handleUnrecognizedAction = (err, statusCode)=>{`; `node_modules/next/dist/server/app-render/action-handler.js:389` — `res.setHeader(_approuterheaders.NEXT_ACTION_NOT_FOUND_HEADER, '1');`; `node_modules/next/dist/client/components/router-reducer/reducers/server-action-reducer.js:104` — `if (unrecognizedActionHeader === '1') {`
- **Felscenario:** Varje `fly deploy` bygger från en ren kontext (`.next` utesluts, `.dockerignore:3`) och `next build` genererar en ny nyckel (`build/index.js:652`). Den som har adminpanelen öppen när en ny version rullas ut får vid nästa sparning "Failed to find Server Action" (servern svarar med `NEXT_ACTION_NOT_FOUND_HEADER`), och det som stod i formuläret är borta eftersom `ActionForm` saknar felhantering (SD-04). Med en fast nyckel i miljön (`self-hosting.md:163-169`) kan en äldre flik fortsätta anropa actions som fortfarande finns. Nyckeln blir en hemlighet i deploy-flödet: lokalt i `deploy.mjs` eller som GitHub-secret om deployen flyttar dit (B-1).
- **Åtgärd:** Generera nyckeln en gång (`openssl rand -base64 32`), sätt `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` som byggargument i Dockerfile/`fly deploy --build-secret` och dokumentera i README; informera i adminpanelen när en ny version finns (`deploymentId` hjälper inte – se R-17).
- **Verifiering:** Bygg två gånger med samma nyckel och jämför `.next/server/server-reference-manifest.json`: action-id:na är identiska; ett formulär öppnat före deploy kan sparas efter.
- **Status:** Öppen – belagd 2026-11-03

### SD-04 `ActionForm` har ingen felhantering och appen saknar felsidor – ett kastat fel i en action tömmer hela sidan
- **Källa:** A/M30, A/L13; se SD-05
- **Fil och rad:** `src/components/admin/action-form.tsx:44-61`; `src/components/admin/action-form.tsx:78-92`; `src/app/admin/_actions/users.ts:43-45`; `src/app/admin/_actions/users.ts:60-65`
- **Kodrad:** `const [state, formAction, pending] = useActionState(action, {});` — `src/components/admin/action-form.tsx:46`; `startTransition(() => formAction(fd));` — `src/components/admin/action-form.tsx:88`; `const clash = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(d.email, id ?? -1);` — `src/app/admin/_actions/users.ts:44`; `.run({ ...d, hash: await hashPassword(password) });` — `src/app/admin/_actions/users.ts:65`
- **Saknas:** `src/app/error.tsx`; `src/app/global-error.tsx`; `src/app/admin/error.tsx`
- **Belägg:** `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md:96` — ``wraps `loading.js`, `not-found.js`, `page.js`, and nested `layout.js` files in a React error boundary``; `node_modules/next/dist/client/components/router-reducer/reducers/server-action-reducer.js:333` — `// When the server action is rejected we don't update the state and instead call the reject handler of the promise.`; `node_modules/next/dist/client/components/unstable-rethrow.browser.js:14` — `if ((0, _isnextroutererror.isNextRouterError)(error) || (0, _bailouttocsr.isBailoutToCSRError)(error)) {`; `node_modules/next/dist/client/components/navigation.js:57` — `unstable_isUnrecognizedActionError: function() {`
- **Felscenario:** `useActionState` (rad 46) hanterar bara det en action *returnerar*. Kastar actionen – en SQLite-krock på `UNIQUE(email)` som hinner förbi kontrollen på rad 44 (två administratörer sparar samma adress samtidigt), ett nätverksfel, ett okänt action-id efter deploy (SD-03) – avvisas löftet (`server-action-reducer.js:333`) och felet bubblar till närmaste felgräns. Appen har ingen `error.tsx` alls (`src/app/` innehåller bara `layout.tsx` och `not-found.tsx`, `ls` 2026-11-03), så Nexts inbyggda felsida ersätter hela adminpanelen och formulärets innehåll är borta. `unstable_rethrow`/`unstable_isUnrecognizedActionError` (`navigation.js:57-61`) finns för att skilja Nexts egna fel (omdirigering) från riktiga.
- **Åtgärd:** Fånga fel i `onSubmit` (`try/await formAction` i transitionen med `unstable_rethrow`), visa "Kunde inte spara – försök igen" och behåll fälten; lägg `src/app/admin/error.tsx` och `src/app/error.tsx` (+ `global-error.tsx`, SD-05/B-15) som sista skyddsnät.
- **Verifiering:** Lägg tillfälligt `throw new Error("x")` i `saveUser` → formuläret visar ett felmeddelande och behåller texten; sidan byts inte ut (A:1040 för felgränsen).
- **Status:** Öppen – belagd 2026-11-03

### SD-05 Knappar som anropar actions utan `await` eller `catch` – felet försvinner eller fäller sidan
- **Källa:** A/M14, D#10; se SD-04, SN-07
- **Fil och rad:** `src/components/admin/gallery-manager.tsx:76-92`; `src/components/admin/gallery-manager.tsx:128-131`; `src/components/admin/board-controls.tsx:9-16`; `src/components/admin/logout-others.tsx:13-18`; `src/components/admin/markdown-editor.tsx:78-81`; `src/app/admin/_actions/events.ts:147-150`; `src/app/admin/_actions/events.ts:180-190`; `src/app/admin/_actions/content.ts:92-95`
- **Kodrad:** `error: (e as Error).message` — `src/components/admin/gallery-manager.tsx:82`; `startTransition(() => reorderEventImages(eventId, ids));` — `src/components/admin/gallery-manager.tsx:90`; `startTransition(() => reorderEventImages(eventId, list.map((x) => x.id)));` — `src/components/admin/gallery-manager.tsx:130`; `onClick={() => start(() => moveBoardMember(id, -1))}` — `src/components/admin/board-controls.tsx:11`; `await logoutOtherSessions();` — `src/components/admin/logout-others.tsx:15`; `startPreview(async () => setHtml(await previewMarkdown(value)));` — `src/components/admin/markdown-editor.tsx:80`; `if (!row || !canEditImages(user, row)) throw new Error("Saknar behörighet.");` — `src/app/admin/_actions/events.ts:149`; `if (!isEditor(user)) throw new Error("Saknar behörighet.");` — `src/app/admin/_actions/content.ts:94`
- **Saknas:** `src/app/error.tsx`; `src/app/global-error.tsx`; `src/app/admin/error.tsx`
- **Belägg:** `node_modules/next/dist/client/components/layout-router.js:454` — `(0, _jsxruntime.jsx)(_errorboundary.ErrorBoundary, {`; `node_modules/next/dist/client/components/layout-router.js:455` — `errorComponent: error,`
- **Felscenario:** Omsortering (rad 90, 130), radering, omslag, flytt av styrelseledamot (rad 11, 14), utloggning av andra enheter (rad 14–17) och förhandsgranskning (rad 80) startar en action i en transition och tittar aldrig på resultatet. Actions kastar vid behörighetsfel (`events.ts:149`, `:183`, `content.ts:94`) och vid databasfel. Enda `catch` i galleriet gäller uppladdningen (rad 81–83). Ett kastat fel i en transition når Nexts `ErrorBoundary` i `layout-router.js:454-457`, som utan `error.tsx` visar standardfelsidan över hela appen; en utebliven sessionskaka (SD-27) ger samma sak. Användaren ser antingen ingenting (omsorteringen "fastnar" i gamla läget efter nästa `refresh`) eller en vit sida.
- **Åtgärd:** Låt actions returnera `{ ok, error }` i stället för att kasta, visa fel i komponenten; `src/app/error.tsx`, `src/app/admin/error.tsx` och `src/app/global-error.tsx` (A och D är överens om `error.tsx`; omfånget bekräftas i B-15).
- **Verifiering:** Logga in som utskottskonto, öppna ett annat utskotts galleri via adressen och dra om bilderna → ett felmeddelande visas i panelen i stället för en vit sida (A:1008-1010).
- **Status:** Öppen – belagd 2026-11-03; väntar på beslut B-15

### SD-06 Dolda flikar behåller gamla formulärvärden och skriver över nyare sparningar utan versionskontroll
- **Källa:** A/M31; se SD-28
- **Fil och rad:** `src/components/admin/markdown-editor.tsx:35`; `src/components/admin/fields.tsx:97-100`; `src/components/admin/image-field.tsx:28`; `src/app/admin/_actions/news.ts:66-69`; `next.config.ts:20`
- **Kodrad:** `const [value, setValue] = useState(defaultValue);` — `src/components/admin/markdown-editor.tsx:35`; `const [title, setTitle] = useState(defaultTitle);` — `src/components/admin/fields.tsx:97`; `const [image, setImageState] = useState<ImageRef | null>(defaultImage);` — `src/components/admin/image-field.tsx:28`; `UPDATE news SET title=@title, slug=@slug, excerpt=@excerpt` — `src/app/admin/_actions/news.ts:67`; `cacheComponents: true,` — `next.config.ts:20`
- **Belägg:** `node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md:17` — `Instead of unmounting pages on navigation, Next.js hides them`; `node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md:19` — `Next.js preserves up to 3 routes.`; `node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md:146` — `Activity preserves form input values (text fields, selected options, checkbox states), submission results, and status messages across navigations.`; `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-router.md:177` — `the App Router preserves Client Component state across navigations`; `node_modules/next/dist/client/components/layout-router.js:519` — `(0, _jsxruntime.jsx)(_react.Activity, {`; `node_modules/next/dist/client/components/bfcache-state-manager.js:13` — `const MAX_BF_CACHE_ENTRIES = process.env.__NEXT_CACHE_COMPONENTS ? 3 : 1;`
- **Felscenario:** Med `cacheComponents` (rad 20) göms upp till tre sidor i `<Activity>` i stället för att avmonteras (`layout-router.js:518-521`, `bfcache-state-manager.js:13`). Redigerarna initierar sitt tillstånd en gång från `defaultValue` (rad 35, 97–99, 28). Öppnar Info nyheten X, går till listan, rättar X på telefonen (eller en kollega gör det), och går tillbaka till fliken: formuläret visar den gamla texten. `UPDATE` (`news.ts:66-69`) har ingen `updated_at`-jämförelse, så nästa "Spara" skriver tyst över den nyare versionen. Inte provat i webbläsare; mekanismen är belagd i Nexts dokumentation och kod.
- **Åtgärd:** `key={item.updated_at}` på formulären (nytt tillstånd när raden ändrats) och en `updated_at`-vakt i varje `UPDATE` ("Någon annan har sparat – ladda om") (`use-router.md:180` rekommenderar nyckel från data).
- **Verifiering:** A:1030-1031 – öppna samma inlägg i två flikar, spara i den ena, spara i den andra → den andra får ett fel i stället för att skriva över.
- **Status:** Öppen – belagd 2026-11-03

### SD-07 Nyhetsformuläret skickar alltid omslagsvärdet och raderar bilden om fältet kommer tomt
- **Källa:** A/M3; se SD-08
- **Fil och rad:** `src/app/admin/_actions/news.ts:53-71`; `src/app/admin/_actions/events.ts:70-73`; `src/components/admin/image-field.tsx:56-58`; `src/components/admin/news-form.tsx:58`
- **Kodrad:** `if (d.cover_media_id !== existing.cover_media_id && !canUseImage(user, d.cover_media_id)) return badCover;` — `src/app/admin/_actions/news.ts:64`; `if (existing.cover_media_id !== d.cover_media_id) await deleteMediaIfUnused(existing.cover_media_id);` — `src/app/admin/_actions/news.ts:70`; `const coverMediaId = fd.get("cover_media_id__changed") === "1" ? d.cover_media_id : existing.cover_media_id;` — `src/app/admin/_actions/events.ts:72`; `<input type="hidden" name={name} value={image?.id ?? ""} />` — `src/components/admin/image-field.tsx:56`; `{changed && <input type="hidden" name={` — `src/components/admin/image-field.tsx:58`
- **Saknar:** `cover_media_id__changed` i `src/app/admin/_actions/news.ts`
- **Felscenario:** `events.ts` rör omslaget bara när fältet markerats som ändrat (rad 72); `news.ts` jämför alltid formulärets värde med databasen (rad 64) och raderar det gamla omslaget om de skiljer sig (rad 70). Kommer `cover_media_id` tomt – fältet renderas med `image?.id ?? ""` (rad 56) och tömts av ett `form.reset()`, ett ofullständigt anrop eller en bildrad som försvunnit – blir omslaget `null`, `canUseImage(user, null)` är sant, och filen raderas från disk. Med `__changed`-vakten (som evenemangen har) hade värdet ignorerats.
- **Åtgärd:** Läs `cover_media_id__changed` i `saveNews` som i `saveEvent` (rad 72–73).
- **Verifiering:** A:1015-1016 – skicka nyhetsformuläret utan `cover_media_id` (DevTools) → omslaget ska vara kvar.
- **Status:** Öppen – belagd 2026-11-03

### SD-08 `changed`-flaggan i bildfältet nollställs aldrig, och evenemangets redigeringssida kopplar inte galleriets omslagsval till formuläret
- **Källa:** A/M35; se SD-07
- **Fil och rad:** `src/components/admin/image-field.tsx:29-34`; `src/components/admin/image-field.tsx:58`; `src/app/admin/_actions/events.ts:72-73`; `src/app/admin/_actions/events.ts:180-190`; `src/app/admin/evenemang/[id]/page.tsx:76`; `src/components/admin/event-images-editor.tsx:32`; `src/lib/admin/helpers.ts:19-24`
- **Kodrad:** `const [changed, setChanged] = useState(false);` — `src/components/admin/image-field.tsx:29`; `setChanged(true);` — `src/components/admin/image-field.tsx:32`; `if (coverMediaId !== existing.cover_media_id && !canUseImage(user, coverMediaId, id)) return badCover;` — `src/app/admin/_actions/events.ts:73`; `UPDATE events SET cover_media_id = ?, updated_at = ?` — `src/app/admin/_actions/events.ts:186`; `await deleteMediaIfUnused(event.cover_media_id);` — `src/app/admin/_actions/events.ts:187`; `<GalleryManager eventId={event.id}` — `src/app/admin/evenemang/[id]/page.tsx:76`; `<GalleryManager eventId={eventId} initial={images} coverMediaId={cover?.id ?? null} onCoverChange={setCover} />` — `src/components/admin/event-images-editor.tsx:32`; `if (!m || m.kind !== "image") return false;` — `src/lib/admin/helpers.ts:23`
- **Saknar:** `onCoverChange` i `src/app/admin/evenemang/[id]/page.tsx`
- **Felscenario:** `setChanged(true)` sätts vid första uppladdningen (rad 30–34) och nollställs aldrig, så varje senare sparning skickar `__changed=1` med fältets id. På redigeringssidan renderas galleriet utan `onCoverChange` (rad 76, till skillnad från rad 32 i redigeringspanelen), så ett omslag valt i galleriet (`setEventCover`, rad 183–187: UPDATE + radering av det gamla) syns inte i bildfältet. Sparar användaren därefter formuläret skickas det gamla id:t: antingen har bilden raderats (rad 187) och `canUseImage` svarar falskt (rad 23) → "badCover"-fel, eller så finns den kvar och skriver över galleriets val – varpå rad 187:s motsvarighet i `saveEvent` raderar det nyss valda omslaget.
- **Åtgärd:** Skicka `onCoverChange` från redigeringssidan och nollställ `changed` när `defaultImage` ändras (`key` på fältet); jämför id mot databasen i actionen i stället för mot klientens minne.
- **Verifiering:** A:1035-1036 – ladda upp omslag i fältet, välj ett annat i galleriet, spara formuläret → galleriets val ska stå kvar.
- **Status:** Öppen – belagd 2026-11-03

### SD-09 `deleteMediaIfUnused` räknar bara kolumnreferenser – bilder som ligger i Markdown eller i URL-fält raderas från disk
- **Källa:** A/M5, D#4; se ST-17, SD-30
- **Fil och rad:** `src/lib/media-store.ts:110-128`; `src/components/admin/markdown-editor.tsx:65-76`; `src/app/admin/_actions/content.ts:110-114`; `src/lib/admin/form.ts:53-58`
- **Kodrad:** `export async function deleteMediaIfUnused(mediaId: number | null | undefined) {` — `src/lib/media-store.ts:110`; `(SELECT COUNT(*) FROM committees WHERE logo_url LIKE '%' || (SELECT path_base FROM media WHERE id = @id) || '%') AS n` — `src/lib/media-store.ts:123`; `if (used.n > 0) return;` — `src/lib/media-store.ts:126`; `if (res.image) insertText(` — `src/components/admin/markdown-editor.tsx:70`; `description_md: zText(20000, "Beskrivningen"),` — `src/app/admin/_actions/content.ts:112`; `.refine((v) => v === "" || /^(https?:\/\/|mailto:|\/)/i.test(v), "Ange en giltig länk (börjar med https://).");` — `src/lib/admin/form.ts:58`
- **Felscenario:** Räkningen (rad 115–123) tittar på sju FK-kolumner och på `committees.logo_url`. Bilder som redigeraren lägger in i brödtexten som `![…](/media/…)` (rad 70), i utskottsbeskrivningar (`description_md`) eller i länkfält som får börja med `/` (`form.ts:58`) räknas inte. Byter någon omslag på ett inlägg vars bild också används i en text, raderas filen (rad 126 → radering), och texten får en trasig bild – utan varning och utan ångra. D#4 vill dessutom att huvudkopian raderas i samma veva (SD-30).
- **Åtgärd:** Räkna även `LIKE '%' || path_base || '%'` över `news.body_md`, `events.body_md`, `pages.body_md`, `committees.description_md`, `links.url`, `resources.url`, `documents.url` (A/M5), eller inför en referenstabell `media_refs` som fylls vid sparning.
- **Verifiering:** A:1018-1019 – lägg en galleribild i en nyhetstext, byt nyhetens omslag från samma bild → filen ska finnas kvar på `/media/…`.
- **Status:** Öppen – belagd 2026-11-03

### SD-10 Utskottskonton kan sätta vilken adress eller vilken bild som helst som logga – och radera andras bilder på köpet
- **Källa:** A/L5; se ST-01
- **Fil och rad:** `src/app/admin/_actions/content.ts:110-134`; `src/app/admin/_actions/content.ts:155-163`; `src/components/admin/content-forms.tsx:36`; `src/components/admin/content-forms.tsx:66`; `src/app/admin/bilder/page.tsx:36-38`
- **Kodrad:** `logo_media_id: zOptionalId,` — `src/app/admin/_actions/content.ts:113`; `logo_url: zText(300),` — `src/app/admin/_actions/content.ts:114`; `if (!id || !canEditCommittee(user, id)) return forbidden;` — `src/app/admin/_actions/content.ts:125`; `let logoUrl = d.logo_url || null;` — `src/app/admin/_actions/content.ts:130`; `logoUrl = toImageRef(m)?.src ?? logoUrl;` — `src/app/admin/_actions/content.ts:133`; `await deleteMediaIfUnused(old?.id);` — `src/app/admin/_actions/content.ts:162`; `<input type="hidden" name="logo_url" value={c.logo_url ?? ""} />` — `src/components/admin/content-forms.tsx:36`; `<ImageField name="logo_media_id" label="Ladda upp ny logga" defaultImage={null}` — `src/components/admin/content-forms.tsx:66`; `if (!canManageImages(user)) redirect("/admin?nekad=1");` — `src/app/admin/bilder/page.tsx:38`
- **Felscenario:** `saveCommittee` kräver bara `canEditCommittee` (rad 125) – ett utskottskonto får spara sitt eget utskott. `logo_url` är fri text (rad 114) som läses från ett dolt fält (rad 36) och sparas rakt av (rad 130): en extern adress (spårpixel, bild som byts ut senare) blir utskottets logga på startsidan. `logo_media_id` (rad 113) slås upp utan `canUseImage` (rad 131–133), så vilket media-id som helst – en annan persons porträtt – kan göras till logga, och när loggan sedan byts raderas den tidigare bilden om inget annat refererar den (rad 158–162). Sidan `/admin/bilder` spärras med `canManageImages` (rad 38), men det hindrar inte ett direkt anrop till actionen.
- **Åtgärd:** Ta bort `logo_url` ur formuläret (loggan sparas som `logo_media_id`, ST-01); kräv `canUseImage` eller `canManageImages` för loggbyte; validera eventuell URL mot `/media/` eller `/brand/`.
- **Verifiering:** A:1060-1061 – som utskottskonto, skicka `saveCommittee` med `logo_url=https://example.com/x.png` och med ett främmande `logo_media_id` → båda ska nekas.
- **Status:** Öppen – belagd 2026-11-03

### SD-11 Kontolåset kan användas för att stänga ute hela styrelsen – adresserna är kända och försöken loggas inte
- **Källa:** A/M24; se SD-12, SD-13
- **Fil och rad:** `src/app/admin/_actions/auth.ts:14-15`; `src/app/admin/_actions/auth.ts:46-54`; `src/app/admin/_actions/auth.ts:58`; `scripts/create-accounts.mjs:25-39`
- **Kodrad:** `const MAX_FAILED = 8;` — `src/app/admin/_actions/auth.ts:14`; `const LOCK_MINUTES = 15;` — `src/app/admin/_actions/auth.ts:15`; `const lock = failed >= MAX_FAILED ?` — `src/app/admin/_actions/auth.ts:50`; `db.prepare("UPDATE users SET failed_logins = ?, locked_until = ? WHERE id = ?").run(lock ? 0 : failed, lock, user.id);` — `src/app/admin/_actions/auth.ts:51`; `audit(user.id, "login", "user", user.id, "Loggade in");` — `src/app/admin/_actions/auth.ts:58`; `["ordforande@statlin.se", "Ordförande", "Ordförande", "admin", "styrelsen"],` — `scripts/create-accounts.mjs:26`
- **Felscenario:** Åtta felaktiga försök låser kontot i 15 minuter (rad 14–15, 49–51), oavsett varifrån. Adresserna är publika (`create-accounts.mjs:26-38` och sajtens kontaktsidor), så ett script som var kvart skickar åtta fel per adress håller alla tretton konton låsta för alltid. Räknaren nollställs i samma stund låset sätts (rad 51: `lock ? 0 : failed`), vilket gör cykeln exakt. Misslyckade försök loggas inte (bara lyckade, rad 58), så ingen märker attacken förrän någon ringer. Att produktionen använder adresserna är inte belagt i kod – bara i minnesanteckningen från 2026-10-31.
- **Åtgärd:** Lås per (konto, IP) eller exponentiell fördröjning i stället för hårt lås; logga misslyckade försök med IP (inom B-17:s ramar); larma administratörer vid lås; eller behåll låset men låt administratörer låsa upp i Konton.
- **Verifiering:** Åtta fel från en adress låser inte inloggningen från en annan; `audit_log` visar försöket.
- **Status:** Öppen – belagd 2026-11-03

### SD-12 Inloggningsspärren räknar per process och nollas vid varje kallstart
- **Källa:** A/M1; se SD-11
- **Fil och rad:** `src/app/admin/_actions/auth.ts:34-36`; `src/lib/auth/rate-limit.ts:1-18`; `fly.toml:33-35`
- **Kodrad:** ``if (rateLimitHit(`login:${clientIp(await headers())}`)) {`` — `src/app/admin/_actions/auth.ts:34`; `const attempts = new Map<string, { count: number; reset: number }>();` — `src/lib/auth/rate-limit.ts:2`; `const MAX_ATTEMPTS = 20;` — `src/lib/auth/rate-limit.ts:4`; `entry.count++;` — `src/lib/auth/rate-limit.ts:13`; `return entry.count > MAX_ATTEMPTS;` — `src/lib/auth/rate-limit.ts:17`; `auto_stop_machines = "stop"` — `fly.toml:33`
- **Felscenario:** Spärren ligger i en `Map` i processminnet (rad 2). Maskinen stoppas när ingen besöker sajten (`fly.toml:33`), så räknaren börjar om vid varje kallstart, och den skulle inte delas om appen någonsin kördes i mer än en process. A:s ursprungliga fynd (att spärren kom efter lösenordskontrollen) stämmer inte: `rateLimitHit` ligger före (rad 34) och det 21:a försöket stoppas (rad 17) – A nedgraderade själv. Kvar står att spärren är svag per design och räknar även lyckade inloggningar (rad 13 ökar alltid).
- **Åtgärd:** Flytta räknaren till en tabell i SQLite (`login_attempts` med IP-hash, tid) så att den överlever omstart; dokumentera i README (SN-09) att allt körs i en process.
- **Verifiering:** A:1012-1013 – 21 försök, `fly machine restart`, ett till → fortfarande spärrad.
- **Status:** Öppen – belagd 2026-11-03

### SD-13 Inloggningen avslöjar vilka konton som finns och räknar försök mot inaktiverade konton
- **Källa:** A/L3; se SD-11
- **Fil och rad:** `src/app/admin/_actions/auth.ts:40-54`
- **Kodrad:** `if (user?.locked_until && new Date(user.locked_until) > now) {` — `src/app/admin/_actions/auth.ts:42`; `return fail({ error: "Kontot är tillfälligt låst efter för många felaktiga försök. Försök igen om en stund." });` — `src/app/admin/_actions/auth.ts:43`; `if (!user || !ok || !user.active) {` — `src/app/admin/_actions/auth.ts:47`; `if (user) {` — `src/app/admin/_actions/auth.ts:48`
- **Felscenario:** Låst-meddelandet (rad 43) visas bara för konton som finns, så åtta fel mot en adress avslöjar om den är ett konto (låst-text) eller inte (vanligt fel). Ett inaktiverat konto räknar också upp `failed_logins` (rad 47–51) och kan låsas, vilket är harmlöst men skräpar ned fälten; viktigare är att `!user.active` ger samma "Fel e-postadress eller lösenord" som ett fel lösenord, så en avstängd person får ingen förklaring.
- **Åtgärd:** Samma svarstext för låst, fel och inaktivt; räkna inte försök mot inaktiva konton; ge inaktiverade en egen text först efter rätt lösenord (ingen informationsläcka då).
- **Verifiering:** Åtta fel mot en okänd adress och mot en känd ger identisk text.
- **Status:** Öppen – belagd 2026-11-03

### SD-14 `seed --demo` spärrar bara på evenemang, skapar demokonton utan tvångsbyte och skriver över kurskodlistan
- **Källa:** A/M20; se SD-36
- **Fil och rad:** `scripts/seed.ts:50-70`; `scripts/seed.ts:136-145`; `src/lib/db/migrations.ts:51`; `src/lib/data/exam-stats.ts:173-176`; `README.md:103`; `README.md:119`; `README.md:250`
- **Kodrad:** `const existing = (db.prepare("SELECT COUNT(*) AS n FROM events").get() as { n: number }).n;` — `scripts/seed.ts:51`; `console.log("Demodata finns redan – hoppar över.");` — `scripts/seed.ts:53`; `const password = process.env.DEMO_PASSWORD ?? generatePassword();` — `scripts/seed.ts:66`; `INSERT INTO users (email, name, post, role, committee_id, design, password_hash) VALUES` — `scripts/seed.ts:68`; `setSetting.run("exam_stats_codes", JSON.stringify(demoStats.map((s) => s.code)));` — `scripts/seed.ts:144`; `must_change_password INTEGER NOT NULL DEFAULT 0,` — `src/lib/db/migrations.ts:51`; `if (codes.length === 0) return { stats: null, fetchedAt: null, unavailable: true };` — `src/lib/data/exam-stats.ts:175`; `npm run seed -- --demo` — `README.md:101`; `Grunddata (och demodata)` — `README.md:353`
- **Felscenario:** Spärren (rad 51–55) tittar bara på `events`: har någon raderat demoevenemangen men inte resten går seeden igen och lägger tillbaka dem. Demokontona `info@`, `scb@`, `ubu@`, `grafiskt@` (rad 57–61) skapas utan `must_change_password` (rad 68 saknar kolumnen; standard 0 enligt `migrations.ts:51`) med `DEMO_PASSWORD` eller ett slumpat lösenord som bara skrivs i terminalen. Kodlistan för tentastatistiken skrivs över med två demokoder (rad 144), så sajten tror att källan bara har `732G33` och `TATA24` tills listan förnyats. README nämner `--demo` tre gånger utan varning för produktion.
- **Åtgärd:** Vägra `--demo` när `NODE_ENV=production` eller `SITE_URL` inte är localhost; sätt `must_change_password = 1` på demokonton; rör inte `exam_stats_codes` om nyckeln finns; varningstext i README. Saneringen av produktionen: U-09.
- **Verifiering:** A:1042-1043 – `SITE_URL=https://statlin.se npm run seed -- --demo` avbryter med ett fel; `SELECT must_change_password FROM users WHERE email='scb@statlin.se'` efter lokal seed är 1.
- **Status:** Öppen – belagd 2026-11-03

### SD-15 Två olika första-administratörsflöden med olika standardadresser; devcontainern seedar `admin@` med ett publikt lösenord
- **Källa:** A/M18, N5; se SD-36
- **Fil och rad:** `scripts/seed.ts:28-37`; `src/lib/db/bootstrap.ts:48-55`; `.env.example:5-7`; `.devcontainer/devcontainer.json:5-11`
- **Kodrad:** `const email = process.env.ADMIN_EMAIL ?? "admin@statlin.se";` — `scripts/seed.ts:31`; `const password = process.env.ADMIN_PASSWORD ?? generatePassword();` — `scripts/seed.ts:32`; `).run(email, "Webbansvarig", "Administratör", committeeId("styrelsen"), await hashPassword(password), process.env.ADMIN_PASSWORD ? 0 : 1);` — `scripts/seed.ts:36`; `const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();` — `src/lib/db/bootstrap.ts:48`; `if (count("users") === 0 && email && password) {` — `src/lib/db/bootstrap.ts:50`; `ADMIN_EMAIL=webb@statlin.se` — `.env.example:6`; `ADMIN_PASSWORD=byt-mig-till-nagot-langt` — `.env.example:7`; `"ADMIN_PASSWORD": "admin-statlin-2026",` — `.devcontainer/devcontainer.json:7`; `"postCreateCommand": "npm ci && npm run seed -- --demo && npm run build",` — `.devcontainer/devcontainer.json:11`
- **Felscenario:** Seeden skapar `admin@statlin.se` om `ADMIN_EMAIL` saknas (rad 31) och – om `ADMIN_PASSWORD` är satt – *utan* tvångsbyte (rad 36: `? 0 : 1`). Bootstrap vid första start kräver både `ADMIN_EMAIL` och `ADMIN_PASSWORD` (rad 48–50) och sätter tvångsbyte. Exempelfilen föreslår `webb@` och platshållarlösenordet `byt-mig-till-nagot-langt` (rad 6–7), som blir ett riktigt konto om någon kopierar filen rakt av. Devcontainern (rad 7, 11) seedar `--demo` med `admin-statlin-2026` – samma lösenord som e2e-testet använder (`tests/e2e.mjs:4`) och som därmed står i ett publikt repo. En databas som skapats i devcontainern eller med e2e-lösenorden och sedan laddats upp till Fly skulle ha det kontot i produktion (SD-36).
- **Åtgärd:** Ett flöde: bootstrap skapar första administratören, seeden anropar samma funktion; vägra kända platshållare (`byt-mig…`, `admin-statlin-2026`); alltid `must_change_password = 1` för konton som skapas av skript.
- **Verifiering:** `ADMIN_PASSWORD=byt-mig-till-nagot-langt npm run seed` avbryter med fel; efter `npm run seed` med eget lösenord tvingas lösenordsbyte vid första inloggningen.
- **Status:** Öppen – belagd 2026-11-03

### SD-16 `create-admin.mjs` gör vilken befintlig adress som helst till administratör
- **Källa:** A/M6
- **Fil och rad:** `scripts/create-admin.mjs:36-44`; `README.md:167`
- **Kodrad:** `const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalized);` — `scripts/create-admin.mjs:37`; `"UPDATE users SET password_hash = ?, role = 'admin', active = 1, must_change_password = 1, failed_logins = 0, locked_until = NULL WHERE id = ?",` — `scripts/create-admin.mjs:40`; `db.prepare("DELETE FROM sessions WHERE user_id = ?").run(existing.id);` — `scripts/create-admin.mjs:42`; `node scripts/create-admin.mjs ordforande@statlin.se` — `README.md:163`
- **Felscenario:** README anvisar skriptet för lösenordsåterställning (rad 167). Körs det mot ett utskottskonto (`scb@statlin.se`) eller ett avstängt konto blir kontot administratör och aktivt (rad 40) utan att någon avsett det – ett rolltilldelningsfel som ser ut som en lösenordsåterställning. Låg sannolikhet, hög konsekvens; kräver SSH-åtkomst till maskinen.
- **Åtgärd:** Två lägen: `--reset` (bara lösenord, roll orörd) och `--make-admin` (kräver flaggan uttryckligen); skriv ut rollen före ändringen.
- **Verifiering:** `node scripts/create-admin.mjs scb@statlin.se` utan flagga ändrar inte rollen.
- **Status:** Öppen – belagd 2026-11-03

### SD-17 Bootstrap lägger tillbaka raderat grundinnehåll vid varje kallstart
- **Källa:** A/M12, B/tre-2; se F-04
- **Fil och rad:** `src/lib/db/bootstrap.ts:15-46`; `src/lib/db/index.ts:18-30`; `fly.toml:33`
- **Kodrad:** `if (count("committees") === 0) SEED_COMMITTEES.forEach((c, i) => insertCommittee.run({ ...c, sort_order: i * 10 }));` — `src/lib/db/bootstrap.ts:18`; `if (count("board_members") === 0) {` — `src/lib/db/bootstrap.ts:22`; `const insertPage = db.prepare("INSERT OR IGNORE INTO pages (slug, title, lead, body_md) VALUES (@slug, @title, @lead, @body_md)");` — `src/lib/db/bootstrap.ts:27`; `if (!db.prepare("SELECT 1 FROM settings WHERE key = 'seeded_links'").get()) {` — `src/lib/db/bootstrap.ts:31`; `if (count("documents") === 0) {` — `src/lib/db/bootstrap.ts:39`; `bootstrap(db);` — `src/lib/db/index.ts:27`; `auto_stop_machines = "stop"` — `fly.toml:33`
- **Felscenario:** `bootstrap()` körs vid första `getDb()` i varje process (`index.ts:27`), alltså efter varje kallstart (`fly.toml:33`). Tömmer styrelsen hela `board_members` inför ett nytt verksamhetsår (B/tre-2, F-04) kommer de tretton seedposterna tillbaka med tomma namn vid nästa start (rad 22–25); samma för utskott (rad 18) och dokument (rad 39). Sidor använder `INSERT OR IGNORE` (rad 27–28): en raderad sida återuppstår, men befintliga breddas inte. Länkarna seedas bara en gång (rad 31) – det mönstret borde gälla allt.
- **Åtgärd:** En `seeded_*`-flagga per tabell som i länkfallet, eller en samlad `bootstrap_version` i `settings`; seedning bara när flaggan saknas.
- **Verifiering:** A:1023, 1054-1055 – radera alla styrelseposter, starta om processen → tabellen är fortfarande tom.
- **Status:** Öppen – belagd 2026-11-03

### SD-18 Startskriptet kör som root, följer symlänkar vid `chown` och är skrivbart för appanvändaren
- **Källa:** A/M17
- **Fil och rad:** `scripts/docker-entrypoint.mjs:13-30`; `Dockerfile:30-40`
- **Kodrad:** `fs.chownSync(dir, uid, gid);` — `scripts/docker-entrypoint.mjs:14`; `if (entry.isDirectory()) chownRecursive(p);` — `scripts/docker-entrypoint.mjs:17`; `else fs.chownSync(p, uid, gid);` — `scripts/docker-entrypoint.mjs:18`; `if (process.getuid?.() === 0) {` — `scripts/docker-entrypoint.mjs:24`; `chownRecursive(dataDir);` — `scripts/docker-entrypoint.mjs:25`; `COPY --from=build --chown=statlin:statlin /app/scripts/docker-entrypoint.mjs ./scripts/docker-entrypoint.mjs` — `Dockerfile:37`; `# Ingen USER/VOLUME här: startskriptet körs som root, rättar ägarskapet på den monterade` — `Dockerfile:38`
- **Felscenario:** Skriptet körs som root (Dockerfile:38–39) och går igenom hela `/data` (rad 24–25). `fs.chownSync` följer symlänkar (rad 18), och en symlänk till en katalog klassas inte som katalog av `Dirent` – så en symlänk i `/data` som pekar på `/etc/passwd` byter ägare på målet vid nästa start. För att lägga dit en symlänk krävs redan skrivåtkomst till volymen (appen skriver bara vanliga filer), så det är en andra-stegs-risk. Allvarligare: skriptet ägs av `statlin` (rad 37) och körs av root vid varje start – kan appprocessen (som kör som `statlin`) skriva till `/app/scripts/`, blir en kodexekvering i appen root i containern vid nästa omstart.
- **Åtgärd:** `fs.lchownSync` och hoppa över symlänkar; kopiera startskriptet med `--chown=root:root` och läsrättigheter för övriga; överväg `fs.chownSync` bara på toppnivån plus `uploads/`.
- **Verifiering:** `ln -s /etc/hostname /data/x` i en testcontainer och omstart → `/etc/hostname` ägs fortfarande av root; `ls -l /app/scripts` visar root som ägare.
- **Status:** Öppen – belagd 2026-11-03

### SD-19 Inga säkerhetsrubriker utöver fyra grundläggande; CSP bara på `/media`, ingen HSTS
- **Källa:** A/L1
- **Fil och rad:** `next.config.ts:3-8`; `src/app/media/[...path]/route.ts:35-38`; `fly.toml:30`
- **Kodrad:** `{ key: "X-Content-Type-Options", value: "nosniff" },` — `next.config.ts:4`; `{ key: "X-Frame-Options", value: "SAMEORIGIN" },` — `next.config.ts:6`; `headers.set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox");` — `src/app/media/[...path]/route.ts:37`; `force_https = true` — `fly.toml:30`
- **Saknar:** `Content-Security-Policy` i `next.config.ts`; `Strict-Transport-Security` i `next.config.ts`
- **Belägg:** `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md:417` — `## Without Nonces`; `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md:426` — `script-src 'self' 'unsafe-inline'`; `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md:432` — `form-action 'self';`; `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md:433` — `frame-ancestors 'none';`
- **Felscenario:** Sidorna skickar nosniff, Referrer-Policy, X-Frame-Options och Permissions-Policy (rad 3–8) men ingen CSP och ingen HSTS. Fly omdirigerar till HTTPS (`fly.toml:30`) men utan `Strict-Transport-Security` går första anropet från en ny webbläsare över http och kan kapas på ett öppet nät. Utan CSP kan ett framtida XSS-hål (Markdown renderas via `sanitize-html`; länkfält tillåter `/`-sökvägar) ladda externa skript fritt. Nexts egen vägledning (`content-security-policy.md:417-435`) ger en policy utan nonce som passar en statiskt levererad sajt.
- **Åtgärd:** Lägg CSP enligt `Without Nonces`-exemplet (`default-src 'self'`, `img-src 'self' data:`, `form-action 'self'`, `frame-ancestors 'none'`, `base-uri 'self'`) och `Strict-Transport-Security: max-age=63072000; includeSubDomains` i `headers()`; nonce-varianten är vederlagd (R-26).
- **Verifiering:** A:1069 – `curl -I https://statlin-web.fly.dev/` visar båda rubrikerna; sajten fungerar med DevTools-konsolen tom från CSP-fel (formelringen, bilder, `/media`).
- **Status:** Öppen – belagd 2026-11-03

### SD-20 Uppladdningsrutten släpper igenom anrop utan `Origin`
- **Källa:** A/L2
- **Fil och rad:** `src/app/api/admin/upload/route.ts:28-31`; `src/lib/auth/session.ts:39-42`
- **Kodrad:** `if (origin && !isAllowedOrigin(originHost(origin), host)) return json({ error: "Otillåtet ursprung." }, 403);` — `src/app/api/admin/upload/route.ts:31`; `sameSite: "lax",` — `src/lib/auth/session.ts:41`
- **Felscenario:** Kontrollen gäller bara när rubriken finns (rad 31: `origin &&`). Ett anrop utan `Origin` – äldre klienter, vissa inbäddningar, script – passerar. Kakan är `SameSite=Lax` (rad 41), så en vanlig webbplats på annan domän kan inte skicka POST med kakan; kvar är samma sajt-scenarier (en underdomän, ett XSS-hål) där `Origin` ändå skulle vara tillåtet. Lägst allvar i avsnittet.
- **Åtgärd:** Kräv `Origin` eller `Sec-Fetch-Site: same-origin` för POST; lägg samma kontroll i proxyn för `/api/admin/*`.
- **Verifiering:** `curl -X POST -b "statlin_session=…" /api/admin/upload` utan `Origin` ger 403.
- **Status:** Öppen – belagd 2026-11-03

### SD-21 Prototypnycklar passerar `in`-kontroller och tabelluppslag; filer skrivs till disk före databasraden
- **Källa:** A/L4, A/L34, N3; se ST-17
- **Fil och rad:** `src/app/admin/_actions/tasks.ts:78-82`; `src/lib/types.ts:162-166`; `src/lib/file-types.ts:1-4`; `src/lib/media-store.ts:87-106`; `src/lib/media-store.ts:60-83`
- **Kodrad:** `if (!existing || !(status in TASK_STATUSES) || !canUpdateTask(user, existing)) redirect("/admin/uppdrag");` — `src/app/admin/_actions/tasks.ts:80`; `export const TASK_STATUSES: Record<TaskStatus, string> = {` — `src/lib/types.ts:164`; `export const FILE_TYPES: Record<string, string> = {` — `src/lib/file-types.ts:2`; `const mime = FILE_TYPES[ext];` — `src/lib/media-store.ts:90`; `await fs.writeFile(path.join(UPLOADS_DIR,` — `src/lib/media-store.ts:98`; `INSERT INTO media (kind, path_base, ext, variants, original_name, mime, size, uploaded_by)` — `src/lib/media-store.ts:102`; `.toFile(path.join(UPLOADS_DIR,` — `src/lib/media-store.ts:69`; `INSERT INTO media (kind, path_base, ext, variants, original_name, mime, size, width, height, color, alt, uploaded_by)` — `src/lib/media-store.ts:80`
- **Felscenario:** `status in TASK_STATUSES` (rad 80) är sant för `"constructor"` och `"toString"` – ett formulär med `status=toString` skriver det värdet i `tasks.status`, och tavlan som grupperar på status tappar uppdraget. `FILE_TYPES[ext]` (rad 90) ger en funktion för `ext = "constructor"` (filen `x.constructor`), kontrollen `!mime` passerar, filen skrivs (rad 98) och `INSERT` (rad 100–105) kastar när en funktion ska bindas – filen blir kvar utan rad. Mönstret "skriv fil, sedan rad" gäller båda vägarna (rad 69 före 77–83; rad 98 före 100–105): varje fel däremellan lämnar en föräldralös fil som ingen rensar (ST-17).
- **Åtgärd:** `Object.hasOwn(TASK_STATUSES, status)` och `Object.hasOwn(FILE_TYPES, ext)` (eller `Map`); skriv databasraden i en transaktion och ta bort filen i `catch`.
- **Verifiering:** A:1062 – `status=constructor` ger omdirigering utan skrivning; en fil med namnet `a.constructor` nekas; ett framprovocerat INSERT-fel lämnar ingen fil i `uploads/`.
- **Status:** Öppen – belagd 2026-11-03

### SD-22 Bildavkodningen saknar egen pixelgräns och avkodar hela bilden i minnet tre gånger
- **Källa:** A/L35; se ST-06
- **Fil och rad:** `src/lib/media-store.ts:36-45`; `src/lib/media-store.ts:64-74`; `fly.toml:51`
- **Kodrad:** `meta = await sharp(buffer, { failOn: "error" }).metadata();` — `src/lib/media-store.ts:42`; `const info = await sharp(buffer, { animated: false })` — `src/lib/media-store.ts:65`; `.rotate()` — `src/lib/media-store.ts:66`; `const { dominant } = await sharp(buffer).rotate().resize(64).stats();` — `src/lib/media-store.ts:74`; `memory = "1gb"` — `fly.toml:51`
- **Saknar:** `limitInputPixels` i `src/lib/media-store.ts`
- **Belägg:** `node_modules/sharp/dist/constructor.cjs:161` — `[options.limitInputPixels=268402689]`; `node_modules/sharp/dist/constructor.cjs:168` — `[options.sequentialRead=true]`
- **Felscenario:** A:s rubrik "ingen pixelgräns" stämmer inte ordagrant: sharp har 268 Mpx som standard (`constructor.cjs:161`). Men 268 Mpx × 4 byte är drygt 1 GB – mer än maskinens minne (`fly.toml:51`) – och `.rotate()` (rad 66) tvingar full avkodning i stället för strömmande läsning (`sequentialRead`, rad 168 i sharp). En inloggad användare som laddar upp en 25 MB PNG på 16 000 × 16 000 pixlar fäller processen; tre varianter plus `stats()` (rad 65–74) avkodar samma bild fyra gånger (ST-06). Minnesåtgången är inte mätt.
- **Åtgärd:** `limitInputPixels: 40e6` (40 Mpx räcker för 2000 px bredd) i båda `sharp()`-anropen; avkoda en gång och härled varianterna ur den (`.clone()` är vederlagt, se R-28 – använd en mellanbuffert i stället).
- **Verifiering:** Ladda upp en 12 000 × 12 000 PNG lokalt → tydligt fel "Bilden är för stor" i stället för krasch; `process.memoryUsage()` före/efter en 25 MB-uppladdning.
- **Status:** Öppen – delvis belagd (minnesåtgången är inte mätt; pixelgränsen är belagd i sharps källkod)

### SD-23 Compose-filen publicerar porten på alla gränssnitt, och utanför Fly kan besökaren själv välja sin IP-adress
- **Källa:** A/L38
- **Fil och rad:** `docker-compose.yml:8-12`; `src/lib/auth/rate-limit.ts:25-31`; `src/lib/auth/session.ts:20-25`; `fly.toml:17-18`; `README.md:135`
- **Kodrad:** `- "3000:3000"` — `docker-compose.yml:11`; `const forwarded = (h.get("x-forwarded-for") ?? "").split(",").map((s) => s.trim()).filter(Boolean);` — `src/lib/auth/rate-limit.ts:29`; `return forwarded.at(-1) || h.get("x-real-ip")?.trim() || "okänd";` — `src/lib/auth/rate-limit.ts:30`; `const proto = (await headers()).get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();` — `src/lib/auth/session.ts:23`; `CLIENT_IP_HEADER = "fly-client-ip"` — `fly.toml:18`; `Lägg en omvänd proxy med HTTPS framför` — `README.md:139`
- **Felscenario:** Gäller bara om sajten någon gång körs med `docker-compose.yml` på en egen server (README:135 anvisar en proxy framför). `"3000:3000"` (rad 11) binder porten på alla gränssnitt, så appen nås direkt vid sidan av proxyn. Då är `X-Forwarded-For` och `X-Real-IP` besökarens egna rubriker (rad 29–30): inloggningsspärren kan kringgås med en ny adress per försök, och `x-forwarded-proto: https` (rad 23) ger `secure`-kakor över http. På Fly är `CLIENT_IP_HEADER` satt (rad 18) och Fly skriver rubriken, så där är det ofarligt.
- **Åtgärd:** `"127.0.0.1:3000:3000"` i compose; kräv `CLIENT_IP_HEADER` i produktion (vägra starta annars) och ta bort `x-real-ip`-reserven.
- **Verifiering:** `docker compose up` och `curl http://<server-ip>:3000` utifrån ger "connection refused"; utan `CLIENT_IP_HEADER` loggar starten en varning.
- **Status:** Öppen – belagd 2026-11-03

### SD-24 Engångslösenorden har 20–22 bitars entropi och går aldrig ut
- **Källa:** A/L39
- **Fil och rad:** `scripts/create-accounts.mjs:55-57`; `src/lib/auth/password.ts:14-23`; `src/lib/db/migrations.ts:49-52`
- **Kodrad:** `const words = ["median", "kvartil", "varians", "regression", "bayes", "poisson", "residual", "percentil", "stickprov", "hypotes", "konfidens", "korrelation"];` — `scripts/create-accounts.mjs:55`; ``const newPassword = () => `${pick()}-${pick()}-${crypto.randomInt(1000, 9999)}`;`` — `scripts/create-accounts.mjs:57`; `"median", "kvartil", "varians", "regression", "bayes", "poisson", "kovarians", "residual",` — `src/lib/auth/password.ts:17`; ``return `${pick()}-${pick()}-${crypto.randomInt(1000, 9999)}`;`` — `src/lib/auth/password.ts:22`; `must_change_password INTEGER NOT NULL DEFAULT 0,` — `src/lib/db/migrations.ts:51`
- **Saknar:** `password_expires` i `src/lib/db/migrations.ts`
- **Felscenario:** Skriptet väljer två av tolv ord plus ett fyrsiffrigt tal: 12 · 12 · 8 999 ≈ 1,3 miljoner ≈ 2^20,3. `password.ts` har 24 ord: ≈ 5,2 miljoner ≈ 2^22,3 (A/L39:s "~20 bitar" gäller skriptet). Mot inloggningen skyddar låset (SD-11), men en kopia av databasen (SN-04) ger alla hashar, och bcrypt med kostnad 11 klarar några hundra försök per sekund per kärna – ett engångslösenord som aldrig byttes knäcks på timmar. Det finns ingen utgångstid (`must_change_password` tvingar byte först vid inloggning), så ett konto som aldrig använts bär sitt engångslösenord för alltid.
- **Åtgärd:** 4 ord ur en lista på 100+ (≈ 2^26,6 + siffror), eller 16 slumptecken; `password_expires_at` för engångslösenord (72 timmar) som kontrolleras vid inloggning; dela ordlistan med skriptet (ST-09).
- **Verifiering:** Ett engångslösenord äldre än utgångstiden avvisas med egen text; `create-accounts` skriver ut lösenord med minst fyra ord.
- **Status:** Öppen – belagd 2026-11-03

### SD-25 Redigeringspanelen stängs med Escape, klick utanför eller adressbyte utan att fråga om osparade ändringar
- **Källa:** A/M34; se SB-37
- **Fil och rad:** `src/components/edit-mode/edit-drawer.tsx:60-66`; `src/components/edit-mode/edit-drawer.tsx:78-96`; `src/components/edit-mode/admin-bar.tsx:22-25`; `src/components/admin/action-form.tsx:63-70`; `src/components/admin/action-form.tsx:80-88`; `src/components/admin/markdown-editor.tsx:50-63`; `src/components/admin/image-field.tsx:30-34`
- **Kodrad:** `const onKey = (e: KeyboardEvent) => e.key === "Escape" && editStore.close();` — `src/components/edit-mode/edit-drawer.tsx:62`; `onClick={() => editStore.close()} aria-hidden` — `src/components/edit-mode/edit-drawer.tsx:79`; `<Link href={adminHref(open)} onClick={() => editStore.close()}` — `src/components/edit-mode/edit-drawer.tsx:94`; `editStore.close();` — `src/components/edit-mode/admin-bar.tsx:24`; `}, [pathname]);` — `src/components/edit-mode/admin-bar.tsx:25`; `if (dirty.current) e.preventDefault();` — `src/components/admin/action-form.tsx:66`; `onChange={() => (dirty.current = true)}` — `src/components/admin/action-form.tsx:80`; `dirty.current = false;` — `src/components/admin/action-form.tsx:87`; `setValue(next);` — `src/components/admin/markdown-editor.tsx:52`; `setValue((v) => v.slice(0, pos) + text + v.slice(pos));` — `src/components/admin/markdown-editor.tsx:62`; `setChanged(true);` — `src/components/admin/image-field.tsx:32`
- **Felscenario:** `dirty` (rad 80) skyddar bara mot att lämna *sidan* (`beforeunload`, rad 64–70). Panelen stängs utan kontroll vid Escape (rad 62), klick på bakgrunden (rad 79), klick på "I adminpanelen" (rad 94) och vid varje adressbyte (admin-bar rad 23–25) – då avmonteras formuläret och en halvskriven text är borta. Verktygsknappar och bildinfogning i Markdown-redigeraren (rad 52, 62) och en uppladdning i bildfältet (rad 30–34) sätter aldrig `dirty`, så inte ens `beforeunload` skyddar dem. `dirty` nollas före svaret (rad 87): misslyckas sparningen är fälten kvar men skyddet borta (SB-37).
- **Åtgärd:** Ett `dirty`-tillstånd i `editStore` som panelen frågar innan den stänger ("Du har osparade ändringar – stäng ändå?"); sätt det från redigerarna; nolla först när `state.ok`.
- **Verifiering:** A:1034 – skriv i panelen, tryck Escape → en fråga visas; klicka på en verktygsknapp utan att skriva, tryck Escape → fråga.
- **Status:** Öppen – belagd 2026-11-03

### SD-26 Formuläret kan sparas medan en bild laddas upp – den nya bilden blir föräldralös eller tappas
- **Källa:** A/L41
- **Fil och rad:** `src/components/admin/image-field.tsx:40-58`; `src/components/admin/markdown-editor.tsx:65-76`; `src/components/admin/action-form.tsx:161-165`; `src/components/edit-mode/edit-drawer.tsx:157-160`
- **Kodrad:** `const res = await uploadFile(file, { purpose: "image" }, setProgress);` — `src/components/admin/image-field.tsx:44`; `if (res.image) setImage(res.image);` — `src/components/admin/image-field.tsx:45`; `<input type="hidden" name={name} value={image?.id ?? ""} />` — `src/components/admin/image-field.tsx:56`; `const res = await uploadFile(file, { purpose: "image" });` — `src/components/admin/markdown-editor.tsx:69`; `disabled={pending}` — `src/components/admin/action-form.tsx:163`; `editStore.close("Sparat! Sidan visar nu ändringen.");` — `src/components/edit-mode/edit-drawer.tsx:158`
- **Felscenario:** Spara-knappen inaktiveras bara medan *actionen* pågår (rad 163), inte medan en uppladdning pågår (rad 40–51, 65–76). Trycker användaren Spara (eller Enter) under uppladdningen skickas det dolda fältets gamla id (rad 56). I panelen stänger `onSaved` (rad 157–160) formuläret; uppladdningen blir klar i en komponent som inte längre finns, mediaraden skapades av `/api/admin/upload` men ingenting pekar på den – en föräldralös fil som `deleteMediaIfUnused` aldrig får frågan om (ST-17). I Markdown-fallet hinner texten sparas utan bildlänken.
- **Åtgärd:** Ett `uploading`-tillstånd som `ActionForm` tar hänsyn till (`disabled={pending || uploading}`), plus en spärr i panelen mot att stänga under uppladdning.
- **Verifiering:** A:1038 – välj en stor bild, tryck Spara direkt → knappen är inaktiv tills uppladdningen är klar och den nya bilden följer med.
- **Status:** Öppen – belagd 2026-11-03

### SD-27 En utgången session mitt i redigeringen ger omdirigering från actionen – formulärets innehåll försvinner
- **Källa:** A/L43; se SB-38
- **Fil och rad:** `src/lib/auth/session.ts:9-12`; `src/lib/auth/session.ts:27-30`; `src/lib/auth/session.ts:71-83`; `src/lib/auth/session.ts:94-99`; `src/proxy.ts:16-20`
- **Kodrad:** `const SESSION_DAYS = 30;` — `src/lib/auth/session.ts:11`; `const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);` — `src/lib/auth/session.ts:29`; `WHERE s.id = ? AND s.expires_at > ? AND u.active = 1` — `src/lib/auth/session.ts:81`; `if (!user) redirect("/logga-in");` — `src/lib/auth/session.ts:96`; `if (!request.cookies.has("statlin_session")) {` — `src/proxy.ts:16`
- **Belägg:** `node_modules/next/dist/client/components/router-reducer/reducers/server-action-reducer.js:237` — `// If the action triggered a redirect, the action promise will be rejected with`; `node_modules/next/dist/client/components/router-reducer/reducers/server-action-reducer.js:240` — `// the component that called the action as the error boundary will remount the tree.`; `node_modules/next/dist/client/components/redirect-boundary.js:58` — `if ((0, _redirecterror.isRedirectError)(error)) {`; `node_modules/next/dist/client/components/redirect-boundary.js:62` — `The redirect was already handled`
- **Felscenario:** Sessionen gäller 30 dagar (rad 11, 29) och kontrolleras mot `expires_at` vid varje anrop (rad 81). Proxyn tittar bara på om kakan *finns* (rad 16), så en sida med utgången kaka renderas; när användaren sedan sparar svarar `requireUser` med `redirect("/logga-in")` (rad 96). En omdirigering från en action avvisar löftet och låter `RedirectBoundary` montera om trädet (`server-action-reducer.js:237-254`, `redirect-boundary.js:57-66`) – inloggningssidan visas och texten är borta; `next` sätts inte (SB-38). Inte provat i webbläsare.
- **Åtgärd:** Returnera `{ error: "Du har loggats ut – logga in i en ny flik och spara igen." }` från actions i stället för `redirect` när sessionen saknas; förläng sessionen vid aktivitet; varna i gränssnittet en dag före utgång.
- **Verifiering:** A:1039 – sätt `expires_at` i det förflutna för en session, spara ett formulär → ett felmeddelande visas och texten finns kvar.
- **Status:** Öppen – delvis belagd (utgången kaka är inte provad i webbläsare)

### SD-28 Effekter körs om när en dold sida blir synlig – engångslösenordet ligger kvar på skärmen och `onSuccess` körs igen
- **Källa:** A/L44; se SD-06
- **Fil och rad:** `src/components/admin/action-form.tsx:55-61`; `src/components/admin/action-form.tsx:129-136`; `src/app/admin/uppdrag/[id]/page.tsx:95`; `src/app/admin/uppdrag/[id]/page.tsx:176-180`; `src/components/admin/user-form.tsx:14`
- **Kodrad:** `if (state.ok) {` — `src/components/admin/action-form.tsx:56`; `onSuccessRef.current?.(state);` — `src/components/admin/action-form.tsx:59`; `}, [state, resetOnSuccess]);` — `src/components/admin/action-form.tsx:61`; `{state.data?.password && (` — `src/components/admin/action-form.tsx:131`; `<code className="select-all` — `src/components/admin/action-form.tsx:134`; `<ActionForm action={addTaskComment} submitLabel="Skicka" stickyFooter={false} resetOnSuccess>` — `src/app/admin/uppdrag/[id]/page.tsx:95`; `<ImageIcon size={15} /> Ladda upp omslag` — `src/app/admin/uppdrag/[id]/page.tsx:178`; `<ActionForm action={saveUser} submitLabel={user ? "Spara konto" : "Skapa konto"} resetOnSuccess={!user} stickyFooter={false}>` — `src/components/admin/user-form.tsx:14`
- **Belägg:** `node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md:182` — `#### Resetting stale status messages`; `node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md:228` — `ref ensures the cleanup only runs after a successful submission`; `node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md:516` — `When the component becomes visible again, effects re-run`; `node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md:520` — `Effects run on every hide-to-visible transition, not just the initial mount`
- **Felscenario:** `<Activity>` behåller `state` och kör om effekter vid varje dold→synlig-övergång (`preserving-ui-state.md:516-520`). Efter "Skapa konto" visas engångslösenordet (rad 131–134); går administratören vidare till en annan sida och tillbaka ligger lösenordet kvar på skärmen i en delad datorsal, och `onSuccessRef.current?.(state)` (rad 59) körs igen med samma `state.ok` – för panelens `onSaved` betyder det en ny `router.refresh()` och stängning, för uppdragssidans kommentarsformulär (rad 95) en ny `reset()`. Länken "Ladda upp omslag" (rad 176–180) är just en sådan bort-och-tillbaka-resa. A/rad-1176 hänvisar till `user-form.tsx` för lösenordsvisningen; den ligger i `action-form.tsx:131-135`.
- **Åtgärd:** Nollställ statusmeddelanden i en händelsehanterare (`preserving-ui-state.md:182-228`: `shouldReset`-mönstret) och dölj lösenordet när formuläret göms (`onVisibilityChange`/`key`); aldrig `onSuccess` två gånger för samma `state`.
- **Verifiering:** A:1040-1041 – skapa ett konto, navigera bort och tillbaka → lösenordet är dolt och `router.refresh()` körs inte igen (räkna anrop i DevTools).
- **Status:** Öppen – belagd 2026-11-03

### SD-29 Utloggning är en navigering i appen – dolda sidor behåller klienttillstånd efter utloggning
- **Källa:** A/L42
- **Fil och rad:** `src/components/edit-mode/admin-bar.tsx:58-60`; `src/app/admin/_actions/auth.ts:64-67`
- **Kodrad:** `<form action={logout}>` — `src/components/edit-mode/admin-bar.tsx:58`; `export async function logout() {` — `src/app/admin/_actions/auth.ts:64`; `redirect("/logga-in?utloggad=1");` — `src/app/admin/_actions/auth.ts:66`
- **Belägg:** `node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md:255` — `across navigations, including authentication changes`; `node_modules/next/dist/docs/01-app/02-guides/preserving-ui-state.md:257` — `triggers a full page reload, clearing all client-side state`
- **Felscenario:** Utloggningen är en server action med `redirect` (rad 64–66) – en navigering i appen. Nexts egen vägledning (`preserving-ui-state.md:255-257`) säger att Activity behåller klienttillstånd över autentiseringsbyten och rekommenderar `window.location.href` för utloggning. Loggar Info ut på en delad dator och nästa person trycker bakåt kan den dolda adminsidan med formulärtext visas ur minnet (servern nekar nya anrop, men det som redan ligger i DOM syns). Inte provat i webbläsare.
- **Åtgärd:** Låt utloggningsknappen göra `window.location.href = "/logga-in?utloggad=1"` efter actionen, eller svara med en full omdirigering (`Response.redirect`) från en route handler.
- **Verifiering:** Skriv i ett adminformulär, logga ut, tryck bakåt → inloggningssidan eller tomt formulär, aldrig texten.
- **Status:** Öppen – delvis belagd (inte provad i webbläsare)

### SD-30 Originalbilden kastas – bara tre WebP-storlekar sparas
- **Källa:** D#4; se SD-09, B-16
- **Fil och rad:** `src/lib/media-store.ts:14`; `src/lib/media-store.ts:60-83`
- **Kodrad:** `const IMAGE_WIDTHS = [480, 1200, 2000];` — `src/lib/media-store.ts:14`; `.webp({ quality: w <= 480 ? 72 : 80, effort: 4 })` — `src/lib/media-store.ts:68`; `.toFile(path.join(UPLOADS_DIR,` — `src/lib/media-store.ts:69`
- **Felscenario:** `storeImage` skriver tre WebP-varianter (rad 64–69) och ingenting annat; bufferten med originalet lever bara i funktionen. Varje sittningsfoto, affisch och porträtt finns därför bara som förlustkomprimerad WebP på max 2000 px. Vill sektionen om fem år trycka en jubileumsbok, byta format eller generera om varianter i högre kvalitet finns inget original. Förlusten växer för varje dag (D/rad-33) och går inte att reparera i efterhand – därför står punkten här och inte under städning. Förslag, inte ett fel.
- **Åtgärd:** Spara originalet i `DATA_DIR/originals/<base>.<ext>` utanför `/media/` (nås inte publikt), ta med det i backupen (SN-01, B-16) och radera det i `deleteMediaIfUnused` (SD-09).
- **Verifiering:** Efter en uppladdning finns `originals/<base>.jpg` med samma storlek som den uppladdade filen; `/media/<base>.jpg` ger 404.
- **Status:** Förslag – belagd 2026-11-03

### SD-31 `audit_log` gallras aldrig, inloggningar loggas för alltid, och sajten saknar integritetssida
- **Källa:** D#8, B/rad-68, C/rad-11, C/rad-17; se F-04, B-17
- **Fil och rad:** `src/lib/db/migrations.ts:167-169`; `src/lib/admin/helpers.ts:8-12`; `src/lib/data/admin.ts:60-64`; `src/app/admin/_actions/auth.ts:58`
- **Kodrad:** `CREATE TABLE audit_log (` — `src/lib/db/migrations.ts:167`; `.prepare("INSERT INTO audit_log (user_id, action, entity, entity_id, summary) VALUES (?, ?, ?, ?, ?)")` — `src/lib/admin/helpers.ts:10`; `WHERE a.action != 'login'` — `src/lib/data/admin.ts:63`; `audit(user.id, "login", "user", user.id, "Loggade in");` — `src/app/admin/_actions/auth.ts:58`
- **Felscenario:** `grep -rn audit_log src scripts` (2026-11-03) träffar bara `CREATE TABLE`, `CREATE INDEX`, `INSERT` och `SELECT` – ingen `DELETE`. Varje inloggning (rad 58) och varje ändring loggas med namn och klockslag för alltid; vyn filtrerar bort inloggningar (rad 63) men raderna finns kvar. Kommande funktioner lovar gallring (Frågelådan raderar efter tolv månader, B/rad-68; kvittoplanen raderar kontonummer och filer efter 90 dagar, C/rad-11, C/rad-17) – löften som inte håller om loggen och backuperna (B-16) behåller allt. Sajten har ingen sida som berättar vad som sparas om besökare och förtroendevalda.
- **Åtgärd:** Gallring i `migrate()`-närhet eller ett nattligt jobb: `login`-rader efter 90 dagar, övriga efter 24 månader; en integritetssida (`/integritet`) med vad som lagras och hur länge; loggningens innehåll avgörs av B-17.
- **Verifiering:** `SELECT MIN(created_at) FROM audit_log WHERE action='login'` är aldrig äldre än 90 dagar; `/integritet` svarar 200.
- **Status:** Öppen – belagd 2026-11-03

### SD-32 Revisionsloggen saknar id för dokument och partner, och profiländringar och utloggning av andra enheter loggas inte
- **Källa:** A/L14; se B-17
- **Fil och rad:** `src/app/admin/_actions/content.ts:239`; `src/app/admin/_actions/content.ts:294`; `src/app/admin/_actions/auth.ts:84-87`; `src/app/admin/_actions/auth.ts:90-101`; `src/app/admin/_actions/auth.ts:103-107`
- **Kodrad:** `audit(user.id, "create", "document", null, d.title);` — `src/app/admin/_actions/content.ts:239`; `audit(user.id, "create", "partner", null, parsed.data.name);` — `src/app/admin/_actions/content.ts:294`; `audit(user.id, "update", "user", user.id, "Bytte lösenord");` — `src/app/admin/_actions/auth.ts:86`; `getDb().prepare("UPDATE users SET name = ?, post = ? WHERE id = ?").run(parsed.data.name, parsed.data.post, user.id);` — `src/app/admin/_actions/auth.ts:99`; `return { ok: true, message: "Profilen är sparad." };` — `src/app/admin/_actions/auth.ts:100`; `destroyAllSessionsForUser(user.id, await currentToken());` — `src/app/admin/_actions/auth.ts:105`; `return { ok: true, message: "Alla andra enheter har loggats ut." };` — `src/app/admin/_actions/auth.ts:106`
- **Felscenario:** Nya dokument och partner loggas med `entity_id = null` (rad 239, 294), så loggen kan inte kopplas till raden i efterhand. `updateProfile` (rad 90–101) och `logoutOtherSessions` (rad 103–107) skriver ingen loggrad alls – ett namnbyte eller en utkastning av andra enheter syns ingenstans. A/L14:s delpåstående att lösenordsbyte inte loggas stämmer inte: rad 86 loggar "Bytte lösenord" (R-15). Vad som får loggas (IP, klockslag) krockar med Frågelådans krav (B/rad-61) – B-17.
- **Åtgärd:** Skicka `lastInsertRowid` som `entity_id`; `audit()` i `updateProfile` och `logoutOtherSessions`; ett schema för vilka fält loggen får innehålla (B-17).
- **Verifiering:** Efter "Nytt dokument" har loggraden ett `entity_id`; efter namnbyte finns en rad `update user`.
- **Status:** Öppen – belagd 2026-11-03; väntar på beslut B-17

### SD-33 Enter i ett textfält publicerar nya inlägg direkt
- **Källa:** A/M32, A/rad-923
- **Fil och rad:** `src/components/admin/action-form.tsx:99-105`; `src/components/admin/publish-buttons.ts:5-9`; `src/components/admin/event-form.tsx:27`; `src/components/admin/news-form.tsx:38`; `src/app/admin/_actions/events.ts:26-30`; `src/app/admin/_actions/news.ts:14-18`; `src/app/admin/evenemang/ny/page.tsx:25`
- **Kodrad:** `{/* Huvudknappen ligger först i koden så att Enter i ett fält alltid väljer den. */}` — `src/components/admin/action-form.tsx:101`; `submitLabel: !item ? newLabel : item.published ? "Spara ändringar" : "Publicera",` — `src/components/admin/publish-buttons.ts:7`; `submitValue: { name: "published", value: "1" },` — `src/components/admin/publish-buttons.ts:8`; `<ActionForm action={saveEvent} {...publishButtons(event)} onSuccess={onSaved}>` — `src/components/admin/event-form.tsx:27`; `<ActionForm action={saveNews} {...publishButtons(item)} onSuccess={onSaved}>` — `src/components/admin/news-form.tsx:38`; `title: zRequired(140, "Titeln"),` — `src/app/admin/_actions/events.ts:26`; `body_md: zText(20000, "Beskrivningen"),` — `src/app/admin/_actions/events.ts:29`; `defaultStart={addDaysLocal(` — `src/app/admin/evenemang/ny/page.tsx:25`
- **Felscenario:** Huvudknappen ligger först i DOM med avsikt (rad 101) och bär `published=1` (rad 7–8). För ett nytt evenemang är bara titeln obligatorisk (rad 26; beskrivningen får vara tom, rad 29) och starttiden förifylld (rad 25). Skriver någon en titel och trycker Enter för att komma vidare publiceras ett tomt evenemang på startsidan, i kalenderflödet (SB-04) och i sitemapen – synligt för alla tills det upptäcks. Samma för nyheter (rad 38).
- **Åtgärd:** Gör "Spara som utkast" till standardknappen för nya inlägg (eller fånga Enter i textfält och kräv klick för publicering); publicering av tomma inlägg nekas i actionen (kräv beskrivning eller sammanfattning).
- **Verifiering:** A:1032 – skriv en titel, tryck Enter → inlägget sparas som utkast, inte publicerat.
- **Status:** Öppen – belagd 2026-11-03

### SD-34 Ett uppdrag blir "Öppet" när mottagaren är en själv, redan har tagit det eller är inaktiverad
- **Källa:** A/M33, NY-8
- **Fil och rad:** `src/components/admin/task-form.tsx:22-23`; `src/components/admin/task-form.tsx:46-47`; `src/app/admin/_actions/tasks.ts:55-62`; `src/app/admin/_actions/tasks.ts:95-99`; `src/lib/data/tasks.ts:134-137`
- **Kodrad:** `const board = recipients.filter((r) => r.kind === "styrelse" && r.id !== meId);` — `src/components/admin/task-form.tsx:22`; `const others = recipients.filter((r) => r.kind !== "styrelse" && r.id !== meId);` — `src/components/admin/task-form.tsx:23`; `<Select name="to_user_id" defaultValue={toDefault === null ? "" : String(toDefault)}>` — `src/components/admin/task-form.tsx:46`; `<option value="">Öppet – vem som helst kan ta det</option>` — `src/components/admin/task-form.tsx:47`; `UPDATE tasks SET title = ?, description = ?, to_user_id = ?` — `src/app/admin/_actions/tasks.ts:60`; `UPDATE tasks SET to_user_id = ?, assigned_at = NULL, status = CASE status WHEN 'planerad' THEN 'pagar'` — `src/app/admin/_actions/tasks.ts:97`; `WHERE u.active = 1` — `src/lib/data/tasks.ts:136`
- **Felscenario:** Mottagarlistan utesluter den inloggade (rad 22–23) och inaktiva konton (`tasks.ts:136`). Har någon tagit ett öppet uppdrag (`claimTask`, rad 97 sätter `to_user_id` till en själv) och sedan öppnar redigeringen, finns det egna id:t inte bland alternativen, `<select>` faller tillbaka på första valet "Öppet" (rad 46–47), och "Spara" skriver `to_user_id = NULL` (rad 60–61): uppdraget släpps utan att någon valt det. Samma när mottagaren hunnit inaktiveras. NY-8: samma sak drabbar ett uppdrag som redan är tilldelat en själv av någon annan.
- **Åtgärd:** Ta med den inloggade och den nuvarande mottagaren i listan (markerad "(inaktiv)" vid behov); rör inte `to_user_id` om fältet inte ändrats (samma `__changed`-mönster som bildfältet).
- **Verifiering:** A:1033 – ta ett öppet uppdrag, redigera titeln, spara → uppdraget är fortfarande ditt.
- **Status:** Öppen – belagd 2026-11-03

### SD-35 Dokument och hjälpmedel laddas upp på nytt vid varje sparning – gamla `/media/`-länkar dör
- **Källa:** A/M36
- **Fil och rad:** `src/components/admin/document-form.tsx:10`; `src/components/admin/resource-form.tsx:9`; `src/components/admin/action-form.tsx:15-19`; `src/app/admin/_actions/content.ts:214-233`; `src/app/admin/_actions/resources.ts:36-48`; `src/app/admin/_actions/resources.ts:58`
- **Kodrad:** `resetOnSuccess={!doc}` — `src/components/admin/document-form.tsx:10`; `resetOnSuccess={!resource}` — `src/components/admin/resource-form.tsx:9`; `* Skickas via startTransition i stället för form-action, så att React inte` — `src/components/admin/action-form.tsx:17`; `if (file instanceof File && file.size > 0) {` — `src/app/admin/_actions/content.ts:216`; `mediaId = (await storeFile(file, user.id)).id;` — `src/app/admin/_actions/content.ts:218`; `const nextMedia = mediaId ?? (fd.get("remove_file") === "on" ? null : old.media_id);` — `src/app/admin/_actions/content.ts:225`; `if (old.media_id !== nextMedia) await deleteMediaIfUnused(old.media_id);` — `src/app/admin/_actions/content.ts:229`; `const upload = file instanceof File && file.size > 0 ? file : null;` — `src/app/admin/_actions/resources.ts:37`; `if (old.media_id !== mediaId) await deleteMediaIfUnused(old.media_id);` — `src/app/admin/_actions/resources.ts:58`
- **Felscenario:** Vid redigering återställs inte formuläret efter sparning (rad 10, 9: `resetOnSuccess` bara för nya), och eftersom det skickas med `startTransition` (rad 17) tömmer React inte heller fälten – filväljaren behåller sin fil. Varje ny sparning (rätta en stavning i titeln) skickar filen igen (rad 216–218, 37), skapar en ny mediarad med nytt `path_base`, och raderar den gamla filen (rad 229, 58). Länkar som redan delats – i nyhetsbrev, på Lisam, i protokoll – till `/media/<gamla>.pdf` svarar 404. Inte provat i webbläsare; mekanismen är belagd.
- **Åtgärd:** Töm filfältet efter lyckad sparning; hoppa över `storeFile` när filens namn och storlek matchar den befintliga raden; behåll `path_base` vid ersättning (skriv över filen i stället för att byta adress).
- **Verifiering:** A:1037 – spara ett dokument med fil, ändra titeln, spara igen → `/media/`-adressen är oförändrad och `media` har en rad.
- **Status:** Öppen – belagd 2026-11-03

### SD-36 Demoinnehåll från `seed --demo` ligger i produktionen – och sannolikt demokonton utan tvångsbyte
- **Källa:** NY-1, B/småfel-5, B/rad-22, Live; se SD-14, SD-15, U-09
- **Fil och rad:** `scripts/seed.ts:57-70`; `scripts/seed.ts:74-104`; `scripts/seed.ts:148`; `package.json:11`; `package.json:40`; `next.config.ts:28`; `Dockerfile:35-37`; `.devcontainer/devcontainer.json:7-11`; `tests/e2e.mjs:4`; `tests/e2e.mjs:830`; `scripts/create-accounts.mjs:83-92`
- **Kodrad:** `{ email: "info@statlin.se", name: "Namn Efternamn", post: "Informationsansvarig", role: "editor", committee: "styrelsen" },` — `scripts/seed.ts:58`; `const at = (days: number, time: string) => addDaysLocal(` — `scripts/seed.ts:75`; `{ slug: "pubkvall-halloween", title: "Pubkväll: Halloween-edition", committee: "statpub", start: at(3, "18:00")` — `scripts/seed.ts:78`; `{ slug: "hostsittning", title: "Höstsittning med SCB", committee: "scb", start: at(6, "18:00")` — `scripts/seed.ts:81`; `{ slug: "star", title: "STAR – StatLins Arbetsmarknadsdag", committee: "sasu", start: at(34, "10:00")` — `scripts/seed.ts:96`; `{ slug: "hostmote", title: "Höstmöte", committee: "styrelsen", start: at(60, "17:15")` — `scripts/seed.ts:102`; `{ slug: "valkommen-till-nya-statlin-se", title: "Välkommen till nya statlin.se", committee: "styrelsen", pinned: 1, days: 0,` — `scripts/seed.ts:148`; `"seed": "tsx scripts/seed.ts",` — `package.json:11`; `"tsx": "^4.23.15",` — `package.json:42`; `"/*": ["./data/**/*", "./scripts/**/*", "./.git/**/*", "./README.md", "./AGENTS.md"],` — `next.config.ts:28`; `COPY --from=build --chown=statlin:statlin /app/scripts/create-accounts.mjs ./scripts/create-accounts.mjs` — `Dockerfile:36`; `//   ADMIN_PASSWORD=admin-statlin-2026 DEMO_PASSWORD=demo-statlin-2026 npm run seed -- --demo` — `tests/e2e.mjs:4`; `await login(page, "admin@statlin.se", "admin-statlin-2026");` — `tests/e2e.mjs:834`; `if (UPGRADE_TO_ADMIN.has(email) && existing.role === "editor") {` — `scripts/create-accounts.mjs:83`; `finns redan (${existing.role}) – orört` — `scripts/create-accounts.mjs:92`
- **Saknar:** `scripts/seed.ts` i `Dockerfile`
- **Felscenario:** Live-sidan `/evenemang` (GET 2026-11-03) listar exakt seedens nio evenemang – Pubkväll: Halloween-edition, Höstsittning med SCB, Lunchföreläsning: Från regression till produktion, LAN-kväll, Innebandy med STIG, Kursutvärderingsfika, STAR – StatLins Arbetsmarknadsdag, Julsittning, Höstmöte (rad 78–102) – och `/nyheter` visar "Välkommen till nya statlin.se" (rad 148). Datumen följer `at(n)` räknat från 2026-10-30 (planens dubbelkoll: pub 2 nov, sittning 5 nov, STAR 3 dec, Höstmöte 29 dec). Två av evenemangen har anmälningslänken `https://forms.gle/` utan formulär (rad 81, 99). Seeden kan inte ha körts i imagen: `tsx` är ett dev-beroende (`package.json:11,40`), `scripts/` spåras inte (`next.config.ts:28`) och bara tre skript kopieras (`Dockerfile:35-37`). Databasen är alltså seedad lokalt (eller i devcontainern) och uppladdad – då följde demokontona `info@`, `scb@`, `ubu@`, `grafiskt@` (rad 57–61) med, utan tvångsbyte (SD-14) och möjligen med de publika lösenorden `demo-statlin-2026`/`admin-statlin-2026` (`devcontainer.json:7-8`, `e2e.mjs:4,830`). `create-accounts` höjde dessutom `info@` från redaktör till administratör utan nytt lösenord (rad 83–85) och lämnade övriga orörda (rad 92). Det här är B/småfel-5:s "konstiga datum i kalendern" – demodata, inte ett datumfel. Kontodelen är inte belagd: den kräver `SELECT email, role, must_change_password, last_login_at FROM users` i produktionen eller Admin → Konton.
- **Åtgärd:** U-09: ögonblicksbild, kontrollera kontona, återställ eller radera demokonton, radera de nio evenemangen och nyheten (eller ersätt med riktiga), ta bort `forms.gle/`-länkarna. I koden: SD-14 (vägra `--demo` i produktion) och SD-15.
- **Verifiering:** `/evenemang` visar inga av de nio titlarna; `SELECT COUNT(*) FROM users WHERE must_change_password = 0 AND last_login_at IS NULL` är 0.
- **Status:** Öppen – delvis belagd (evenemang och nyhet syns live; konton och lösenord kräver en fråga mot produktionsdatabasen)

## 3 Synliga buggar

Trettioåtta punkter: tjugonio för den publika sajten (SB-01–SB-29) och nio för admin (SB-30–SB-38). Väntar på beslut: SB-04 (B-5), SB-12 (B-20), SB-16 (B-10), SB-26 (B-11), SB-34 (B-14). Delvis belagda: SB-12, SB-24, SB-27. Live-kontrollerna är gjorda med GET mot statlin-web.fly.dev 2026-11-03.

### SB-01 Heldagsevenemang med slutdatum försvinner från Kommande vid midnatt sista dagen, slutdatumet visas aldrig och ett ogiltigt slutvärde tappas tyst
- **Källa:** A/M8
- **Fil och rad:** `src/lib/data/events.ts:34-38`; `src/app/(site)/evenemang/[slug]/page.tsx:49`; `src/app/(site)/evenemang/[slug]/page.tsx:105-109`; `src/lib/dates.ts:74-80`; `src/components/admin/event-form.tsx:54`; `src/components/admin/action-form.tsx:90`; `src/lib/admin/form.ts:49-52`; `src/lib/ics.ts:79`
- **Kodrad:** `WHERE e.published = 1 AND COALESCE(e.ends_at, substr(e.starts_at, 1, 10) || 'T23:59') >= @now` — `src/lib/data/events.ts:36`; ``const isPast = (event.ends_at ?? `${event.starts_at.slice(0, 10)}T23:59`) < nowLocal();`` — `src/app/(site)/evenemang/[slug]/page.tsx:49`; `{formatDateLong(event.starts_at)}` — `src/app/(site)/evenemang/[slug]/page.tsx:107`; `if (allDay) return "Heldag";` — `src/lib/dates.ts:75`; `<TextInput type="datetime-local" name="ends_at" defaultValue={event?.ends_at ?? ""} />` — `src/components/admin/event-form.tsx:54`; `noValidate` — `src/components/admin/action-form.tsx:90`; `.transform((v) => (v && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) ? v : null));` — `src/lib/admin/form.ts:52`; `` lines.push(`DTSTART;VALUE=DATE:${dateOnly(e.starts_at)}`, `DTEND;VALUE=DATE:${nextDay(e.ends_at ?? e.starts_at)}`); `` — `src/lib/ics.ts:79`
- **Felscenario:** Ett heldagsevenemang 17–21 aug sparas med `ends_at = 2026-08-21T00:00` (slutfältet är `datetime-local` även för heldag, rad 54). Klockan 00:00 den 21 aug blir `COALESCE(e.ends_at, …) >= @now` falskt (rad 36) och evenemanget försvinner från Kommande, startsidan och marqueen; sidan visar "Har varit" (rad 49) hela sista dagen. Sidan visar dessutom bara startdatumet (rad 107) och tidsraden säger "Heldag" (rad 75), så besökaren ser aldrig att det pågår till den 21:a. Skickas ett slutvärde som inte matchar regexen (bara ett datum, eller sekunder från en webbläsare utan `datetime-local`-stöd) blir det tyst `null` (rad 52) eftersom formuläret har `noValidate` (rad 90) – sluttiden försvinner utan felmeddelande. Kalenderflödet är rätt (`DTEND` = dagen efter slutdagen, rad 79), så sajten och prenumerationen säger olika saker.
- **Åtgärd:** Räkna heldag till `T23:59` på slutdagen i frågan och i `isPast` (använd slutdatumet + `T23:59` när `all_day`); visa "Heldag t.o.m. 21 augusti" i `formatTimeRange` och på sidan; ge heldagsfälten `type="date"` eller validera `ends_at` med ett fältfel i stället för `null`.
- **Verifiering:** A:1021, A:1048 – heldag 17–21 aug → syns under Kommande hela 21 aug, `.ics` oförändrad; sidan och korten visar "Heldag t.o.m. 21 augusti".
- **Status:** Öppen – belagd 2026-11-03

### SB-02 Sidor med egen `openGraph`/`alternates` ersätter hela rotlayoutens block – evenemang utan omslag har inga og-taggar alls
- **Källa:** A/M9; se SB-21
- **Fil och rad:** `src/app/(site)/evenemang/[slug]/page.tsx:24-28`; `src/app/(site)/nyheter/[slug]/page.tsx:19-23`; `src/app/(site)/en/page.tsx:11-15`; `src/app/(site)/en/masters/page.tsx:13-17`; `src/app/(site)/tentastatistik/page.tsx:9-13`; `src/app/(site)/tentastatistik/[kod]/page.tsx:29-33`; `src/app/(site)/studenter/master/page.tsx:15-19`; `src/app/layout.tsx:9-28`; `src/app/(site)/page.tsx:8-11`
- **Kodrad:** `openGraph: event.cover ? { images: [{ url: event.cover.src, width: event.cover.width, height: event.cover.height }] } : undefined,` — `src/app/(site)/evenemang/[slug]/page.tsx:26`; `openGraph: { type: "article", publishedTime: item.published_at, images: item.cover ? [{ url: item.cover.src }] : undefined },` — `src/app/(site)/nyheter/[slug]/page.tsx:21`; `alternates: { canonical: "/en", languages: { sv: "/", en: "/en" } },` — `src/app/(site)/en/page.tsx:13`; `alternates: { canonical: "/en/masters" },` — `src/app/(site)/en/masters/page.tsx:15`; `alternates: { canonical: "/tentastatistik" },` — `src/app/(site)/tentastatistik/page.tsx:11`; ``alternates: { canonical: `/tentastatistik/${data.code}` },`` — `src/app/(site)/tentastatistik/[kod]/page.tsx:31`; `alternates: { languages: { sv: "/studenter/master", en: "/en/masters" } },` — `src/app/(site)/studenter/master/page.tsx:17`; `locale: "sv_SE",` — `src/app/layout.tsx:20`; `alternates: { types: { "text/calendar": "/kalender.ics" } },` — `src/app/layout.tsx:27`; `// alternates ersätter rotlayoutens, så kalenderflödet måste med här också.` — `src/app/(site)/page.tsx:8`
- **Belägg:** `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md:1346` — `Metadata objects exported from multiple segments in the same route are **shallowly** merged together`; `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md:1348` — `that are defined in an earlier segment are **overwritten** by the last segment to define them`; `node_modules/next/dist/lib/metadata/metadata-resolution-primitives.js:147` — `newResolvedMetadata.openGraph = convertUrlsToStrings(await (0, _resolveopengraph.resolveOpenGraph)(metadata.openGraph,`; `node_modules/next/dist/lib/metadata/resolvers/resolve-opengraph.js:135` — `if (!openGraph) return null;`
- **Felscenario:** Rotlayouten sätter `og:type`, `og:locale`, `og:site_name` och `/og.png` (rad 18–23) och kalenderflödet som `alternates.types` (rad 27). Varje sida som själv exporterar `openGraph` eller `alternates` ersätter hela blocket (Belägg: ytlig sammanslagning, nästlade fält skrivs över av sista segmentet). Evenemangssidan (rad 26) och nyhetssidan (rad 21) tappar `og:locale`/`og:site_name`; ett evenemang utan omslag exporterar `openGraph: undefined`, som resolvern gör till `null` (Belägg rad 135) – då finns inga og-taggar alls. Live 2026-11-03: `/evenemang/hostsittning` innehåller inte strängen `og:` en enda gång. Sidorna med egna `alternates` (`/en`, `/en/masters`, `/tentastatistik`, `/tentastatistik/<kod>`, `/studenter/master`) tappar kalenderlänken `rel="alternate" type="text/calendar"`; startsidan har fått den återlagd för hand (rad 8–10). Delningar i Facebook, Slack och Discord visar fel eller ingen bild och fel språk.
- **Åtgärd:** Samla rotens `openGraph`/`alternates` i ett delat objekt som varje sida spridar in (`openGraph: { ...SITE_OG, images: … }`, `alternates: { ...SITE_ALTERNATES, canonical: … }`) eller en hjälpfunktion `siteMetadata(partial)`; exportera aldrig `openGraph: undefined`.
- **Verifiering:** A:1022 – `curl -s /evenemang/<slug> | grep og:` visar `og:site_name`, `og:locale`, `og:image`; `curl -s /en/masters | grep text/calendar` visar kalenderlänken.
- **Status:** Öppen – belagd 2026-11-03 (live: inga og-taggar på `/evenemang/hostsittning`)

### SB-03 `.reveal` döljer innehållet tills en klienteffekt körs – uteblir bundlen står sidan tom
- **Källa:** A/M13
- **Fil och rad:** `src/app/layout.tsx:38-42`; `src/app/globals.css:343-363`; `src/components/ui/reveal.tsx:19-42`
- **Kodrad:** `<script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />` — `src/app/layout.tsx:40`; `.js .reveal {` — `src/app/globals.css:345`; `opacity: 0;` — `src/app/globals.css:346`; `transform: translate3d(0, 28px, 0);` — `src/app/globals.css:347`; `const io = new IntersectionObserver(` — `src/components/ui/reveal.tsx:24`; `setShown(true);` — `src/components/ui/reveal.tsx:27`; `data-shown={shown}` — `src/components/ui/reveal.tsx:40`
- **Felscenario:** Inline-skriptet (rad 40) sätter klassen `js` på `<html>` innan bundlen laddats, och `.js .reveal` (rad 345–347) gör varje `<Reveal>`-block osynligt tills `IntersectionObserver`-effekten (rad 24–27) sätter `data-shown` (rad 40). Blockeras eller misslyckas `/_next/static/*.js` (mobilnät som tappar, adblock, en deploy mitt i inläsningen som ger 404 på gamla chunkar, en hydreringskrasch) körs effekten aldrig, och startsidans sektioner, utskottskorten och sidfoten förblir `opacity: 0`. Helt utan JavaScript syns allt (klassen sätts inte), så felet gäller just "JS på, bundlen borta".
- **Åtgärd:** Rendera synligt och lägg på den dolda startstilen först i effekten (klassen sätts från klienten när observern är registrerad), så att utebliven bundle aldrig döljer något; A:252–256 vederlägger CSS-fallback-animation och `data-shown` i inline-skriptet (se R-18).
- **Verifiering:** A:1024-1025 – blockera `/_next/static/*.js` i devtools → innehållet syns ändå efter 3 s; med JS på spelas scrollavslöjandet fortfarande längre ner på sidan.
- **Status:** Öppen – belagd 2026-11-03

### SB-04 Kalenderprenumerationen är en vanlig länk till `/kalender.ics` med UID bundet till värdnamnet – flödet importeras i stället för att prenumereras, och domänbytet dubblerar evenemangen
- **Källa:** A/M21, D#3, NY-13; se ST-20, ST-22, U-02
- **Fil och rad:** `src/app/(site)/evenemang/page.tsx:32-36`; `src/components/home/home-sections.tsx:101-106`; `src/components/layout/site-footer.tsx:113-116`; `src/lib/seed-content.ts:354`; `src/app/kalender.ics/route.ts:10-15`; `src/lib/ics.ts:60-81`; `src/lib/data/events.ts:70-73`; `src/app/(site)/evenemang/[slug]/kalender.ics/route.ts:10-14`
- **Kodrad:** `<a href="/kalender.ics" className="btn btn-red">` — `src/app/(site)/evenemang/page.tsx:34`; `href="/kalender.ics"` — `src/components/home/home-sections.tsx:104`; `<a href="/kalender.ics" className="group inline-flex items-center gap-1.5 text-white/75 hover:text-white">` — `src/components/layout/site-footer.tsx:114`; `{ label: "Kalenderflöde", description: "Prenumerera på evenemangen i din kalender", url: "/kalender.ics",` — `src/lib/seed-content.ts:354`; `"Content-Disposition": 'inline; filename="statlin.ics"',` — `src/app/kalender.ics/route.ts:12`; `const host = new URL(siteUrl).host;` — `src/lib/ics.ts:62`; `"REFRESH-INTERVAL;VALUE=DURATION:PT6H",` — `src/lib/ics.ts:71`; ``lines.push("BEGIN:VEVENT", `UID:event-${e.id}@${host}`,`` — `src/lib/ics.ts:77`; ``return (db.prepare(`${SELECT} WHERE e.published = 1 ORDER BY e.starts_at DESC`).all() as Row[]).map(map);`` — `src/lib/data/events.ts:72`; ``"Content-Disposition": `attachment; filename="${event.slug}.ics"`,`` — `src/app/(site)/evenemang/[slug]/kalender.ics/route.ts:12`
- **Felscenario:** Knapparna, sidfoten och genvägen (rad 34, 104, 114, 354) är `https://`-länkar till `/kalender.ics` som levereras `inline` (rad 12): på iPhone och i Google Kalender blir det en engångsimport ("Lägg till alla") i stället för en prenumeration, så nya evenemang når aldrig fram. UID:t bygger på värdnamnet (rad 62, 77): vid bytet till statlin.se får varje evenemang nytt UID och alla prenumeranter får dubbletter. Flödet tar med alla publicerade evenemang någonsin (rad 72), så filen växer för varje år. Per-evenemangsfilen (rad 12 i `[slug]/kalender.ics`) har samma UID-problem och ett `REFRESH-INTERVAL` (rad 71) som är meningslöst i en nedladdad fil. Live 2026-11-03: `href="/kalender.ics"` ×2 på startsidan.
- **Åtgärd:** Länka med `webcal://<värd>/kalender.ics` och en Google-knapp (`calendar.google.com/calendar/r?cid=…`), sätt UID till `event-<id>@statlin.se` oavsett värd, begränsa flödet till ~6 månader bakåt och utelämna `REFRESH-INTERVAL`/`X-PUBLISHED-TTL` i per-evenemangsfilen. När UID-bytet görs (nu eller i samma veva som domänbytet) avgörs i B-5.
- **Verifiering:** A:1044-1046, D/rad-89 – på iPhone öppnar "Prenumerera på kalendern" Kalender med frågan "Prenumerera" (inte "Lägg till alla"); Google-knappen landar i "Lägg till kalender via URL" med adressen ifylld; flödet innehåller inga evenemang äldre än ~6 månader; `grep UID` visar `@statlin.se`.
- **Status:** Öppen – belagd 2026-11-03 (live: `href="/kalender.ics"`); väntar på beslut B-5

### SB-05 Kontaktsidan renderar inte sin Markdown-text, går inte att redigera på plats och saknar den röda titelmarkeringen
- **Källa:** A/M22, NY-11
- **Fil och rad:** `src/app/(site)/kontakt/page.tsx:1-8`; `src/app/(site)/kontakt/page.tsx:22-25`; `src/app/(site)/kontakt/page.tsx:30-37`; `src/components/admin/content-forms.tsx:15-27`; `src/components/content/content-page.tsx:22-40`
- **Kodrad:** `import { getPage, getSettings, listBoard, listCommittees } from "@/lib/data/content";` — `src/app/(site)/kontakt/page.tsx:7`; `const [page, settings, board, committees] = await Promise.all([getPage("kontakt"), getSettings(), listBoard(), listCommittees({ visibleOnly: true })]);` — `src/app/(site)/kontakt/page.tsx:23`; `title={page?.title ?? "Kontakt"}` — `src/app/(site)/kontakt/page.tsx:34`; `lead={page?.lead}` — `src/app/(site)/kontakt/page.tsx:35`; `<FormSection title="Sidhuvud" description="Skriv *ord* med stjärnor i titeln för att göra dem röda.">` — `src/components/admin/content-forms.tsx:17`; `<MarkdownEditor name="body_md" label="Text" defaultValue={page.body_md} rows={24} />` — `src/components/admin/content-forms.tsx:26`; `<Editable target={{ type: "page", slug }} label="Redigera sidan" inset penClassName="top-[calc(var(--header-h)+1rem)] right-4">` — `src/components/content/content-page.tsx:27`; `<Markdown source={page.body_md} />` — `src/components/content/content-page.tsx:39`
- **Saknar:** `body_md` i `src/app/(site)/kontakt/page.tsx`; `Editable` i `src/app/(site)/kontakt/page.tsx`; `AccentText` i `src/app/(site)/kontakt/page.tsx`
- **Felscenario:** Admin → Sidor → Kontakt visar titel, ingress och ett Markdown-fält (rad 17–26), men sidan läser bara `page.title` och `page.lead` (rad 34–35) – `body_md` används aldrig, så en redaktör som skriver öppettider eller en vägbeskrivning ser inget på `/kontakt`. Titeln går inte genom `AccentText`, så `*Kontakt*` (som formuläret lär ut, rad 17) ger stjärnor i rubriken i stället för rött. Sidan saknar `Editable` (jämför `content-page.tsx` rad 27, 39), så pennan i redigeringsläget finns inte där. Live 2026-11-03: `/kontakt` har inget `data-editable`-attribut.
- **Åtgärd:** Rendera `<Markdown source={page.body_md} />` under hjältesektionen, kör titeln genom `AccentText` och slå in sidan i `Editable target={{ type: "page", slug: "kontakt" }}` som `ContentPage` gör.
- **Verifiering:** A:1047 – skriv en rad under Sidor → Kontakt → Text → raden syns på `/kontakt`; `*Kontakt*` ger röd titel.
- **Status:** Öppen – belagd 2026-11-03

### SB-06 STAR-mässan på företagssidan hittas med `/star/i` på sluggen bland de 20 närmaste evenemangen
- **Källa:** A/L6, NY-12
- **Fil och rad:** `src/app/(site)/foretag/page.tsx:28-34`
- **Kodrad:** `const [partners, sasu, upcoming] = await Promise.all([listPartners({ activeOnly: true }), getCommitteeBySlug("sasu"), listUpcomingEvents(20)]);` — `src/app/(site)/foretag/page.tsx:30`; `const star = upcoming.find((e) => /star/i.test(e.slug));` — `src/app/(site)/foretag/page.tsx:31`
- **Felscenario:** Datumet för STAR visas bara om något av de 20 närmaste kommande evenemangen har "star" i sluggen (rad 30–31). Under hösten, när sittningar, pubar och möten fyller listan, hamnar en mässa i maj utanför de 20 och sidan säger inget; omvänt matchar `starta-terminen`, `startup-kvall` eller `hostarsmote` och visas som mässdatum. Live 2026-11-03 visar 3 dec – det är demoevenemanget (SD-36).
- **Åtgärd:** Ge evenemang en typ (`kind = 'massa'`) eller en inställning `star_event_id` i Admin → Inställningar och läs det evenemanget direkt, oberoende av listans längd.
- **Verifiering:** Skapa 21 kommande evenemang före ett med sluggen `star-2027` → företagssidan visar ändå STAR-datumet; skapa `starta-terminen` → det visas inte som STAR.
- **Status:** Öppen – belagd 2026-11-03

### SB-07 Pågående evenemang märks "I går"/"Har varit" eftersom etiketten räknas från starttiden
- **Källa:** A/L7
- **Fil och rad:** `src/components/content/event-card.tsx:52-56`; `src/lib/dates.ts:91-99`; `src/app/(site)/evenemang/[slug]/page.tsx:82-90`
- **Kodrad:** `<span className="chip bg-white/95 text-ink backdrop-blur pointer-coarse:backdrop-filter-none">{relativeDay(event.starts_at)}</span>` — `src/components/content/event-card.tsx:54`; `if (diff === -1) return "I går";` — `src/lib/dates.ts:93`; `if (diff < 0) return "Har varit";` — `src/lib/dates.ts:97`; ``<span className={`chip ${isPast ? "bg-white/15 text-white" : "bg-red text-white"}`}>{isPast ? "Har varit" : relativeDay(event.starts_at)}</span>`` — `src/app/(site)/evenemang/[slug]/page.tsx:84`
- **Felscenario:** `relativeDay` jämför bara `starts_at` med i dag (rad 93, 97). Ett flerdagarsevenemang (nollning 18–22 aug, LAN fredag–lördag) visas på korten som "I går" dag två och "Har varit" dag tre, fast det pågår och fortfarande ligger under Kommande (frågan i `events.ts:36` räknar med `ends_at`). Sidan använder `isPast` (slutet) för färgen, men för ett pågående evenemang blir texten ändå `relativeDay(starts_at)` = "I går" (rad 84).
- **Åtgärd:** Låt `relativeDay` ta emot `ends_at`/`all_day` och svara "Pågår" när `starts_at <= nu <= slut`; använd samma funktion på kort och sida.
- **Verifiering:** Evenemang som startade i går och slutar i morgon → kortet och sidan visar "Pågår", inte "I går".
- **Status:** Öppen – belagd 2026-11-03

### SB-08 Startsidans siffra "Kommande evenemang" är längden på en lista begränsad till sex
- **Källa:** A/L8
- **Fil och rad:** `src/components/home/home-sections.tsx:16-31`
- **Kodrad:** `listUpcomingEvents(6),` — `src/components/home/home-sections.tsx:18`; `{ value: events.length, label: "Kommande evenemang", note: "just nu i kalendern" },` — `src/components/home/home-sections.tsx:29`
- **Felscenario:** Statistikrutan visar `events.length` (rad 29) där `events` är `listUpcomingEvents(6)` (rad 18). Med tio kommande evenemang står det "6 kommande evenemang"; siffran kan aldrig bli högre än sex men ser ut som en räkning.
- **Åtgärd:** Räkna med en egen `COUNT(*)`-fråga (`countUpcomingEvents()`) eller ta bort siffran.
- **Verifiering:** Sju publicerade kommande evenemang → rutan visar 7.
- **Status:** Öppen – belagd 2026-11-03

### SB-09 Avatarens gradient-id innehåller postens namn med mellanslag – ogiltigt id som krockar mellan kort
- **Källa:** A/L9, NY-7
- **Fil och rad:** `src/components/content/avatar.tsx:29-37`; `src/components/content/board-card.tsx:11-15`; `src/app/admin/styrelsen/page.tsx:41-45`
- **Kodrad:** ``<linearGradient id={`av-${seed}`} gradientTransform={`rotate(${angle} .5 .5)`}>`` — `src/components/content/avatar.tsx:31`; ``<rect width="200" height="200" fill={`url(#av-${seed})`} />`` — `src/components/content/avatar.tsx:36`; ``seed={`${member.id}-${member.post}`}`` — `src/components/content/board-card.tsx:13`; ``<Avatar name={m.name || m.post} seed={`${m.id}-${m.post}`} photo={m.photo} className="size-12 shrink-0 rounded-full [&_span]:text-base" />`` — `src/app/admin/styrelsen/page.tsx:43`
- **Felscenario:** `seed` är `${id}-${post}` (rad 13, 43) och blir `id="av-3-Vice ordförande"` (rad 31), refererat som `url(#av-3-Vice ordförande)` (rad 36). Mellanslag är inte tillåtna i ett id, och `url(#…)` med mellanslag tolkas inte lika av alla webbläsare – gradienten uteblir (grå platta) eller pekar på det första elementet med samma id när samma post renderas två gånger i dokumentet (styrelsesidan, kontaktsidan och admin lever samtidigt i `<Activity>`).
- **Åtgärd:** Använd `useId()` eller bara `member.id` som seed och tvätta till `[a-z0-9-]`.
- **Verifiering:** Posten "Vice ordförande" utan foto → DevTools visar `id="av-3"` (inga mellanslag) och gradienten renderas i Firefox och Safari.
- **Status:** Öppen – belagd 2026-11-03

### SB-10 Kalendern trimmar bara en helt tom sjätte vecka – en tom femte står kvar
- **Källa:** A/L10
- **Fil och rad:** `src/lib/dates.ts:131-135`
- **Kodrad:** `if (!days.slice(35).some((d) => d.inMonth)) days.splice(35);` — `src/lib/dates.ts:133`
- **Felscenario:** `monthGrid` bygger alltid sex rader (42 dagar) och tar bara bort rad sex om den saknar dagar i månaden (rad 133). Februari 2027 börjar på en måndag och ryms på exakt fyra rader; rad fem och sex är helt nästa månad – rad sex tas bort, rad fem står kvar som en grå rad med 1–7 mars.
- **Åtgärd:** Trimma i en loop: `while (days.length > 28 && !days.slice(-7).some((d) => d.inMonth)) days.splice(-7)`.
- **Verifiering:** `/evenemang?vy=kalender&manad=2027-02` visar fyra rader.
- **Status:** Öppen – belagd 2026-11-03

### SB-11 Mobilmenyn, adminmenyn, redigeringspanelen och bildvisaren saknar fokusfälla och `inert` – Escape återställer inte fokus
- **Källa:** A/L19 (fokusdelen); se SB-12, SB-13, SB-14, SB-15
- **Fil och rad:** `src/components/layout/site-header.tsx:53-57`; `src/components/layout/site-header.tsx:212-219`; `src/components/admin/sidebar.tsx:169`; `src/components/edit-mode/edit-drawer.tsx:79-83`; `src/components/content/gallery.tsx:88-93`
- **Kodrad:** `const onKey = (e: KeyboardEvent) => e.key === "Escape" && (setOpen(false), setDropdown(null));` — `src/components/layout/site-header.tsx:55`; `"fixed inset-0 z-40 overflow-y-auto bg-ink text-white transition-[opacity,visibility] duration-500 lg:hidden",` — `src/components/layout/site-header.tsx:216`; `open ? "visible opacity-100" : "invisible opacity-0",` — `src/components/layout/site-header.tsx:217`; `<div className={cn("fixed inset-0 top-[64px] z-30 flex flex-col bg-ink lg:hidden", open ? "flex" : "hidden")}>` — `src/components/admin/sidebar.tsx:169`; `role="dialog"` — `src/components/edit-mode/edit-drawer.tsx:81`; `aria-modal="true"` — `src/components/edit-mode/edit-drawer.tsx:82`; `role="dialog"` — `src/components/content/gallery.tsx:90`; `aria-modal="true"` — `src/components/content/gallery.tsx:91`
- **Felscenario:** Mobilmenyn (rad 214–218) och adminmenyn (rad 169) är vanliga `div`:ar utan `role="dialog"`, `aria-modal` eller `inert` på resten av sidan; redigeringspanelen (rad 81–82) och bildvisaren (rad 90–91) har `aria-modal` men ingen fokusfälla. Tangentbordsanvändare: öppna mobilmenyn, Tab → fokus hamnar i sidan bakom menyn (osynligt); Escape stänger (rad 55) men fokus ligger kvar där det var i stället för på menyknappen. Skärmläsare läser sidan bakom panelen eftersom inget är `inert`.
- **Åtgärd:** Använd `<dialog>` eller sätt `inert` på `main`/`footer` när ett lager är öppet, fånga Tab inom lagret och återställ fokus till öppnaren vid stängning.
- **Verifiering:** A:1049 – mobilmenyn öppen → Tab går runt inne i menyn, Escape lägger fokus på menyknappen.
- **Status:** Öppen – belagd 2026-11-03

### SB-12 Varumärkesrött på vitt och de ljusa gråtonerna når inte WCAG-kontrast (beräknat ur tokens)
- **Källa:** A/L19 (kontrastdelen), NY-3, NY-16; se SB-11, SB-13, SB-14, SB-15
- **Fil och rad:** `src/app/globals.css:12`; `src/app/globals.css:17-23`; `src/app/globals.css:269-293`; `src/components/content/event-card.tsx:19`; `src/components/home/upcoming-marquee.tsx:20`; `src/components/home/upcoming-marquee.tsx:28`; `src/app/(site)/evenemang/page.tsx:245-259`; `src/components/layout/site-footer.tsx:51`; `src/components/layout/site-footer.tsx:94`; `src/components/layout/site-footer.tsx:106`; `src/components/layout/site-footer.tsx:129`; `src/components/layout/site-header.tsx:225`; `src/components/layout/site-header.tsx:273`; `src/components/home/hero.tsx:125`; `src/app/(site)/kontakt/page.tsx:97`; `src/components/admin/sidebar.tsx:98`; `src/components/admin/sidebar.tsx:183`; `src/components/links/link-board.tsx:190`; `src/components/exam/exam-chart.tsx:152`; `src/app/(site)/dokument/page.tsx:65`; `src/components/resources/resource-board.tsx:74`; `src/components/resources/resource-board.tsx:123`; `src/app/(site)/grafisk-profil/page.tsx:45`; `src/app/(site)/grafisk-profil/page.tsx:373`; `src/app/admin/_actions/content.ts:115`; `src/lib/seed-content.ts:71`
- **Kodrad:** `--color-ink: #0a0a0a;` — `src/app/globals.css:12`; `--color-stone-light: #a19d95;` — `src/app/globals.css:20`; `--color-red: #ff0707;` — `src/app/globals.css:21`; `--color-red-deep: #d40000;` — `src/app/globals.css:22`; `background: var(--color-red);` — `src/app/globals.css:286`; `color: #fff;` — `src/app/globals.css:287`; `<span className="kicker text-[0.62rem] text-red">{p.monthShort}</span>` — `src/components/content/event-card.tsx:19`; `<div className="relative overflow-hidden border-y border-red-dark bg-red py-3.5 text-white" aria-label="Kommande evenemang">` — `src/components/home/upcoming-marquee.tsx:20`; `{it.meta && <span className="kicker text-white/75">{it.meta}</span>}` — `src/components/home/upcoming-marquee.tsx:28`; `isToday ? "bg-red font-bold text-white" : d.inMonth ? "text-ink" : "text-stone-light",` — `src/app/(site)/evenemang/page.tsx:247`; `style={{ background: e.committee?.accent ?? "#0a0a0a" }}` — `src/app/(site)/evenemang/page.tsx:258`; `<p className="kicker text-white/40">Utforska</p>` — `src/components/layout/site-footer.tsx:94`; `const number = <span className="kicker text-white/30">{String(i + 1).padStart(2, "0")}</span>;` — `src/components/layout/site-header.tsx:225`; `<p className="kicker hidden text-right text-white/35 md:block">` — `src/components/home/hero.tsx:125`; `<span className="kicker text-stone-light">{g.links.length}</span>` — `src/components/links/link-board.tsx:190`; `<span className="kicker mt-1.5 block text-stone-light">` — `src/app/(site)/dokument/page.tsx:65`; `{ name: "Röd", hex: "#FF0707", rgb: "255 7 7", cmyk: "0 88 99 0", pantone: "2347 CP" },` — `src/app/(site)/grafisk-profil/page.tsx:45`; `accent: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Ange en färg som #RRGGBB.").default("#ff0707"),` — `src/app/admin/_actions/content.ts:115`; `accent: "#e8a33d",` — `src/lib/seed-content.ts:71`
- **Felscenario:** WCAG 2.1 AA kräver 4,5:1 för normal text och 3:1 för stor text och gränssnittsdelar. Beräknat ur tokens med WCAG:s formel för relativ luminans (inte mätt med axe): vit på `#ff0707` 3,97:1 (`.btn-red`, rad 285–287, använd i 20 filer; marqueen rad 20; "i dag"-rutan rad 247); `text-white/75` på rött 2,58:1 (rad 28); vit på utskottsaccenten `#e8a33d` (rad 71, StatPub) 2,16:1 i kalenderrutorna (rad 258 – accenten är fri i Admin, rad 115); vit med 30–40 % opacitet på `#0a0a0a` 2,6–3,8:1 (sidfot rad 94/106/129, header rad 225/273, hero rad 125, kontakt rad 97, adminmeny rad 98/183); `#a19d95` på vitt 2,7:1 där det används som text (rad 190, 152, 65, 74/123, 373). `--color-red-deep` `#d40000` ger 5,5:1 på vitt. Styrdokumentet föreskriver `#FF0707` (rad 45) – därför B-20.
- **Åtgärd:** Vänta på B-20 för rött. Oavsett beslut: `text-white/55` som golv på svart, `text-stone` i stället för `text-stone-light` för text som bär information, och mörk text på ljusa accentfärger (välj textfärg ur `accent` när rutan renderas).
- **Verifiering:** A:1049-1050 – Lighthouse/axe utan kontrastfel på startsidan, `/dokument` och `/evenemang?vy=kalender`.
- **Status:** Öppen – delvis belagd (kontrasten är räknad ur tokens, inte mätt med axe/Lighthouse); väntar på beslut B-20

### SB-13 "Reducera rörelse" kortar animationerna men inte fördröjningarna – hjälten är osynlig i 1,6 s; formulärstatusen rullar alltid mjukt
- **Källa:** A/L19 (rörelsedelen), NY-14; se SB-11, SB-12, SB-14, SB-15
- **Fil och rad:** `src/app/globals.css:111-123`; `src/components/home/hero.tsx:36-40`; `src/components/home/hero.tsx:60-64`; `src/components/admin/action-form.tsx:114-118`
- **Kodrad:** `animation-duration: 0.001ms !important;` — `src/app/globals.css:117`; `transition-duration: 0.001ms !important;` — `src/app/globals.css:119`; `className={cn(size.col, "[animation:fade-up_1.2s_1.6s_var(--ease-out-expo)_both] pointer-coarse:[animation-delay:.3s] pointer-coarse:[animation-duration:.8s]")}` — `src/components/home/hero.tsx:38`; `"flex flex-wrap items-center gap-3 md:col-span-5 md:justify-end [animation:fade-up_1.2s_1.85s_var(--ease-out-expo)_both] pointer-coarse:animate-none",` — `src/components/home/hero.tsx:62`; `if (state.error || state.ok) ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });` — `src/components/admin/action-form.tsx:116`
- **Felscenario:** Med "reducera rörelse" påslaget blir `fade-up` 0,001 ms lång (rad 117) men behåller fördröjningen 1,6 s (rad 38) respektive 1,85 s (rad 62), och `both` håller starttillståndet (osynligt) tills fördröjningen gått. Rubriken och knapparna är alltså osynliga i 1,6–1,85 s – längre än med animationen på. Formulärstatusen i admin rullar alltid med `behavior: "smooth"` (rad 116) oavsett inställning.
- **Åtgärd:** Lägg `animation-delay: 0s !important` i reduced-motion-blocket (eller `motion-reduce:`-varianter utan `both`), och välj `behavior` efter `matchMedia("(prefers-reduced-motion: reduce)")`.
- **Verifiering:** A:1050 – med "reducera rörelse" syns rubriken direkt.
- **Status:** Öppen – belagd 2026-11-03

### SB-14 Marqueen upprepar länkarna och namnger en `div` utan roll; filterchipparna är länkar med `role="listitem"`; vyväxlaren är en `tablist` utan flikar och panel
- **Källa:** A/L19 (rolldelen); se SB-11, SB-12, SB-13, SB-15
- **Fil och rad:** `src/components/home/upcoming-marquee.tsx:16-30`; `src/app/(site)/evenemang/page.tsx:65-79`; `src/app/(site)/evenemang/page.tsx:108-112`; `src/components/resources/resource-board.tsx:39-43`; `src/components/resources/resource-board.tsx:57`
- **Kodrad:** `const filled = Array.from({ length: Math.max(1, Math.ceil(6 / items.length)) }, () => items).flat();` — `src/components/home/upcoming-marquee.tsx:18`; `<div className="relative overflow-hidden border-y border-red-dark bg-red py-3.5 text-white" aria-label="Kommande evenemang">` — `src/components/home/upcoming-marquee.tsx:20`; `{[0, 1].map((copy) => (` — `src/components/home/upcoming-marquee.tsx:22`; `<div className="flex flex-wrap gap-2" role="list" aria-label="Filtrera på utskott">` — `src/app/(site)/evenemang/page.tsx:67`; `<div className="inline-flex shrink-0 rounded-full border border-ink/15 bg-white p-1" role="tablist" aria-label="Vy">` — `src/app/(site)/evenemang/page.tsx:77`; `role="listitem"` — `src/app/(site)/evenemang/page.tsx:110`; `if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;` — `src/components/resources/resource-board.tsx:41`; ``<div id="hjalpmedel-lista" role="tabpanel" aria-labelledby={`flik-${program}`} className="mt-10 space-y-14 md:space-y-16">`` — `src/components/resources/resource-board.tsx:57`
- **Felscenario:** Marqueen renderar varje länk `ceil(6/n)` gånger och sedan i två kopior (rad 18, 22): med ett evenemang får skärmläsaren tolv likadana länkar (sex tab-stoppbara); `aria-label` på en `div` utan roll (rad 20) läses inte upp. Filterchipparna är `<Link role="listitem">` (rad 110) – rollen skriver över länkrollen, så de annonseras som listpunkter, inte länkar. Vyväxlaren är `role="tablist"` (rad 77) med länkar i stället för `role="tab"` och utan `tabpanel`; hjälpmedelsflikarna har panel (rad 57) men saknar Home/End (rad 41).
- **Åtgärd:** Ge marqueens kopior `aria-hidden` och exponera bara en uppsättning länkar; ta bort `role="listitem"` från länkarna (`<ul><li><Link>`); gör vyväxlaren till vanliga länkar med `aria-current` eller fulla flikar med `tab`/`tabpanel`; lägg Home/End i hjälpmedelsflikarna.
- **Verifiering:** Skärmläsare (NVDA/VoiceOver) på startsidan: ett evenemang annonseras en gång i bandet; på `/evenemang` annonseras "Alla utskott" som länk.
- **Status:** Öppen – belagd 2026-11-03

### SB-15 Adminformulären: färgväljaren saknar `id`, `aria-describedby` pekar på element som bara finns vid fel, galleriknapparna har bara `title` och omsortering kräver mus
- **Källa:** A/L19 (admindelen), NY-10; se SB-11, SB-12, SB-13, SB-14
- **Fil och rad:** `src/components/admin/content-forms.tsx:75-79`; `src/components/admin/fields.tsx:28-56`; `src/components/admin/gallery-manager.tsx:181-193`; `src/components/admin/gallery-manager.tsx:207-216`
- **Kodrad:** `<input type="color" name="accent" defaultValue={c.accent} className="h-11 w-16 cursor-pointer rounded-xl border border-ink/15 bg-white p-1" />` — `src/components/admin/content-forms.tsx:77`; `<label htmlFor={name} className="mb-1.5 flex items-baseline justify-between gap-3 text-sm font-semibold text-ink">` — `src/components/admin/fields.tsx:30`; `{hint && <p className="mt-1.5 text-[0.82rem] leading-snug text-stone">{hint}</p>}` — `src/components/admin/fields.tsx:37`; ``return <input id={props.name} aria-describedby={`${props.name}-error`} className={cn(inputBase, className)} {...props} />;`` — `src/components/admin/fields.tsx:44`; `return <textarea id={props.name} className={cn(inputBase, "min-h-24 resize-y leading-relaxed", className)} {...props} />;` — `src/components/admin/fields.tsx:48`; `id={props.name}` — `src/components/admin/fields.tsx:54`; `draggable` — `src/components/admin/gallery-manager.tsx:185`; `onDragOver={(e) => dragId !== null && e.preventDefault()}` — `src/components/admin/gallery-manager.tsx:188`; `title={cover === item.image.id ? "Omslagsbild (klicka för att ta bort)" : "Använd som omslagsbild"}` — `src/components/admin/gallery-manager.tsx:209`; `<button type="button" onClick={() => remove(item)} title="Ta bort" className="grid size-8 place-items-center rounded-full bg-white/90 text-red-deep shadow hover:bg-white">` — `src/components/admin/gallery-manager.tsx:214`
- **Felscenario:** `Field` kopplar etiketten med `htmlFor={name}` (rad 30), men färgväljaren renderar en rå `<input>` utan `id` (rad 77) – etiketten "Accentfärg" träffar inget och skärmläsaren läser "färgväljare" utan namn. `TextInput` sätter `aria-describedby="<name>-error"` (rad 44) även när `FieldError` inte renderar något – en referens till ett obefintligt id – och tipset (rad 37) har inget id, så det läses aldrig som beskrivning; `TextArea` och `Select` (rad 48, 54) saknar `aria-describedby` helt. Galleriknapparna har bara `title` (rad 209, 214) – det blir det tillgängliga namnet men syns inte på touch – och omsortering sker enbart med drag (rad 185–188).
- **Åtgärd:** Ge färgväljaren `id={name}`; rendera tipset med `id="<name>-hint"` och sätt `aria-describedby` till de id:n som finns; `aria-label` på stjärna/papperskorg; knappar "Flytta vänster/höger" som alternativ till drag.
- **Verifiering:** axe på `/admin/utskott/<id>` och `/admin/evenemang/<id>` utan fel av typen "label"/"aria-valid-attr-value"; Tab till en galleribild → den kan göras till omslag och flyttas utan mus.
- **Status:** Öppen – belagd 2026-11-03

### SB-16 Saknade sidor svarar 200 med `noindex` i stället för 404 (mjuk 404)
- **Källa:** A/L24; se SB-20
- **Fil och rad:** `src/app/(site)/evenemang/[slug]/page.tsx:39-41`; `src/app/(site)/nyheter/[slug]/page.tsx:34-36`; `src/app/(site)/utskott/[slug]/page.tsx:33-35`; `src/components/content/content-page.tsx:22-24`; `src/app/(site)/studenter/lankar/page.tsx:28-30`; `src/app/(site)/studenter/hjalpmedel/page.tsx:26-28`
- **Kodrad:** `if (!event) notFound();` — `src/app/(site)/evenemang/[slug]/page.tsx:41`; `if (!item) notFound();` — `src/app/(site)/nyheter/[slug]/page.tsx:36`; `if (!c || !c.visible) notFound();` — `src/app/(site)/utskott/[slug]/page.tsx:35`; `if (!page) notFound();` — `src/components/content/content-page.tsx:24`; `if (!page) notFound();` — `src/app/(site)/studenter/lankar/page.tsx:30`; `if (!page) notFound();` — `src/app/(site)/studenter/hjalpmedel/page.tsx:28`
- **Belägg:** `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/not-found.md:193` — ``The response starts streaming from the `<Suspense>` boundary before `notFound()` runs, so it keeps its `200` status. Next.js adds a `noindex` tag.``; `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/not-found.md:195` — `A request-time check can run in [Proxy](/docs/app/api-reference/file-conventions/proxy) before the page renders.`
- **Felscenario:** Alla slug-sidor hämtar data inne i en `<Suspense>` (skelett) och kallar `notFound()` där (rad 41, 36, 35, 24, 30, 28). Svaret har då redan börjat strömmas med status 200; Next lägger bara till `<meta name="robots" content="noindex">` (Belägg). Live 2026-11-03: `/evenemang/finns-inte-alls` → 200 + `noindex`. Länkkontroller, Search Console och `curl -I` ser aldrig en 404; Google rapporterar "mjuk 404" och felaktiga länkar upptäcks inte.
- **Åtgärd:** Vänta på B-10: acceptera och dokumentera, eller gör slug-kontrollen i `src/proxy.ts` (en lätt `EXISTS`-fråga för `/evenemang/*`, `/nyheter/*`, `/utskott/*`) före renderingen (Belägg rad 195), eller flytta `notFound()` utanför Suspense-gränsen på de små sidorna.
- **Verifiering:** `curl -s -o /dev/null -w "%{http_code}" https://statlin-web.fly.dev/evenemang/finns-inte-alls` → 404.
- **Status:** Öppen – belagd 2026-11-03 (live: 200 + `noindex`); väntar på beslut B-10

### SB-17 Markdown tillåter bara h2–h4 och mappar bara `h1` – `#####` tappar rubrikformatet
- **Källa:** A/L27
- **Fil och rad:** `src/lib/markdown.ts:7-11`; `src/lib/markdown.ts:23-27`
- **Kodrad:** `"h2", "h3", "h4", "p", "br", "hr", "strong", "em", "del", "s", "u", "a", "ul", "ol", "li",` — `src/lib/markdown.ts:9`; `h1: "h2",` — `src/lib/markdown.ts:25`
- **Felscenario:** `#####` och `######` blir `<h5>`/`<h6>` av marked, men vitlistan (rad 9) har bara h2–h4 och `transformTags` mappar bara `h1` (rad 25) – sanitize-html tar bort taggen och texten blir en vanlig rad utan rubrikformat. Redaktören ser samma sak i förhandsgranskningen och förstår inte varför femte nivån inte fungerar.
- **Åtgärd:** Mappa `h5`/`h6` till `h4` i `transformTags` (eller tillåt dem).
- **Verifiering:** A:1064 – `##### Rubrik` i förhandsgranskningen → `<h4>`.
- **Status:** Öppen – belagd 2026-11-03

### SB-18 Kurskodlistan cachar ett tomt eller misslyckat svar för resten av sidvisningen
- **Källa:** A/L28
- **Fil och rad:** `src/components/exam/course-search.tsx:11-17`; `src/app/api/tentastatistik/koder/route.ts:5-9`
- **Kodrad:** `.then((r) => (r.ok ? (r.json() as Promise<string[]>) : []))` — `src/components/exam/course-search.tsx:13`; `codesPromise = null;` — `src/components/exam/course-search.tsx:15`; `const cacheControl = codes.length ? "public, max-age=3600, stale-while-revalidate=86400" : "no-store";` — `src/app/api/tentastatistik/koder/route.ts:7`
- **Felscenario:** `codesPromise` sätts en gång per sidladdning (rad 12). Svarar `/api/tentastatistik/koder` 503/500 eller `[]` (källan nere, SB-19) löses löftet till `[]` (rad 13) och behålls – bara ett nätverksfel (`.catch`, rad 15) nollställer. Sökrutan ger inga förslag tills användaren laddar om, även om källan kommit tillbaka. Rutten svarar `no-store` vid tom lista (rad 7), så omladdning hjälper – men klienten frågar aldrig igen.
- **Åtgärd:** Nollställ `codesPromise` även när svaret inte är `ok` eller listan är tom, så nästa fokus försöker igen.
- **Verifiering:** A:1064-1066 – låt `/api/tentastatistik/koder` svara 200 + `[]` (mock eller tillfällig `EXAM_STATS_URL`), fokusera sökrutan, återställ rutten, skriv igen → förslag visas utan omladdning.
- **Status:** Öppen – belagd 2026-11-03

### SB-19 En tom kodlista från källan sparas i databasen och gör tentastatistiken "otillgänglig" i 24 timmar
- **Källa:** A/L30
- **Fil och rad:** `src/lib/data/exam-stats.ts:103-112`; `src/lib/data/exam-stats.ts:120-124`; `src/lib/data/exam-stats.ts:173-177`
- **Kodrad:** `const codes = list.filter((c): c is string => typeof c === "string").map((c) => c.toUpperCase());` — `src/lib/data/exam-stats.ts:105`; `upsert.run(CODES_KEY, JSON.stringify(codes));` — `src/lib/data/exam-stats.ts:109`; `if (!codes) return (await refreshCodes()) ?? [];` — `src/lib/data/exam-stats.ts:122`; `if (isStale(fetchedAt)) after(refreshCodes);` — `src/lib/data/exam-stats.ts:123`; `if (codes.length === 0) return { stats: null, fetchedAt: null, unavailable: true };` — `src/lib/data/exam-stats.ts:175`
- **Felscenario:** Svarar källan med en tom array (tillfälligt fel, tom sida, ändrad API-form) sparas `[]` med färsk tidsstämpel (rad 105–111). `listExamCodes` ser en lista (rad 122 – `!codes` är falskt för `[]`) och uppdaterar först när den är gammal (rad 123, 24 h). Alla kurssidor säger "källan svarar inte" (rad 175) ett dygn, fast nästa hämtning hade lyckats.
- **Åtgärd:** Behandla en tom lista som misslyckad hämtning: returnera `null` utan upsert, så nästa anrop försöker igen; behåll texten "källan svarar inte" utan `noindex`.
- **Verifiering:** A:1051-1052 – peka `EXAM_STATS_URL` mot en mock som svarar `[]` → ingen rad i `settings`, nästa anrop försöker igen; tentastatistiksidan säger "källan svarar inte" utan `noindex`.
- **Status:** Öppen – belagd 2026-11-03

### SB-20 Dolda utskott läcker via evenemangens committee-JSON och `generateMetadata`; styrelsen länkas till en utskottssida som sitemapen utelämnar
- **Källa:** A/L29; se SB-16
- **Fil och rad:** `src/lib/data/events.ts:10-14`; `src/app/(site)/evenemang/[slug]/page.tsx:85-89`; `src/app/(site)/evenemang/[slug]/page.tsx:145-152`; `src/app/(site)/utskott/[slug]/page.tsx:19-23`; `src/app/(site)/utskott/[slug]/page.tsx:35`; `src/app/sitemap.ts:15`
- **Kodrad:** `'id', c.id, 'slug', c.slug, 'name', c.name, 'short_name', c.short_name, 'logo_url', c.logo_url, 'accent', c.accent` — `src/lib/data/events.ts:12`; ``<Link href={`/utskott/${event.committee.slug}`} className="chip border border-white/20 text-white/85 hover:border-white/60">`` — `src/app/(site)/evenemang/[slug]/page.tsx:86`; ``href={`/utskott/${event.committee.slug}`}`` — `src/app/(site)/evenemang/[slug]/page.tsx:147`; `if (!c) return { title: "Utskottet hittades inte" };` — `src/app/(site)/utskott/[slug]/page.tsx:20`; ``return { title: `${c.short_name} – ${c.name}`, description: c.tagline };`` — `src/app/(site)/utskott/[slug]/page.tsx:21`; `if (!c || !c.visible) notFound();` — `src/app/(site)/utskott/[slug]/page.tsx:35`; ``...committees.filter((c) => c.kind !== "styrelse").map((c) => ({ url: `${base}/utskott/${c.slug}`, lastModified: c.updated_at, priority: 0.6 })),`` — `src/app/sitemap.ts:15`
- **Felscenario:** Evenemangets `committee_json` (rad 12) tar inte med `visible`/`kind`, så sidan länkar chippen och arrangörskortet (rad 86, 147) till `/utskott/<slug>` även för ett dolt utskott. Utskottssidan svarar då `notFound()` (rad 35) – men `generateMetadata` körs före och sätter titel och tagline (rad 21) för det dolda utskottet, som alltså syns i fliken och i förhandsvisningar av en mjuk 404 (SB-16). Styrelsen är ett utskott med `kind = 'styrelse'`: sitemapen utelämnar `/utskott/styrelsen` (rad 15) men evenemang arrangerade av styrelsen länkar dit.
- **Åtgärd:** Ta med `visible` och `kind` i `committee_json`, länka bara synliga utskott (styrelsen → `/sektionen/styrelsen`), och gör `visible`-kontrollen även i `generateMetadata` (samma svar som för saknat utskott, rad 20).
- **Verifiering:** Dölj ett utskott i Admin → dess evenemang visar namnet utan länk; `curl -s /utskott/<dolt> | grep '<title>'` visar inte utskottets namn.
- **Status:** Öppen – belagd 2026-11-03

### SB-21 hreflang är ensidig, `og:locale` säger svenska på de engelska sidorna och språkväxlaren går alltid till roten
- **Källa:** A/L31; se SB-02
- **Fil och rad:** `src/app/(site)/en/masters/page.tsx:15`; `src/app/(site)/studenter/master/page.tsx:17`; `src/app/layout.tsx:20`; `src/components/layout/site-header.tsx:32-35`
- **Kodrad:** `alternates: { canonical: "/en/masters" },` — `src/app/(site)/en/masters/page.tsx:15`; `alternates: { languages: { sv: "/studenter/master", en: "/en/masters" } },` — `src/app/(site)/studenter/master/page.tsx:17`; `locale: "sv_SE",` — `src/app/layout.tsx:20`; `? { href: "/", short: "SV", label: "På svenska", lang: "sv" }` — `src/components/layout/site-header.tsx:34`; `: { href: "/en", short: "EN", label: "In English", lang: "en" };` — `src/components/layout/site-header.tsx:35`
- **Felscenario:** `/studenter/master` pekar ut `/en/masters` som engelsk version (rad 17), men `/en/masters` pekar bara på sig själv (rad 15) – Google kräver ömsesidiga hreflang-länkar och ignorerar annars paret. `/en` och `/en/masters` ärver `og:locale = sv_SE` (rad 20), så delningar märks som svenska. Växlaren går från `/en/masters` till `/` och från `/studenter/master` till `/en` (rad 34–35), inte till motsvarande sida. Live 2026-11-03: `/en/masters` har `og:locale` = `sv_SE`.
- **Åtgärd:** Ge `/en/masters` `languages: { sv: "/studenter/master", en: "/en/masters" }`, sätt `openGraph.locale = "en_GB"` på de engelska sidorna (utan att tappa resten av blocket, SB-02) och låt växlaren slå upp motsvarande sida i en tabell (`/en/masters` ↔ `/studenter/master`, `/en` ↔ `/`).
- **Verifiering:** A:1053 – `curl -s /en/masters | grep -E 'hreflang|og:locale'` visar `sv`/`en` och `en_GB`.
- **Status:** Öppen – belagd 2026-11-03

### SB-22 Strukturerad data för evenemang: `startDate` utan tidszon, heldag med klockslag, `location` och `description` kan saknas
- **Källa:** A/L32
- **Fil och rad:** `src/app/(site)/evenemang/[slug]/page.tsx:53-64`
- **Kodrad:** ``startDate: `${event.starts_at}:00`,`` — `src/app/(site)/evenemang/[slug]/page.tsx:57`; `location: event.location ? { "@type": "Place", name: event.location, address: event.location } : undefined,` — `src/app/(site)/evenemang/[slug]/page.tsx:60`; `description: event.summary,` — `src/app/(site)/evenemang/[slug]/page.tsx:61`
- **Felscenario:** JSON-LD:n skickar `startDate: "2026-11-05T18:00:00"` (rad 57) utan offset – Google tolkar tiden i okänd tidszon och Rich Results-testet varnar; ett heldagsevenemang får ändå ett klockslag; saknas plats blir `location` `undefined` (rad 60) fast Googles Event-schema kräver den; `description` är `event.summary` (rad 61), som kan vara tom medan metadatan faller tillbaka på brödtexten (rad 25). Live 2026-11-03: `/evenemang/hostsittning` har `"startDate":"2026-11-05T18:00:00"`.
- **Åtgärd:** Formatera med offset (`+01:00`/`+02:00` med samma CET/CEST-logik som `stockholmToIso` i `src/app/admin/_actions/news.ts`), använd bara datum för heldag, sätt `location` till sektionens adress som reserv och `description` till `summary || stripMarkdown(body_md)`.
- **Verifiering:** Rich Results-testet på en evenemangssida utan plats → inga fel; `startDate` innehåller `+01:00` eller `+02:00`.
- **Status:** Öppen – belagd 2026-11-03

### SB-23 Kalendervyn godtar vilket årtal som helst och saknar `canonical`/`robots` – oändligt många indexerbara månadssidor
- **Källa:** A/L33
- **Fil och rad:** `src/app/(site)/evenemang/page.tsx:16-19`; `src/app/(site)/evenemang/page.tsx:51`; `src/app/(site)/evenemang/page.tsx:207-217`
- **Kodrad:** `title: "Evenemang",` — `src/app/(site)/evenemang/page.tsx:17`; `const month = typeof sp.manad === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(sp.manad) ? sp.manad : todayLocal().slice(0, 7);` — `src/app/(site)/evenemang/page.tsx:51`; `<Link href={href({ manad: prev })} className="grid size-11 place-items-center rounded-full border border-ink/15 bg-white hover:border-ink" aria-label="Föregående månad">` — `src/app/(site)/evenemang/page.tsx:209`; `<Link href={href({ manad: next })} className="grid size-11 place-items-center rounded-full border border-ink/15 bg-white hover:border-ink" aria-label="Nästa månad">` — `src/app/(site)/evenemang/page.tsx:215`
- **Saknar:** `canonical` i `src/app/(site)/evenemang/page.tsx`; `robots` i `src/app/(site)/evenemang/page.tsx`
- **Felscenario:** `manad` godtar alla år 0000–9999 (rad 51) och föregående/nästa-länkarna (rad 209, 215) leder vidare utan slut och utan `rel="nofollow"`; metadatan (rad 16–19) sätter varken `canonical` till `/evenemang` eller `robots: noindex` för filtrerade vyer. En sökmotor kan följa tusentals tomma månadssidor (gånger sex utskottsfilter), alla med samma titel. Live 2026-11-03: `/evenemang?vy=kalender&manad=1999-01` → 200, "Januari 1999", ingen `canonical`, ingen `robots`.
- **Åtgärd:** Begränsa `manad` till t.ex. ±2 år från i dag (annars innevarande månad eller 404), sätt `alternates.canonical = "/evenemang"` och `robots: { index: false }` när `vy`/`manad`/`utskott` är satta, och `rel="nofollow"` på bläddringen.
- **Verifiering:** `curl -s '/evenemang?vy=kalender&manad=1999-01' | grep -E 'canonical|robots'` visar `/evenemang` och `noindex`; `manad=1999-01` visar innevarande månad eller svarar 404.
- **Status:** Öppen – belagd 2026-11-03 (live)

### SB-24 PDF-dokument serveras `inline` under `Content-Security-Policy: sandbox` – obelagt om Safari/iOS renderar dem
- **Källa:** A/L36
- **Fil och rad:** `src/app/media/[...path]/route.ts:35-38`
- **Kodrad:** ``headers.set("Content-Disposition", `${download ? "attachment" : "inline"}; filename="statlin-${path.basename(rel)}"`);`` — `src/app/media/[...path]/route.ts:36`; `headers.set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox");` — `src/app/media/[...path]/route.ts:37`
- **Felscenario:** Stadgar och protokoll öppnas `inline` (rad 36) med en CSP som sätter `sandbox` (rad 37). Chrome visar PDF:er i sandlådan; Safari (särskilt iOS) har tidigare vägrat rendera sandlådade PDF-svar eller visat en tom sida. Brister det blir `/dokument` oanvändbar på iPhone – men det är inte provat.
- **Åtgärd:** Prova i Safari/iOS; brister det: utelämna `sandbox` för `application/pdf` (behåll `default-src 'none'`) eller tvinga `attachment` för PDF. F-02 ärver rubrikerna (C/rad-52).
- **Verifiering:** A:1063 – öppna ett PDF-dokument från `/dokument` i Safari på iPhone och i Chrome – renderas den?
- **Status:** Öppen – delvis belagd (kräver Safari/iOS)

### SB-25 Småfel på publika sidor: månadslistan missar flerdagars från föregående månad, dubbla `key`, "1 bilder", fel förinläsning i bildvisaren, `/kalender.ics` som klientlänk
- **Källa:** A/L21 (den publika delen), NY-15; se SN-10, ST-25
- **Fil och rad:** `src/app/(site)/evenemang/page.tsx:200-202`; `src/components/exam/exam-chart.tsx:160`; `src/components/exam/exam-chart.tsx:212`; `src/components/exam/pass-rate-trend.tsx:109`; `src/app/(site)/galleri/page.tsx:68`; `src/components/content/gallery.tsx:50-54`; `src/components/content/gallery.tsx:131-136`; `src/components/links/link-board.tsx:229`; `src/components/links/link-board.tsx:258`; `src/lib/data/links.ts:12`
- **Kodrad:** `const monthEvents = events.filter((e) => e.starts_at.slice(0, 7) === month);` — `src/app/(site)/evenemang/page.tsx:202`; `key={o.date}` — `src/components/exam/exam-chart.tsx:160`; `<tr key={o.date}>` — `src/components/exam/exam-chart.tsx:212`; `key={o.date}` — `src/components/exam/pass-rate-trend.tsx:109`; `<span className="chip absolute bottom-4 left-4 z-10 bg-white/95 text-ink">{event.image_count} bilder</span>` — `src/app/(site)/galleri/page.tsx:68`; `img.src = it.image.src;` — `src/components/content/gallery.tsx:52`; `srcSet={current.image.srcSet}` — `src/components/content/gallery.tsx:133`; `sizes="100vw"` — `src/components/content/gallery.tsx:134`; `<Link href={href} className={className}>` — `src/components/links/link-board.tsx:229`; `<Link href={href} className={linkClass}>` — `src/components/links/link-board.tsx:258`; `return db.prepare("SELECT * FROM links WHERE active = 1 AND featured = 1 ORDER BY sort_order, label LIMIT 8").all() as LinkItem[];` — `src/lib/data/links.ts:12`
- **Felscenario:** (1) Listan under kalendern tar bara evenemang som börjar i månaden (rad 202) – nollningen 28 aug–3 sep syns inte under september, fast rutnätet (rad 200) markerar dagarna. (2) `key={o.date}` (rad 160, 212, 109): två tentatillfällen samma dag (olika moment) ger React-varning och fel rad vid uppdatering. (3) "1 bilder" (rad 68). (4) Bildvisaren förinläser `it.image.src` (rad 52) men visar `srcSet` med `sizes="100vw"` (rad 133–134), så webbläsaren väljer en annan kandidat och förinläsningen bommar. (5) `/kalender.ics` i länklistan (seedad med `url: "/kalender.ics"`) renderas som `<Link>` (rad 229, 258) eftersom den inte är extern – klienten förhämtar och försöker navigera med RSC-anrop innan den faller tillbaka på en hel sidladdning, och `webcal:` (SB-04) kan inte uttryckas som `<Link>`; genvägsraden visar bara `featured = 1` (rad 12), så felet ligger i link-board, inte quick-links.
- **Åtgärd:** (1) filtrera på att intervallet överlappar månaden; (2) ``key={`${o.date}-${o.module}`}``; (3) "bild"/"bilder" efter antal; (4) förinläs med samma `srcset`/`sizes`; (5) rendera filer och `.ics` som `<a>` (utöka `isExternalUrl`-villkoret).
- **Verifiering:** Evenemang 28 aug–3 sep → listas under september; `/galleri` med ett album på en bild visar "1 bild"; klick på Kalenderflöde i länklistan laddar `.ics` direkt (nätverksfliken visar inget `?_rsc=`).
- **Status:** Öppen – belagd 2026-11-03

### SB-26 Sajten lovar anonymitet som bara e-post kan ge – i kod och i seedad text
- **Källa:** B/tre-1; se F-01
- **Fil och rad:** `src/components/content/ubu-card.tsx:19`; `src/app/(site)/en/masters/page.tsx:59`; `src/lib/seed-content.ts:107`; `src/lib/seed-content.ts:205`; `src/lib/seed-content.ts:231`; `src/lib/seed-content.ts:291`; `src/lib/seed-content.ts:352`
- **Kodrad:** `<p className="mt-5 text-[0.95rem] leading-relaxed text-white/70">{ubu.tagline} Hör av dig om kurser, examination eller studiemiljö – anonymt om du vill.</p>` — `src/components/content/ubu-card.tsx:19`; `<p className="mt-5 text-[0.95rem] leading-relaxed text-white/70">Questions about courses, exams or your study environment? Contact UBU – anonymously if you prefer.</p>` — `src/app/(site)/en/masters/page.tsx:59`; `Hör av dig – du kan alltid vara anonym.` — `src/lib/seed-content.ts:107`; `- **Har du synpunkter på en kurs?** Kontakta UBU – vi tar det vidare, anonymt om du vill.` — `src/lib/seed-content.ts:205`; `UBU bevakar kvaliteten i båda programmen. Kontakta dem om kurser, examination eller studiemiljö – anonymt om du vill.` — `src/lib/seed-content.ts:231`; `Contact them about courses, exams or your study environment – anonymously if you prefer.` — `src/lib/seed-content.ts:291`; `{ label: "UBU – studiebevakning", description: "Problem med en kurs? Säg till, gärna anonymt", url: "/utskott/ubu",` — `src/lib/seed-content.ts:352`
- **Felscenario:** UBU-kortet (rad 19), masterssidan på engelska (rad 59) och de seedade texterna för AMO, UBU, programsidorna och länklistan (rad 107, 205, 231, 291, 352) lovar "anonymt om du vill" – men den enda kontaktvägen är `mailto:` till utskottet, och ett mejl bär avsändare. En student som litar på löftet skriver från sin LiU-adress om en lärare eller en trakasserande kurskamrat. Löftet finns både i kod och i produktionsdatabasen (seedat), så en textändring i Admin räcker inte ensam.
- **Åtgärd:** Vänta på B-11: bygg Frågelådan (F-01), som faktiskt är anonym, eller skriv om texterna till "hör av dig – vi behandlar det konfidentiellt" i koden och i Admin → Utskott/Sidor/Länkar.
- **Verifiering:** `grep -rn anonym src/` ger inga träffar i kod; live `/utskott/ubu`, `/utskott/amo`, `/studenter/kandidat`, `/studenter/master`, `/en/masters` och `/studenter/lankar` saknar "anonymt"/"anonymously" (eller Frågelådan finns).
- **Status:** Öppen – belagd 2026-11-03; väntar på beslut B-11

### SB-27 Innehåll i Suspense-hål kräver JavaScript – påståendet "allt innehåll utan JS" stämmer inte
- **Källa:** NY-2 (motsäger D/rad-69); se Fakta-2 i avsnitt 7
- **Fil och rad:** `src/components/layout/site-footer.tsx:86-91`; `src/app/(site)/dokument/page.tsx:28-30`; `src/components/layout/site-header.tsx:11-15`
- **Kodrad:** `<Suspense fallback={<div className="h-24" />}>` — `src/components/layout/site-footer.tsx:88`; `<Suspense fallback={<PageSkeleton />}>` — `src/app/(site)/dokument/page.tsx:28`; `<Suspense fallback={<HeaderView pathname={null} />}>` — `src/components/layout/site-header.tsx:13`
- **Belägg:** `node_modules/next/dist/docs/01-app/02-guides/streaming.md:39` — ``React streams its completed HTML along with inline `<script>` tags: one that swaps the fallback DOM node with the new content``; `node_modules/next/dist/docs/01-app/02-guides/streaming.md:582` — `the content only appears once that script runs.`; `node_modules/next/dist/docs/01-app/02-guides/streaming.md:771` — ``React streams a `<div hidden id="S:0">` containing the completed HTML and a script that swaps it into the page.``; `node_modules/next/dist/docs/01-app/02-guides/streaming.md:781` — `the server waits for the full render and sends one fully formed HTML document instead of streaming.`
- **Felscenario:** Sidfotens kontakt (rad 88), dokumentlistan (rad 28) och headern (rad 13) ligger i Suspense-gränser. Det färdiga innehållet strömmas som `<div hidden id="S:…">` plus ett inline-skript som byter ut reservinnehållet (Belägg rad 39, 771); med skript avstängda står reservinnehållet kvar – en tom ruta i sidfoten och skelettet på `/dokument` (Belägg rad 582). Live 2026-11-03: `/` har `<div hidden id="S:0">` till `S:8`, `/dokument` har `S:0`, `S:1`, `S:4`. Botar får hela dokumentet (Belägg rad 781), så sökmotorer påverkas inte – men D:s rad 69 ("sajten visar allt innehåll utan JavaScript") stämmer inte.
- **Åtgärd:** Ingen kodändring krävs om beteendet accepteras; vill man ha innehåll utan JS, lyft de små delarna (sidfotens kontakt, headern) ur Suspense eller rendera dem från statiska data. Rätta påståendet i D.
- **Verifiering:** Chrome → Inställningar → JavaScript av → `/dokument` och sidfoten visar innehåll (inte skelett eller tom ruta).
- **Status:** Öppen – delvis belagd (live-DOM:en har de dolda `S:`-segmenten; inte provat med JavaScript avstängt)

### SB-28 Sidfotens slogan renderas som ren text – Markdown-stjärnor syns live
- **Källa:** NY-4, Live
- **Fil och rad:** `src/components/layout/site-footer.tsx:45`; `src/components/admin/content-forms.tsx:227`
- **Kodrad:** `{s.tagline && <p className="max-w-md leading-relaxed text-white/60">{s.tagline}</p>}` — `src/components/layout/site-footer.tsx:45`; `<Field label="Slogan" name="tagline" hint="Visas i sidfoten under kontaktuppgifterna.">` — `src/components/admin/content-forms.tsx:227`
- **Felscenario:** Sidfoten skriver `s.tagline` rakt av (rad 45) medan sidformuläret lär redaktören att `*ord*` ger rött (`content-forms.tsx:17`) – inställningsfältet (rad 227) säger inget om det. Live 2026-11-03 visar sidfoten "Sektionen för dig som läser Statistik och Dataanalys samt **Statistics and Machine Learning ** och aster vid Linköpings universitet." – stjärnor, ett extra mellanslag och "aster" (trasigt "master").
- **Åtgärd:** Innehållet rättas nu i Admin → Inställningar → Slogan. Koden: rendera sloganen genom `AccentText` (så `*ord*` blir rött som i rubrikerna) och säg det i fältets `hint`.
- **Verifiering:** Sidfoten på `/` visar sloganen utan stjärnor; `*Statistics*` i fältet ger ett rött ord.
- **Status:** Öppen – belagd 2026-11-03 (live)

### SB-29 `/en/masters` visar svenska datumetiketter och "Heldag" i evenemangsraderna
- **Källa:** NY-20 (A/rad-1113–1114 lämnade det "ej verifierat")
- **Fil och rad:** `src/app/(site)/en/masters/page.tsx:37-41`; `src/components/content/event-card.tsx:17-21`; `src/components/content/event-card.tsx:98-105`; `src/lib/dates.ts:33`; `src/lib/dates.ts:75`
- **Kodrad:** `{events.length > 0 ? events.map((e) => <EventRow key={e.id} event={e} />) : <p className="py-6 text-stone">New events are coming soon.</p>}` — `src/app/(site)/en/masters/page.tsx:39`; `<span className={cn("mt-0.5 font-mono text-[0.62rem] uppercase", dark ? "text-white/45" : "text-stone")}>{p.weekdayShort}</span>` — `src/components/content/event-card.tsx:21`; `<DateBlock date={event.starts_at} dark={dark} />` — `src/components/content/event-card.tsx:100`; `{event.committee?.short_name ?? "StatLin"} · {formatTimeRange(event.starts_at, event.ends_at, !!event.all_day)}` — `src/components/content/event-card.tsx:103`; `const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("sv-SE", { timeZone: "UTC", ...opts });` — `src/lib/dates.ts:33`; `if (allDay) return "Heldag";` — `src/lib/dates.ts:75`
- **Felscenario:** Masterssidan på engelska återanvänder `EventRow` (rad 39), som renderar `DateBlock` (rad 100, med `weekdayShort` rad 21) och `formatTimeRange` (rad 103); båda formaterar med `sv-SE` (rad 33) och fasta svenska strängar (rad 75). Live 2026-11-03: `/en/masters` visar `nov`, `ons`, `tors`, `lör`, `sön` – engelska läsare får "tors" i stället för "Thu", och "Heldag" i stället för "All day" så fort ett heldagsevenemang finns.
- **Åtgärd:** Ge `EventRow`, `DateBlock` och `formatTimeRange` en `locale`-parameter (`en-GB` under `/en/*`) och översätt "Heldag"/"I dag"/"I morgon".
- **Verifiering:** `curl -s https://statlin-web.fly.dev/en/masters | grep -o '>\(Thu\|Sat\|Sun\|Wed\)<'` ger träffar och `>tors<` ger ingen.
- **Status:** Öppen – belagd 2026-11-03 (live)

### SB-30 Adminlisten stänger redigeringspanelen vid varje navigering – `setUser`-effekten körs om med ett nytt objekt och nollar `open`
- **Källa:** A/M2
- **Fil och rad:** `src/components/edit-mode/admin-bar.tsx:15-20`; `src/components/edit-mode/store.ts:54-56`; `src/components/edit-mode/admin-bar-loader.tsx:6-9`
- **Kodrad:** `editStore.setUser(user);` — `src/components/edit-mode/admin-bar.tsx:18`; `return () => editStore.setUser(null);` — `src/components/edit-mode/admin-bar.tsx:19`; `}, [user]);` — `src/components/edit-mode/admin-bar.tsx:20`; `set({ user, editing: user ? readPreference() : false, open: null });` — `src/components/edit-mode/store.ts:55`; `return <AdminBar user={{ id: user.id, name: user.name, post: user.post, role: user.role, committee_id: user.committee_id, committee_name: user.committee_name, design: user.design }} />;` — `src/components/edit-mode/admin-bar-loader.tsx:8`
- **Felscenario:** `AdminBar` får `user` som ett nytt objektliteral från serverkomponenten (rad 8) och kör `setUser` i en effekt med `[user]` som beroende (rad 17–20). Varje gång RSC-payloaden hämtas om (navigering, `router.refresh()` efter en sparning, `revalidatePath` från en action) är objektet nytt → effekten körs igen → cleanupen `setUser(null)` (rad 19) blinkar bort listen och `setUser` sätter `open: null` (rad 55). Redaktören som har panelen öppen ("Byt bilder", "Redigera texten") och sparar får panelen stängd mitt i arbetet.
- **Åtgärd:** Stabilisera beroendet (`[user.id]`, eller memoisera objektet) så effekten bara körs vid byte av användare; A:1187–1188 vederlägger att i stället låta `setUser` alltid behålla `open` (R-32).
- **Verifiering:** A:1014 – redigeringsläge → "Byt bilder" → ändra bildtext → panelen är kvar och visar "Sparat".
- **Status:** Öppen – belagd 2026-11-03

### SB-31 Styrda rollknappar plus `form.reset()` – nästa konto får rollen som skickas, inte den som visas
- **Källa:** A/M7
- **Fil och rad:** `src/components/admin/user-form.tsx:11-14`; `src/components/admin/user-form.tsx:39`; `src/components/admin/action-form.tsx:55-61`; `src/app/admin/konton/page.tsx:65`
- **Kodrad:** `const [role, setRole] = useState<Role>(user?.role ?? "committee");` — `src/components/admin/user-form.tsx:12`; `<ActionForm action={saveUser} submitLabel={user ? "Spara konto" : "Skapa konto"} resetOnSuccess={!user} stickyFooter={false}>` — `src/components/admin/user-form.tsx:14`; `<input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="sr-only" />` — `src/components/admin/user-form.tsx:39`; `if (resetOnSuccess) formRef.current?.reset();` — `src/components/admin/action-form.tsx:58`; `<UserForm committees={committees} />` — `src/app/admin/konton/page.tsx:65`
- **Belägg:** `node_modules/react-dom/cjs/react-dom-client.development.js:1920` — `element.defaultChecked = !!checked;`; `node_modules/react-dom/cjs/react-dom-client.development.js:1871` — `(element.checked =`; `node_modules/react-dom/cjs/react-dom-client.development.js:1869` — `(element.defaultChecked = !!defaultChecked);`
- **Felscenario:** Radioknapparna är styrda (`checked={role === r}`, rad 39) av `role` i React-state (rad 12). Vid nytt konto är `resetOnSuccess` sant (rad 14) och `ActionForm` kör `form.reset()` efter lyckad sparning (rad 58). `reset()` återställer DOM:en till `defaultChecked`, som React satte vid monteringen till det ursprungliga valet (Belägg rad 1920) och vid uppdateringar bara rör när `checked` är null (Belägg rad 1869; annars sätts bara `element.checked`, rad 1871). Efter resetten visar DOM:en "Utskott" medan `role` i state – och markeringen – fortfarande är "Redaktör"; React skriver inte om `checked` eftersom propen inte ändrats. Nästa konto som skapas utan att rollen rörs skickar `role=committee` fast formuläret visar redaktör. Kontosidan renderar formuläret utan `user` (rad 65), så varje nytt konto går den vägen.
- **Åtgärd:** Okontrollerade radioknappar (`defaultChecked`) med `setRole` i `onChange` för hjälptexten, och återställ `role` i `onSuccess`; A:1162 vederlägger `key`-varianten för `UserForm` (R-29).
- **Verifiering:** A:1020 – skapa redaktör → skapa nästa konto utan att röra rollen → rollen är den som visas.
- **Status:** Öppen – belagd 2026-11-03

### SB-32 Datum valideras bara med regex – `Invalid Date` ger `RangeError` på sajten och hela `/kalender.ics` faller
- **Källa:** A/M15, NY-9
- **Fil och rad:** `src/lib/admin/form.ts:47-52`; `src/lib/dates.ts:28-35`; `src/lib/ics.ts:49-55`; `src/lib/ics.ts:96-100`
- **Kodrad:** ``z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, `${label} måste vara ett giltigt datum och klockslag.`);`` — `src/lib/admin/form.ts:48`; `.transform((v) => (v && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) ? v : null));` — `src/lib/admin/form.ts:52`; ``return new Date(`${d}T${t.slice(0, 5)}:00Z`);`` — `src/lib/dates.ts:30`; `const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("sv-SE", { timeZone: "UTC", ...opts });` — `src/lib/dates.ts:33`; ``const d = new Date(`${date.slice(0, 10)}T00:00:00Z`);`` — `src/lib/ics.ts:52`; `return d.toISOString().slice(0, 10).replace(/-/g, "");` — `src/lib/ics.ts:54`; ``const d = new Date(`${localStr}:00Z`);`` — `src/lib/ics.ts:97`; `return d.toISOString().slice(0, 16);` — `src/lib/ics.ts:99`
- **Felscenario:** Regexen (rad 48, 52) godtar `2025-02-30T12:00`, `2025-02-28T24:00` och `2025-13-01T12:00`. Kontrollerat med `node -e` 2026-11-03 (Node 24.16): V8 rullar 02-30 till 2 mars och T24:00 till nästa dag 00:00 – evenemanget hamnar på fel dag utan att någon ser det – medan 13-01 ger `Invalid Date`, och `toISOString()` kastar då `RangeError: Invalid time value`. `formatDate` m.fl. går via `asUtc` → `Intl.DateTimeFormat.format` (rad 30, 33), som också kastar på `Invalid Date`: evenemangssidan, korten och startsidan faller med felskärm (ingen `error.tsx`, SD-04). I `ics.ts` kastar `nextDay` (rad 52–54) och `addHours` (rad 97–99) – ett enda ogiltigt datum tar ner hela `/kalender.ics` för alla prenumeranter.
- **Åtgärd:** Validera med rundtur: parsa, kräv att `getTime()` inte är `NaN` och att formatering tillbaka ger samma sträng, och ge fältfel i stället för att spara; A:1159–1160 vederlägger ren `Date.parse`/rundtur utan vakt (R-21).
- **Verifiering:** A:1056-1057 – `2025-02-30T12:00`, `2025-02-28T24:00`, `2025-13-01T12:00` och `2025-02-28T12:60` ger fältfel (ingen felskärm); `2025-02-28T12:00` sparas.
- **Status:** Öppen – belagd 2026-11-03

### SB-33 Nyhetens `published_at` sätts vid skapandet, skickas tillbaka av formuläret och flyttas aldrig till publiceringsögonblicket
- **Källa:** A/M25
- **Fil och rad:** `src/app/admin/_actions/news.ts:28-44`; `src/app/admin/_actions/news.ts:53-60`; `src/app/admin/_actions/news.ts:67-70`; `src/components/admin/news-form.tsx:9-21`; `src/components/admin/news-form.tsx:36`; `src/components/admin/news-form.tsx:50-53`; `src/components/admin/publish-buttons.ts:7-9`; `src/lib/data/news.ts:32-36`; `src/lib/admin/helpers.ts:44-46`
- **Kodrad:** ``const d = new Date(`${local}:00${offset}`);`` — `src/app/admin/_actions/news.ts:30`; `if (back === local) return d.toISOString();` — `src/app/admin/_actions/news.ts:42`; `const publishedAt = d.published_at ? stockholmToIso(d.published_at) : nowIso();` — `src/app/admin/_actions/news.ts:55`; `const existing = db.prepare("SELECT id, committee_id, pinned, cover_media_id FROM news WHERE id = ?").get(id) as` — `src/app/admin/_actions/news.ts:59`; `).run({ ...d, slug, committee_id: committeeId, pinned: isEditor(user) ? pinned : existing.pinned, published_at: publishedAt, updated_at: nowIso(), id });` — `src/app/admin/_actions/news.ts:69`; `.format(new Date(iso))` — `src/components/admin/news-form.tsx:19`; `const scheduled = !!item && item.published_at > new Date().toISOString();` — `src/components/admin/news-form.tsx:36`; `<TextInput type="datetime-local" name="published_at" defaultValue={item ? isoToLocalInput(item.published_at) : ""} />` — `src/components/admin/news-form.tsx:52`; `submitLabel: !item ? newLabel : item.published ? "Spara ändringar" : "Publicera",` — `src/components/admin/publish-buttons.ts:7`; `submitValue: { name: "published", value: "1" },` — `src/components/admin/publish-buttons.ts:8`; `ORDER BY n.pinned DESC, n.published_at DESC LIMIT ? OFFSET ?` — `src/lib/data/news.ts:34`; `return new Date().toISOString();` — `src/lib/admin/helpers.ts:45`
- **Felscenario:** Ett utkast sparat på måndag får `published_at = nu` (rad 55, `nowIso` rad 45). Formuläret förifyller fältet med det värdet (rad 52, via `isoToLocalInput` rad 9–21) och skickar tillbaka det, så varje senare sparning – även knappen "Publicera" (rad 7–8) på fredag – behåller måndagens tid: nyheten sorteras (rad 34) under allt som publicerats under veckan och visas med fel datum. Uppdateringsgrenen läser inte `published` ur databasen (rad 59), så actionen kan inte veta att det är första publiceringen och sätta tiden då. Rundturen Stockholm → ISO → Stockholm (rad 30–42) tappar sekunderna, så sparningar kan byta ordning på nyheter publicerade samma minut.
- **Åtgärd:** Lämna fältet tomt för utkast (fyll bara i när redaktören schemalagt), läs `published` i `existing` och sätt `published_at` när `published` går från 0 till 1; A:1189 vederlägger att jämföra ISO-strängar för "oförändrat datum" (R-23).
- **Verifiering:** A:1058-1059 – skapa utkast, vänta en minut, tryck "Publicera" utan att röra datumet → `published_at` ≈ nu och nyheten ligger överst.
- **Status:** Öppen – belagd 2026-11-03

### SB-34 Auth- och kontoactions svarar utan att uppdatera skalet – bannern "byt lösenord" och kontolistan är gamla tills nästa omladdning
- **Källa:** A/L12, A/L40; se ST-12
- **Fil och rad:** `src/app/admin/_actions/auth.ts:85-88`; `src/app/admin/_actions/auth.ts:98-101`; `src/app/admin/_actions/auth.ts:103-107`; `src/app/admin/layout.tsx:25-29`; `src/app/admin/layout.tsx:42-46`; `src/app/admin/_actions/users.ts:55-58`; `src/app/admin/_actions/users.ts:65-72`; `src/app/admin/_actions/users.ts:86-89`; `src/app/admin/_actions/users.ts:93`; `src/app/admin/_actions/users.ts:103`
- **Kodrad:** `return { ok: true, message: "Lösenordet är bytt. Andra inloggade enheter har loggats ut." };` — `src/app/admin/_actions/auth.ts:87`; `return { ok: true, message: "Profilen är sparad." };` — `src/app/admin/_actions/auth.ts:100`; `return { ok: true, message: "Alla andra enheter har loggats ut." };` — `src/app/admin/_actions/auth.ts:106`; `{user.must_change_password && (` — `src/app/admin/layout.tsx:44`; `return { ok: true, message: "Kontot är sparat." };` — `src/app/admin/_actions/users.ts:57`; `data: { password, email: d.email },` — `src/app/admin/_actions/users.ts:70`; `return { ok: true, message: "Nytt tillfälligt lösenord (visas bara nu):", data: { password, email: user.email } };` — `src/app/admin/_actions/users.ts:88`; `redirect("/admin/konton?raderad=1");` — `src/app/admin/_actions/users.ts:103`
- **Saknar:** `revalidate` i `src/app/admin/_actions/auth.ts`; `refresh(` i `src/app/admin/_actions/auth.ts`; `revalidate` i `src/app/admin/_actions/users.ts`; `refresh(` i `src/app/admin/_actions/users.ts`
- **Felscenario:** Lösenordsbytet (rad 87), profilen (rad 100) och utloggningen av andra enheter (rad 106) returnerar bara ett meddelande – ingen `revalidatePath`/`refresh()`. Adminlayouten läser `must_change_password` när den renderas (rad 44), så efter bytet står den röda bannern kvar tills användaren laddar om. `saveUser` (rad 57, 70) och `resetPassword` (rad 88) returnerar likadant, så kontolistan bredvid formuläret visar gammalt namn, roll och aktiv-status; bara `deleteUser` omdirigerar (rad 103) och får färskt innehåll. Med `<Activity>` som håller dolda sidor levande (SD-06) syns det gamla även när man navigerar tillbaka.
- **Åtgärd:** Vänta på B-14 (`revalidatePath("/admin", "layout")` eller `refresh()` från `next/cache` i actions); tills dess `router.refresh()` i `onSuccess` för dessa formulär.
- **Verifiering:** Byt lösenord i Admin → Konto → bannern försvinner utan omladdning; spara ett konto → listan visar nya namnet direkt.
- **Status:** Öppen – belagd 2026-11-03; väntar på beslut B-14

### SB-35 Markdown- och rollfälten saknar `FieldError`, teckenräknaren visar inget tak och textarean saknar `maxLength`
- **Källa:** A/L15
- **Fil och rad:** `src/components/admin/markdown-editor.tsx:85-90`; `src/components/admin/markdown-editor.tsx:143-144`; `src/components/admin/user-form.tsx:28-45`; `src/app/admin/_actions/users.ts:18`; `src/app/admin/_actions/events.ts:29`; `src/app/admin/_actions/news.ts:16`; `src/app/admin/_actions/content.ts:173`
- **Kodrad:** `<label htmlFor={name} className="text-sm font-semibold">` — `src/components/admin/markdown-editor.tsx:86`; `<span className="font-mono text-[0.7rem] text-stone tabular">{value.length} tecken</span>` — `src/components/admin/markdown-editor.tsx:89`; `<legend className="mb-2 text-sm font-semibold">Roll</legend>` — `src/components/admin/user-form.tsx:29`; `role: z.enum(["admin", "editor", "committee"], { message: "Välj en roll." }),` — `src/app/admin/_actions/users.ts:18`; `body_md: zText(20000, "Beskrivningen"),` — `src/app/admin/_actions/events.ts:29`; `body_md: zText(40000, "Texten"),` — `src/app/admin/_actions/news.ts:16`; `.object({ slug: z.string(), title: zRequired(120, "Titeln"), lead: zText(500, "Ingressen"), body_md: zText(60000, "Texten") })` — `src/app/admin/_actions/content.ts:173`
- **Saknar:** `FieldError` i `src/components/admin/markdown-editor.tsx`; `FieldError` i `src/components/admin/user-form.tsx`; `maxLength` i `src/components/admin/markdown-editor.tsx`
- **Felscenario:** Markdown-editorn renderar etikett och räknare (rad 86, 89) men ingen `FieldError`, så serverns fel för `body_md` ("Texten får vara högst 40000 tecken") visas bara i den generella statusraden – inte vid fältet. Räknaren säger "41 203 tecken" utan att visa taket (20 000 för evenemang rad 29, 40 000 för nyheter rad 16, 60 000 för sidor rad 173) och textarean har inget `maxLength`, så redaktören upptäcker gränsen först vid sparningen. Rollfältet (rad 28–45) saknar också `FieldError`, så "Välj en roll." (rad 18) hamnar bara i statusraden.
- **Åtgärd:** Skicka `max` till `MarkdownEditor` (räknare "41 203 / 40 000" och `maxLength`), rendera `<FieldError name={name} />` under editorn och under rollfältet.
- **Verifiering:** Klistra in 41 000 tecken i en nyhet → räknaren blir röd och fältet markeras; skicka formuläret utan roll (DevTools) → felet står under rollvalet.
- **Status:** Öppen – belagd 2026-11-03

### SB-36 Galleriet: omsortering efter en batch utgår från en gammal ögonblicksbild, filsläpp på en ruta navigerar bort, misslyckade rutor ligger kvar, bildfältet tar bara första filen
- **Källa:** A/L16
- **Fil och rad:** `src/components/admin/gallery-manager.tsx:50-58`; `src/components/admin/gallery-manager.tsx:86-91`; `src/components/admin/gallery-manager.tsx:188`; `src/components/admin/gallery-manager.tsx:237-250`; `src/components/admin/image-field.tsx:40-51`; `src/components/admin/image-field.tsx:66-69`; `src/components/admin/markdown-editor.tsx:145-151`
- **Kodrad:** `const images = files.filter((f) => f.type.startsWith("image/") || /\.(heic|heif|avif)$/i.test(f.name));` — `src/components/admin/gallery-manager.tsx:51`; `const before = itemsRef.current.map((x) => x.id);` — `src/components/admin/gallery-manager.tsx:57`; `await Promise.all(Array.from({ length: Math.min(PARALLEL, queue.length) }, worker));` — `src/components/admin/gallery-manager.tsx:86`; `const ids = [...before, ...fresh];` — `src/components/admin/gallery-manager.tsx:89`; `startTransition(() => reorderEventImages(eventId, ids));` — `src/components/admin/gallery-manager.tsx:90`; `onDragOver={(e) => dragId !== null && e.preventDefault()}` — `src/components/admin/gallery-manager.tsx:188`; `{p.error ? (` — `src/components/admin/gallery-manager.tsx:239`; ``{p.error ? p.name : p.progress < 1 ? `Laddar upp ${p.name}` : "Optimerar…"}`` — `src/components/admin/gallery-manager.tsx:249`; `const res = await uploadFile(file, { purpose: "image" }, setProgress);` — `src/components/admin/image-field.tsx:44`; `const f = e.dataTransfer.files?.[0];` — `src/components/admin/image-field.tsx:68`; `const f = e.dataTransfer.files?.[0];` — `src/components/admin/markdown-editor.tsx:146`
- **Felscenario:** (1) `before` tas när batchen startar (rad 57); laddar redaktören upp en andra batch, eller tar bort en bild, medan den första pågår, skickar `reorderEventImages` (rad 89–90) en lista som saknar de nya eller behåller de borttagna – ordningen skrivs tillbaka till det gamla läget. (2) `onDragOver` kallar `preventDefault` bara när en galleribild dras (rad 188); släpper man en fil från skrivbordet på en befintlig ruta öppnar webbläsaren filen och lämnar adminsidan. (3) Upp till `PARALLEL` uppladdningar körs samtidigt (rad 86) mot en server som kör `sharp` på en liten maskin (SD-22). (4) En misslyckad uppladdning blir en ruta med feltext (rad 239, 249) som varken går att ta bort eller försöka igen. (5) Bildfältet och editorn tar bara `files[0]` (rad 68, 146) – släpper man tre bilder försvinner två tyst.
- **Åtgärd:** Beräkna ordningen från `itemsRef.current` när batchen är klar (bara id:n som fortfarande finns); `preventDefault` på `dragover`/`drop` för hela galleriet; kö med 1–2 parallella; "Försök igen"/"Ta bort" på felrutor; ta emot flera filer i editorn eller säg att bara en används.
- **Verifiering:** Ladda upp fem bilder och ta bort en medan de laddar → ordningen stämmer och den borttagna är borta; släpp en fil på en befintlig bild → inget sidbyte.
- **Status:** Öppen – belagd 2026-11-03

### SB-37 Små actionfel: `sort_order` nollas, `dirty` nollas före svaret, dokument kan sparas utan fil eller länk, `resetOnSuccess` utan verkan vid omdirigering, förhandsgranskningen kapar vid 50 000 men sparningen tillåter 60 000
- **Källa:** A/L17; se SD-25
- **Fil och rad:** `src/app/admin/_actions/content.ts:30-33`; `src/app/admin/_actions/content.ts:119`; `src/app/admin/_actions/content.ts:173`; `src/app/admin/_actions/content.ts:224-233`; `src/app/admin/_actions/content.ts:235`; `src/app/admin/_actions/content.ts:241`; `src/components/admin/action-form.tsx:85-88`; `src/app/admin/_actions/resources.ts:38-41`; `src/app/admin/_actions/resources.ts:67-70`
- **Kodrad:** `return renderMarkdown(md.slice(0, 50000));` — `src/app/admin/_actions/content.ts:32`; `sort_order: z.coerce.number().int().min(0).max(9999).default(0),` — `src/app/admin/_actions/content.ts:119`; `.object({ slug: z.string(), title: zRequired(120, "Titeln"), lead: zText(500, "Ingressen"), body_md: zText(60000, "Texten") })` — `src/app/admin/_actions/content.ts:173`; `const nextMedia = mediaId ?? (fd.get("remove_file") === "on" ? null : old.media_id);` — `src/app/admin/_actions/content.ts:225`; `if (!mediaId && !d.url) return { error: "Ladda upp en fil eller ange en länk.", fieldErrors: { file: "Välj en fil eller ange en länk." } };` — `src/app/admin/_actions/content.ts:235`; `redirect("/admin/dokument?sparad=1");` — `src/app/admin/_actions/content.ts:241`; `dirty.current = false;` — `src/components/admin/action-form.tsx:87`; `if (!upload && !kept && !d.url) return { error: "Ladda upp en fil eller ange en länk.", fieldErrors: { file: "Välj en fil eller ange en länk." } };` — `src/app/admin/_actions/resources.ts:40`; `redirect("/admin/hjalpmedel?sparad=1");` — `src/app/admin/_actions/resources.ts:69`
- **Felscenario:** (1) `sort_order` får `default(0)` (rad 119): ett formulär eller anrop som inte skickar fältet nollar utskottets plats i listan. (2) `ActionForm` sätter `dirty = false` innan actionen svarat (rad 87) – misslyckas sparningen kan panelen stängas utan varning fast texten är osparad (SD-25). (3) `saveDocument` kontrollerar "fil eller länk" bara vid nyskapande (rad 235); i uppdateringsgrenen kan `remove_file` plus tom `url` ge ett dokument utan något att öppna (rad 225) – hjälpmedlen gör kontrollen i båda fallen (rad 40). (4) `resetOnSuccess` är verkningslöst för formulär vars action omdirigerar efter nyskapande (dokument rad 241, hjälpmedel rad 69): formuläret monteras av innan `state.ok` når det. (5) Förhandsgranskningen renderar högst 50 000 tecken (rad 32) medan sidtexten får vara 60 000 (rad 173) – de sista 10 000 syns inte i förhandsgranskningen men publiceras.
- **Åtgärd:** Behåll det gamla `sort_order` när fältet saknas (`.optional()` + läs ur databasen); sätt `dirty = false` i `onSuccess` i stället för vid inskickning; kör "fil eller länk"-kontrollen även i uppdateringsgrenen; ta bort `resetOnSuccess` där actionen omdirigerar; ge förhandsgranskningen samma tak som sparningen.
- **Verifiering:** Spara ett utskott via ett formulär utan `sort_order` → platsen består; ta bort filen på ett dokument utan länk → fältfel; klistra in 55 000 tecken → förhandsgranskningen visar slutet.
- **Status:** Öppen – belagd 2026-11-03

### SB-38 `next=/admin` är hårdkodat i layouten, `requireUser` skickar ingen `next` och proxyn tappar frågesträngen
- **Källa:** A/L18, NY-6; se SD-27
- **Fil och rad:** `src/app/admin/layout.tsx:25-29`; `src/lib/auth/session.ts:94-97`; `src/proxy.ts:16-19`
- **Kodrad:** `if (!user) redirect("/logga-in?next=/admin");` — `src/app/admin/layout.tsx:27`; `if (!user) redirect("/logga-in");` — `src/lib/auth/session.ts:96`; `url.searchParams.set("next", pathname);` — `src/proxy.ts:18`
- **Felscenario:** Tre vägar till inloggningen ger tre olika återhopp: proxyn (rad 18) skickar `pathname` utan frågesträng, så `/admin/evenemang?sparad=1` landar på sidan utan parametrar; layouten (rad 27) skickar alltid `/admin` oavsett vilken adminsida som efterfrågades (den träffas när kakan finns men sessionen gått ut); `requireUser` i en action (rad 96) skickar ingen `next` alls, så användaren hamnar på inloggningens standardmål och förlorar formuläret (SD-27).
- **Åtgärd:** Bygg `next` av `pathname + search` i proxyn, låt layouten skicka den efterfrågade adressen (proxyn kan sätta en `x-pathname`-rubrik), och låt actions returnera ett felobjekt i stället för `redirect` (SD-27).
- **Verifiering:** Logga ut, öppna `/admin/evenemang?sparad=1` → efter inloggning hamnar man där med frågesträngen kvar; låt sessionen gå ut, öppna `/admin/nyheter` → tillbaka till `/admin/nyheter`.
- **Status:** Öppen – belagd 2026-11-03

## 4 Node

En punkt. Väntar på beslut: NO-01 (B-9). Mätt 2026-11-03: lokalt `node -v` = v24.16.0.

### NO-01 Node-golvet står på 20.9 men körningen kräver 22.12 – och ingen fil tvingar fram versionen
- **Källa:** A/M10 (inkl. A/rad-966 `.npmrc engine-strict`), D#6
- **Fil och rad:** `package.json:43-45`; `package.json:33`; `README.md:99`; `package-lock.json:3105`; `package-lock.json:6536`; `package-lock.json:2452`; `package-lock.json:1559`; `package-lock.json:4206`; `Dockerfile:5`; `Dockerfile:13`; `Dockerfile:23`; `.devcontainer/devcontainer.json:5`
- **Kodrad:** `"node": ">=20.9"` — `package.json:46`; `"@types/node": "^20",` — `package.json:34`; `Kräver Node.js 20.9 eller senare.` — `README.md:97`; `"node": ">=22"` — `package-lock.json:3106`; `"node": ">=22.12.0"` — `package-lock.json:6566`; `"node": "^20.19.0 || ^22.13.0 || >=24"` — `package-lock.json:2453`; `"node": "^20.19.0 || ^22.13.0 || >=23.5.0"` — `package-lock.json:1560`; `"node": "^18.18.0 || ^20.9.0 || >=21.1.0"` — `package-lock.json:4207`; `FROM node:22-bookworm-slim AS run` — `Dockerfile:23`; `"image": "mcr.microsoft.com/devcontainers/javascript-node:1-22-bookworm",` — `.devcontainer/devcontainer.json:5`
- **Saknas:** `.nvmrc`; `.npmrc`
- **Felscenario:** `engines.node >= 20.9` (rad 44) och README (rad 99) lovar Node 20, men `better-sqlite3@13` kräver `>=22` (lock rad 3105) och `sanitize-html@2.18.1` `>=22.12.0` (rad 6536): på Node 20 varnar `npm ci` med `EBADENGINE` och sajten faller vid körning. Dev-beroendena kräver `^20.19 || ^22.13 || >=24` (nästlad `eslint-visitor-keys@5.0.1`, rad 2452; `@napi-rs/wasm-runtime`, rad 1559) medan toppnivåns `eslint-visitor-keys@4.2.1` (rad 4206) nöjer sig med 18 – körningsgolvet är alltså 22.12, lint-golvet 22.13. Docker (rad 5, 13, 23) och devcontainern (rad 5) kör 22 utan patchnivå, lokalt kör 24.16, och `@types/node` är `^20` (rad 33): tre Node-världar. Ingen `.nvmrc` eller `.npmrc` finns, så `engines` tvingas aldrig fram.
- **Åtgärd:** Vänta på B-9 (golv `>=22.13` med `engine-strict`, eller Node 24 överallt). Oavsett: sätt `engines.node` till det verkliga golvet, lägg `.nvmrc` i samklang, höj `@types/node` till körningens major och rätta README rad 99.
- **Verifiering:** A:965-966 – `nvm use 20 && npm ci` vägrar med `EBADENGINE`; `node -v` i Docker-imagen och `.nvmrc` visar samma major.
- **Status:** Öppen – belagd 2026-11-03; väntar på beslut B-9

## 5 Beroenden

Sex punkter. Väntar på beslut: BE-02 (B-4). BE-05 avgör faktamotsägelsen mellan A och D om `npm audit` genom mätning. Kommandona `npm outdated`, `npm audit`, `npm audit --omit=dev` och `npm ls playwright --depth=0` kördes 2026-11-03.

### BE-01 e2e-testet importerar `playwright`, som bara finns som `extraneous` och inte i `package.json`
- **Källa:** A/M11 (beroendedelen), D#5; se SN-06
- **Fil och rad:** `tests/e2e.mjs:16`; `package.json:30-42`
- **Kodrad:** `import { chromium } from "playwright";` — `tests/e2e.mjs:16`; `"devDependencies": {` — `package.json:30`; `"tsx": "^4.23.15",` — `package.json:40`
- **Saknar:** `playwright` i `package.json`
- **Felscenario:** `npm ls playwright --depth=0` 2026-11-03 → `playwright@1.64.1 extraneous`: paketet ligger i `node_modules` utan att stå i `package.json` (rad 30–42). `npm ci` på en annan dator eller i CI installerar det inte, och `node tests/e2e.mjs` faller på `ERR_MODULE_NOT_FOUND` (rad 16); `npm prune` tar bort det lokalt.
- **Åtgärd:** `npm i -D playwright` (låst version) och `npx playwright install chromium` i README och CI; lägg `test:e2e` under `scripts`.
- **Verifiering:** A:1026 – `npm ci && npm run test:e2e` fungerar två gånger i rad.
- **Status:** Åtgärdad 2026-11-03 (commit 35c72d6); var Öppen – belagd 2026-11-03

### BE-02 Ingen Dependabot/Renovate – uppdateringar upptäcks bara när någon kör `npm outdated`
- **Källa:** A/M16, D#5; se SN-06
- **Fil och rad:** `package.json:37-38`
- **Kodrad:** `"eslint": "^9",` — `package.json:38`; `"eslint-config-next": "16.4.3",` — `package.json:39`
- **Saknas:** `.github/dependabot.yml`; `renovate.json`
- **Felscenario:** Repot har ingen `.github/`-katalog (`git ls-files .github` tomt 2026-11-03) och ingen Renovate-konfiguration. Säkerhetsrättningar i Next, sharp och better-sqlite3 når sajten först när någon minns att köra `npm outdated` (BE-03) – och de låsta versionerna (rad 38) rör sig inte ens med `npm update`. Med en styrelse som byts varje år glöms det.
- **Åtgärd:** Vänta på B-4 (veckovis grupperade minor/patch enligt A, eller månadsvis samlade enligt D); skapa `.github/dependabot.yml` för `npm`, `docker` och `github-actions` och koppla till CI (SN-06).
- **Verifiering:** En PR från Dependabot dyker upp inom en vecka efter att konfigurationen mergats.
- **Status:** Öppen – belagd 2026-11-03; väntar på beslut B-4

### BE-03 Patch- och minor-uppdateringar väntar: next 16.4.4, react 19.3.1, marked 18.1.3, tailwind 4.3.4
- **Källa:** A/rad-30, A/rad-31, A/rad-32 (listan rättad mot `npm outdated` 2026-11-03)
- **Fil och rad:** `package.json:21-24`; `package.json:31`; `package.json:38-39`
- **Kodrad:** `"@tailwindcss/turbopack": "^4",` — `package.json:32`; `"eslint-config-next": "16.4.3",` — `package.json:39`; `"tailwindcss": "^4",` — `package.json:41`
- **Felscenario:** `npm outdated` 2026-11-03: `@tailwindcss/turbopack` 4.3.3 → 4.3.4, `tailwindcss` 4.3.3 → 4.3.4 och `marked` 18.1.1 → 18.1.3 ligger inom intervallen (`npm update` räcker); `next` 16.4.3 → 16.4.4, `eslint-config-next` 16.4.3 → 16.4.4 (rad 38) och `react`/`react-dom` 19.3.0 → 19.3.1 är låsta (Wanted = Current) och kräver ändring i `package.json`. Patchar i Next innehåller ofta säkerhetsrättningar; utan BE-02 sker det först när någon tittar.
- **Åtgärd:** `npm update` för intervallen; höj `next`, `eslint-config-next`, `react` och `react-dom` i `package.json`; kör `npm run lint`, `npm run typecheck`, `npm run build` och e2e ensamt.
- **Verifiering:** `npm outdated` listar bara majorhoppen i BE-04.
- **Status:** Öppen – belagd 2026-11-03

### BE-04 Majorhopp att ta var för sig: eslint 10, TypeScript 7, @types/node 26
- **Källa:** A/rad-32, A/steg-21
- **Fil och rad:** `package.json:33`; `package.json:37`; `package.json:41`
- **Kodrad:** `"@types/node": "^20",` — `package.json:34`; `"eslint": "^9",` — `package.json:38`; `"typescript": "^5"` — `package.json:43`
- **Felscenario:** `npm outdated` 2026-11-03: `eslint` 9.39.5 → 10.14.0, `typescript` 5.9.3 → 7.0.2, `@types/node` 20.19.43 → 26.6.6. ESLint 10 kräver att `eslint-config-next` stödjer det, TypeScript 7 är den Go-baserade kompilatorn med egna avvikelser, och `@types/node` ska följa körningens major (22 eller 24, NO-01) – inte 26. Tas de i klump syns inte vilket hopp som bröt bygget.
- **Åtgärd:** Ett hopp per PR: `@types/node` till körningens major → `eslint` 10 (när `eslint-config-next` stödjer det) → TypeScript 7; `npm run lint && npm run typecheck && npm run build` efter varje.
- **Verifiering:** Varje PR grön i CI (SN-06); `npm outdated` tomt.
- **Status:** Öppen – belagd 2026-11-03

### BE-05 `npm audit`: 16 moderate i ESLint-kedjan, 0 i produktionsberoendena – båda planerna har rätt på sitt sätt
- **Källa:** A/rad-30, A/rad-31, D/rad-41; se Fakta-1 i avsnitt 7
- **Fil och rad:** `package.json:30`; `package.json:37`
- **Kodrad:** `"devDependencies": {` — `package.json:31`; `"eslint": "^9",` — `package.json:38`
- **Felscenario:** Mätt 2026-11-03: `npm audit` → "16 moderate severity vulnerabilities", alla `minimatch < 11.0.1` (GHSA-g3hv-75wg-m249, ReDoS via globparts) under `@typescript-eslint/typescript-estree` i ESLint-kedjan (dev, rad 30–37); `npm audit --omit=dev` → "found 0 vulnerabilities". A (rad 30–31) räknar de 16, D (rad 41) säger 0 utan att nämna flaggan. Sårbarheten ligger i lint-verktyg som aldrig körs på servern (standalone-bygget tar inte med dev-beroenden), men `npm audit fix --force` – som npm föreslår – installerar `eslint@4.0.0` (breaking).
- **Åtgärd:** Vänta på att `@typescript-eslint` släpper med `minimatch >= 11`, eller lägg `overrides: { "minimatch": "^11.0.1" }` i `package.json` om kedjan tål det; kör aldrig `npm audit fix --force` (R-35); dokumentera att `npm audit --omit=dev` är måttet för sajten.
- **Verifiering:** `npm audit --omit=dev` → 0; `npm audit` → 0 efter override eller uppdatering, och `npm run lint` fungerar.
- **Status:** Öppen – belagd 2026-11-03 (faktamotsägelsen avgjord genom mätning)

### BE-06 Tailwind körs via `@tailwindcss/turbopack`-laddaren utan PostCSS – konfigurationsdokumentet säger att sådana laddare inte stöds
- **Källa:** A/L26
- **Fil och rad:** `next.config.ts:51-58`; `package.json:31`; `package.json:39`
- **Kodrad:** `loaders: ["@tailwindcss/turbopack"],` — `next.config.ts:54`; `as: "*.css",` — `next.config.ts:55`; `"@tailwindcss/turbopack": "^4",` — `package.json:32`
- **Saknas:** `postcss.config.mjs`; `postcss.config.js`
- **Belägg:** `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/turbopack.md:169` — `Only loaders that return JavaScript code are supported. Loaders that transform files like stylesheets or images are not currently supported.`; `node_modules/next/dist/docs/01-app/03-api-reference/08-turbopack.md:99` — ``Automatically processes PostCSS config files (`postcss.config.js`, `.mjs`, `.cjs`, `.ts`, `.mts`, `.cts`) in a Node.js worker pool. Useful for Tailwind, Autoprefixer, etc.``
- **Felscenario:** CSS:en byggs av Tailwinds egen Turbopack-laddare (rad 54–55) och det finns ingen `postcss.config.*`. Nexts konfigurationsdokument säger att laddare som omvandlar stilmallar inte stöds (Belägg rad 169), medan Turbopack-översikten säger att PostCSS stöds (rad 99). Laddaren fungerar i dag (sajten byggs), men står utanför det dokumenterade stödet: en Next-uppgradering som ändrar laddar-API:t kan bryta bygget utan förvarning, och bygget körs bara lokalt och i Flys byggare (SN-06). Minnesanteckning: Turbopacks diskcache har redan gett gammal `globals.css` efter ändringar.
- **Åtgärd:** Pinna `@tailwindcss/turbopack` till exakt version och kör `npm run build` i CI (SN-06); A:s dubbelkoll vederlägger en "reserv"-`postcss.config` bredvid laddaren (R-19). Om Tailwinds dokumentation pekar på `@tailwindcss/postcss` för Next 16, byt väg i en egen PR.
- **Verifiering:** `npm run build` grönt efter varje Next-/Tailwind-uppdatering; `/_next/static/**/*.css` innehåller de nya klasserna efter en ändring i `globals.css` (töm `.next/cache` vid tvivel).
- **Status:** Öppen – belagd 2026-11-03

## 6 Städning

Tjugosju punkter. Väntar på beslut: ST-01 (B-7), ST-08 (B-19), ST-12 (B-14). ST-08 är ett förslag med mätvärde, inte ett fel. Mätningar, grep och git-kommandon kördes 2026-11-03; ST-22 är kontrollerad live.

### ST-01 Utskottsloggan sparas som adress-sträng och tre ställen baklängestolkar sökvägen
- **Källa:** A/S1; se SD-10
- **Fil och rad:** `src/lib/media-store.ts:123`; `src/app/admin/_actions/content.ts:156-162`; `src/app/admin/bilder/page.tsx:23-25`; `src/lib/db/migrations.ts:156`
- **Kodrad:** `(SELECT COUNT(*) FROM committees WHERE logo_url LIKE '%' || (SELECT path_base FROM media WHERE id = @id) || '%') AS n` — `src/lib/media-store.ts:123`; `const old = committee.logo_url?.startsWith("/media/")` — `src/app/admin/_actions/content.ts:158`; `db.prepare("SELECT id FROM media WHERE ? LIKE '/media/' || path_base || '-%'").get(committee.logo_url)` — `src/app/admin/_actions/content.ts:159`; `const logoRef = (url: string | null): ImageRef | null =>` — `src/app/admin/bilder/page.tsx:24`; `logo_media_id INTEGER REFERENCES media(id) ON DELETE SET NULL,` — `src/lib/db/migrations.ts:156`
- **Felscenario:** Utskottets logga lagras som text i `committees.logo_url` medan partnern har en riktig FK (`partners.logo_media_id`, migrations.ts:156). Därför måste `deleteMediaIfUnused` LIKE-matcha `path_base` mot adressen (media-store.ts:123), logobytet baklängestolka adressen för att hitta mediaraden (content.ts:158-159) och bildsidan i admin bygga en låtsas-`ImageRef` med `id: 0` och gissad storlek 400×400 (bilder/page.tsx:24-25). En adress som skrivits för hand eller pekar utanför `/media/` (SD-10) går tyst förbi alla tre: gamla filen blir kvar, räkningen missar, förhandsvisningen ljuger om storleken.
- **Åtgärd:** Vänta på B-7 (migreringssteg 10 krockar mellan `committees.logo_media_id`, Frågelådans `inbox_*` och kvittots `receipts`). Lägg sedan till `committees.logo_media_id` som partnern, flytta befintliga `/media/`-adresser i migreringen, räkna FK i `deleteMediaIfUnused` i stället för LIKE och ta bort `logoRef`.
- **Verifiering:** Byt logga på ett utskott: gamla filen försvinner, nya visas med rätt mått; `SELECT logo_url FROM committees WHERE logo_url LIKE '/media/%'` är tom efter migreringen.
- **Status:** Öppen – belagd 2026-11-03; väntar på beslut B-7

### ST-02 Två tidsformat och fyra Stockholmskonverterare
- **Källa:** A/S2
- **Fil och rad:** `src/lib/dates.ts:11`; `src/lib/dates.ts:147`; `src/app/admin/_actions/news.ts:27`; `src/components/admin/news-form.tsx:9-10`; `src/components/content/news-card.tsx:8-10`
- **Kodrad:** `const parts = new Intl.DateTimeFormat("sv-SE", {` — `src/lib/dates.ts:11`; `return new Intl.DateTimeFormat("sv-SE", {` — `src/lib/dates.ts:147`; `function stockholmToIso(local: string): string {` — `src/app/admin/_actions/news.ts:27`; `function isoToLocalInput(iso: string) {` — `src/components/admin/news-form.tsx:9`; `function isoToLocalDate(iso: string) {` — `src/components/content/news-card.tsx:8`
- **Felscenario:** Evenemang lagras som lokal tid utan zon (`YYYY-MM-DDTHH:MM`, SB-32) och nyheter som ISO med Z (`published_at = nowIso()`, SB-33). Därför finns fyra separata omräkningar mot Europe/Stockholm: dates.ts:11 och :147, `stockholmToIso` i nyhetsactionen (:27), `isoToLocalInput` i formuläret (:9) och `isoToLocalDate` i kortet (:8). Varje ny vy som visar en nyhet skriver en femte, och ett fel vid sommartidsövergången måste rättas på fyra ställen. SB-32 och SB-33 är symtom av samma delning.
- **Åtgärd:** Samla konverteringarna i `src/lib/dates.ts` (`localToIso`, `isoToLocal`, `isoToLocalInput`) och importera dem i nyhetsformulär, action och kort; välj ett lagringsformat för båda typerna i samma PR som SB-32/SB-33.
- **Verifiering:** `grep -rn "Intl.DateTimeFormat" src` ger bara träffar i `src/lib/dates.ts`; ett datum över sommartidsgränsen (sista söndagen i mars 02:30) visas lika i admin och publikt; e2e:s nyhets- och evenemangssteg gröna.
- **Status:** Öppen – belagd 2026-11-03

### ST-03 Zod-uppräkningar och `sort_order`-regeln skrivs om i varje action
- **Källa:** A/S3
- **Fil och rad:** `src/app/admin/_actions/content.ts:119`; `src/app/admin/_actions/content.ts:189`; `src/app/admin/_actions/content.ts:269`; `src/app/admin/_actions/content.ts:328`; `src/app/admin/_actions/links.ts:14`; `src/app/admin/_actions/users.ts:18`; `src/app/admin/_actions/resources.ts:17`; `src/lib/types.ts:153`; `src/lib/admin/form.ts:35-39`
- **Kodrad:** `sort_order: z.coerce.number().int().min(0).max(9999).default(0),` — `src/app/admin/_actions/content.ts:119`; `sort_order: z.coerce.number().int().min(0).max(9999).default(0),` — `src/app/admin/_actions/content.ts:269`; `const zOrder = z.coerce.number().int().min(0).max(9999).default(0);` — `src/app/admin/_actions/links.ts:14`; `category: z.enum(["styrdokument", "protokoll", "grafiskt", "ovrigt"]),` — `src/app/admin/_actions/content.ts:189`; `export type DocumentCategory = "styrdokument" | "protokoll" | "grafiskt" | "ovrigt";` — `src/lib/types.ts:153`; `role: z.enum(["admin", "editor", "committee"], { message: "Välj en roll." }),` — `src/app/admin/_actions/users.ts:18`; `program: z.enum(["kandidat", "master", "bada"]),` — `src/app/admin/_actions/resources.ts:17`; `hero_ring_color: z.enum(["red", "white"], "Välj röd eller vit."),` — `src/app/admin/_actions/content.ts:328`; `export const zRequired = (max: number, label = "Fältet") =>` — `src/lib/admin/form.ts:37`
- **Felscenario:** Samma `sort_order`-regel står tre gånger (content.ts:119 och :269, links.ts:14 som `zOrder`), och värdelistorna för dokumentkategori, roll och program finns både som Zod-enum i actionen och som TypeScript-typ (types.ts:153 mot content.ts:189). Lägger någon till kategorin `remiss` i typen utan att röra actionen avvisas formuläret med "Ogiltigt värde" – kompilatorn säger inget eftersom listorna inte delar källa. `form.ts` har redan `zText`/`zRequired`/`zCheckbox` (:35-39) som mönster.
- **Åtgärd:** Definiera listorna en gång (`DOCUMENT_CATEGORIES = [...] as const` med `type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number]`) i `src/lib/types.ts` och härled Zod-enumen (`z.enum(DOCUMENT_CATEGORIES)`); gör `zOrder` till en delad hjälpare i `src/lib/admin/form.ts` bredvid `zRequired`.
- **Verifiering:** `npm run typecheck` grönt; `grep -rn 'max(9999)' src` ger en träff; en ny kategori tillagd på ett ställe syns både i formuläret och i filtreringen.
- **Status:** Öppen – belagd 2026-11-03

### ST-04 `getSettings()` läser inställningarna på nytt för varje anrop i samma rendering
- **Källa:** A/S4
- **Fil och rad:** `src/lib/data/content.ts:26`; `src/components/home/hero.tsx:1`; `src/components/layout/site-footer.tsx:1`
- **Kodrad:** `export async function getSettings(): Promise<SiteSettings> {` — `src/lib/data/content.ts:26`
- **Saknar:** `cache(` i `src/lib/data/content.ts`
- **Belägg:** `node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md:602` — `within one request return the same memoized result.`; `node_modules/next/dist/docs/01-app/01-getting-started/06-fetching-data.md:604` — `is scoped to the current request only. Each request gets its own memoization scope with no sharing between requests.`
- **Felscenario:** `getSettings()` anropas från tio ställen i åtta filer (grep 2026-11-03: `en/page`, `kontakt/page`, `installningar/page`, `redigera/route`, `hero`, `home-sections`, `announcement`, `site-footer`); på startsidan läser hjälten, sektionerna, meddelanderaden och sidfoten var för sig – fyra `SELECT` per rendering, eftersom funktionen inte är inslagen i Reacts `cache()` (Belägg: dedupering per request). Billigt i SQLite men onödigt, och skrivs inställningarna mitt i en rendering kan två delar av samma sida visa olika värden.
- **Åtgärd:** `export const getSettings = cache(async (): Promise<SiteSettings> => …)` med `import { cache } from "react"`; samma för `listCommittees` om den anropas flera gånger per sida.
- **Verifiering:** Logga satserna i dev (`new Database(path, { verbose: console.log })`) och ladda startsidan: en `SELECT … FROM settings` per request.
- **Status:** Öppen – belagd 2026-11-03

### ST-05 Adminöversikten läser alla evenemang och nyheter utan LIMIT och filtrerar i JS
- **Källa:** A/S5
- **Fil och rad:** `src/lib/data/events.ts:90-93`; `src/app/admin/page.tsx:63-65`; `src/app/admin/page.tsx:74-79`
- **Kodrad:** ``.prepare(`${SELECT} ${committeeId ? "WHERE e.committee_id = ?" : ""} ORDER BY e.starts_at DESC`)`` — `src/lib/data/events.ts:92`; `const upcomingOf = (events: EventItem[], now: string) => events.filter((e) => e.starts_at >= now.slice(0, 10)).reverse().slice(0, 5);` — `src/app/admin/page.tsx:63`; `committee ? listEventsForAdmin(committee.id) : [],` — `src/app/admin/page.tsx:75`; `design ? listEventsForAdmin(null) : [],` — `src/app/admin/page.tsx:78`
- **Felscenario:** `listEventsForAdmin` hämtar alla rader (events.ts:92, ingen LIMIT) och översikten skär sedan i JS till fem, sex och fyra (page.tsx:63-65); grafiskt ansvarig läser dessutom hela tabellen en gång till (:78). Med några hundra evenemang och bilder per rad är det fortfarande snabbt i SQLite, men varje visning av `/admin` serialiserar hela historiken. Växer sajten (galleri, Frågelådan F-01, kvitton F-02) är admin den första sidan som segar.
- **Åtgärd:** Ge `listEventsForAdmin`/`listNewsForAdmin` `limit`- och `since`-parametrar och gör översiktens tre urval i SQL (`WHERE starts_at >= ? ORDER BY starts_at LIMIT 5`); sidindela listsidorna.
- **Verifiering:** Med 500 seedade evenemang: `/admin` renderas under 200 ms på servern; `EXPLAIN QUERY PLAN` visar att `events_starts` används.
- **Status:** Öppen – belagd 2026-11-03

### ST-06 Varje bild avkodas fyra gånger: tre bredder och `stats()`
- **Källa:** A/S6; se SD-22, SD-30, F-02
- **Fil och rad:** `src/lib/media-store.ts:14`; `src/lib/media-store.ts:64-69`; `src/lib/media-store.ts:74`
- **Kodrad:** `const IMAGE_WIDTHS = [480, 1200, 2000];` — `src/lib/media-store.ts:14`; `const info = await sharp(buffer, { animated: false })` — `src/lib/media-store.ts:65`; ``.toFile(path.join(UPLOADS_DIR, `${base}-${w}.webp`));`` — `src/lib/media-store.ts:69`; `const { dominant } = await sharp(buffer).rotate().resize(64).stats();` — `src/lib/media-store.ts:74`
- **Felscenario:** Loopen (:64-69) skapar en ny `sharp(buffer)` per bredd och färgen beräknas med en fjärde (:74): en 12 MP JPEG avkodas fyra gånger (~50 MB råpixlar vardera, SD-22) på en Fly-maskin med delat minne. A:s dubbelkoll vederlägger `.clone()`+`Promise.all` som lösning (R-28) – klonerna delar avkodningen men kör parallellt och höjer toppminnet.
- **Åtgärd:** Avkoda en gång till största bredden (`sharp(buffer).rotate().resize(2000).toBuffer()`) och gör 1200/480 samt `stats()` från den buffern; eller behåll loopen men ta färgen från 480-varianten. HEIC-stöd (F-02, C/rad-45) löses i samma funktion.
- **Verifiering:** Tid och toppminne (`process.memoryUsage().rss`) före/efter för en 12 MP-bild; de tre WebP-filerna inom ±5 % av tidigare storlek.
- **Status:** Öppen – belagd 2026-11-03

### ST-07 Fyra `[id]`-sidor i admin med samma skelett
- **Källa:** A/S7
- **Fil och rad:** `src/app/admin/partners/[id]/page.tsx:22-24`
- **Kodrad:** `async function EditPartner({ params }: { params: PageProps<"/admin/partners/[id]">["params"] }) {` — `src/app/admin/partners/[id]/page.tsx:22`; `const user = await requireUser();` — `src/app/admin/partners/[id]/page.tsx:23`; `if (!isEditor(user)) redirect("/admin?nekad=1");` — `src/app/admin/partners/[id]/page.tsx:24`
- **Felscenario:** `src/app/admin/{dokument,lankar,partners,hjalpmedel}/[id]/page.tsx` är 45, 44, 44 och 42 rader (`wc -l` 2026-11-03) med samma struktur: `requireUser`, `isEditor`-spärr med omdirigering till `/admin?nekad=1`, hämta rad på `params.id`, `notFound()`, rendera formulär – lika i upplägg, inte byte för byte (A:s dubbelkoll). Ändras spärren (SB-38:s `next=`) eller 404-hanteringen (SB-16) måste det göras fyra gånger, och de glider redan isär (tre raders skillnad).
- **Åtgärd:** En delad `requireEditorAndLoad(params, loader)` i `src/lib/admin/helpers.ts` (spärr + `notFound()`), så att de fyra sidorna bara innehåller formuläret.
- **Verifiering:** De fyra sidorna under 20 rader vardera; e2e:s redigeringssteg för dokument, länk, partner och hjälpmedel gröna.
- **Status:** Öppen – belagd 2026-11-03

### ST-08 `logo-paths.ts` (31 kB rå, 11,9 kB gzip) importeras av två klientkomponenter – mät innan något flyttas
- **Källa:** A/S8; se B-19
- **Fil och rad:** `src/components/brand/formula-ring.tsx:4`; `src/components/brand/floating-logo.tsx:4`; `src/lib/brand/logo-paths.ts:1`
- **Kodrad:** `import { LOGO_GEOMETRY as G, LOGO_VIEWBOX } from "@/lib/brand/logo-paths";` — `src/components/brand/formula-ring.tsx:4`; `import { LOGO_GEOMETRY as G, LOGO_GRID, LOGO_SIGNATURE, LOGO_TEXT, LOGO_VIEWBOX } from "@/lib/brand/logo-paths";` — `src/components/brand/floating-logo.tsx:4`
- **Felscenario:** Mätt 2026-11-03: `logo-paths.ts` är 31 096 B rå, 11 925 B gzip, 10 554 B brotli. Båda importörerna är klientkomponenter, så vektorbanorna följer med i klientbundlen till varje sida som visar loggan. A (rad 847–851) bedömer flytten som "troligen inte värd det", D (rad 48) räknar +10–15 kB – samma mätning, olika slutsats (B-19). Den verkliga kostnaden beror på om modulen hamnar i en delad chunk som bara laddas där loggan visas eller dubbleras.
- **Åtgärd:** Mät först: jämför `.next/static/chunks` (eller en bundle-analys) före och efter en flytt till en serverkomponent som renderar banorna statiskt och bara skickar animationsparametrarna till klienten; flytta bara om modulen dubbleras eller ligger i startchunken för sidor utan logga.
- **Verifiering:** Bundle-rapporten visar `logo-paths` en gång, i en chunk som bara laddas där loggan visas; Lighthouse "Reduce unused JavaScript" minskar med ~12 kB gzip – eller inte alls, och då stängs punkten.
- **Status:** Förslag – belagd 2026-11-03 (mät först); väntar på beslut B-19

### ST-09 Skripten dubblerar lösenordsgeneratorn och databasöppningen
- **Källa:** A/S10
- **Fil och rad:** `scripts/create-admin.mjs:23-33`; `scripts/create-accounts.mjs:48-57`; `src/lib/auth/password.ts:15-23`
- **Kodrad:** `const dataDir = path.resolve(process.env.DATA_DIR ?? path.join(process.cwd(), "data"));` — `scripts/create-admin.mjs:23`; `const dataDir = path.resolve(process.env.DATA_DIR ?? path.join(process.cwd(), "data"));` — `scripts/create-accounts.mjs:48`; ``const password = `${pick()}-${pick()}-${crypto.randomInt(1000, 9999)}`;`` — `scripts/create-admin.mjs:32`; ``const newPassword = () => `${pick()}-${pick()}-${crypto.randomInt(1000, 9999)}`;`` — `scripts/create-accounts.mjs:57`; ``return `${pick()}-${pick()}-${crypto.randomInt(1000, 9999)}`;`` — `src/lib/auth/password.ts:22`
- **Felscenario:** Ordlistan och formeln finns tre gånger: `password.ts` har 24 ord (:16-20), de två skripten 12 (create-admin.mjs:30, create-accounts.mjs:55) – skriptens lösenord är därför en bit svagare än appens (SD-24: ~20 mot ~22 bitar). Databasöppningen (`DATA_DIR`, `statlin.db`, "Hittar ingen databas …") är kopierad rad för rad (:23-28 mot :48-53). Kopian finns för att skripten körs som ren `.mjs` utanför Nexts bygge och inte kan nå `@/lib`-modulerna.
- **Åtgärd:** `scripts/lib.mjs` (ren JS) med `openDb()` och `generatePassword()` som båda skripten importerar; låt `password.ts` läsa samma ordlista (JSON som båda delar) så att det är 24 ord överallt.
- **Verifiering:** `node scripts/create-admin.mjs` och `node scripts/create-accounts.mjs` fungerar efter ändringen; `grep -rn "kvartil" scripts src` ger en träff.
- **Status:** Öppen – belagd 2026-11-03

### ST-10 Booleans lagras och typas som `number`
- **Källa:** A/S11
- **Fil och rad:** `src/lib/types.ts:57`; `src/lib/types.ts:69-70`; `src/lib/types.ts:113`; `src/lib/types.ts:141-142`; `src/lib/types.ts:214`; `src/lib/types.ts:237`; `src/lib/types.ts:251-253`; `src/app/admin/page.tsx:65`; `src/app/admin/_actions/content.ts:118`
- **Kodrad:** `visible: number;` — `src/lib/types.ts:57`; `must_change_password: number;` — `src/lib/types.ts:69`; `active: number;` — `src/lib/types.ts:70`; `published: number;` — `src/lib/types.ts:113`; `pinned: number;` — `src/lib/types.ts:142`; `featured: number;` — `src/lib/types.ts:251`; `const needingImages = (events: EventItem[], now: string) => events.filter((e) => e.starts_at < now && e.image_count === 0 && e.published).slice(0, 4);` — `src/app/admin/page.tsx:65`; `visible: zCheckbox,` — `src/app/admin/_actions/content.ts:118`
- **Felscenario:** SQLite saknar boolean, så `visible`, `active`, `published`, `pinned`, `featured` och `must_change_password` är `number` i typerna (tio fält, grep 2026-11-03) och koden blandar `e.published` som sanningsvärde (admin/page.tsx:65) med `= 1`-jämförelser i SQL. Typen låter `active: 2` passera, och varje formulär gör samma 0/1-översättning via `zCheckbox` (content.ts:118) och tillbaka i varje `map()`.
- **Åtgärd:** Behåll INTEGER i databasen men konvertera i `map()`-funktionerna i `src/lib/data/*` (`active: Boolean(r.active)`) och typa fälten som `boolean`; en `toBool`-hjälpare i `src/lib/db/`.
- **Verifiering:** `npm run typecheck` grönt efter typbytet (kompilatorn pekar ut varje `=== 1`); e2e grönt.
- **Status:** Öppen – belagd 2026-11-03

### ST-11 Kopierade småhjälpare: `simplify` ×3, `forbidden` ×5, `json()` ×2, två listor över tillåtna origin
- **Källa:** A/S12
- **Fil och rad:** `src/app/admin/page.tsx:67`; `src/components/admin/task-form.tsx:24`; `src/components/admin/task-ui.tsx:37`; `src/app/admin/_actions/content.ts:26`; `src/app/admin/_actions/links.ts:13`; `src/app/admin/_actions/tasks.ts:13`; `src/app/admin/_actions/users.ts:12`; `src/app/api/admin/redigera/route.ts:8-9`; `src/app/api/admin/upload/route.ts:3`; `src/app/api/admin/upload/route.ts:10`; `next.config.ts:10-11`; `src/lib/allowed-origins.ts:19`; `src/lib/allowed-origins.ts:29`
- **Kodrad:** `const simplify = (s: string) => s.toLowerCase().replace(/[^a-z0-9åäö]/g, "");` — `src/app/admin/page.tsx:67`; `const simplify = (s: string) => s.toLowerCase().replace(/[^a-z0-9åäö]/g, "");` — `src/components/admin/task-ui.tsx:37`; `const forbidden: FormState = { error: "Du har inte behörighet att göra det här." };` — `src/app/admin/_actions/content.ts:26`; `const forbidden: FormState = { error: "Du har inte behörighet att göra det här." };` — `src/app/admin/_actions/links.ts:13`; `const forbidden: FormState = { error: "Endast administratörer kan hantera konton." };` — `src/app/admin/_actions/users.ts:12`; `const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });` — `src/app/api/admin/redigera/route.ts:8`; `const json = (body: unknown, status = 200) => Response.json(body, { status });` — `src/app/api/admin/upload/route.ts:10`; `const allowedOrigins = [` — `next.config.ts:11`; `return allowedOriginPatterns().some((p) => hostMatches(originHost, p));` — `src/lib/allowed-origins.ts:29`; `import { isAllowedOrigin } from "@/lib/allowed-origins";` — `src/app/api/admin/upload/route.ts:3`
- **Felscenario:** `simplify` (admin/page.tsx:67, task-form.tsx:24, task-ui.tsx:37) är tecken för tecken samma; `forbidden` finns i fyra actions med samma text, en femte med annan (users.ts:12) och som funktion i `redigera/route.ts:9`; de två `json`-hjälparna skiljer sig i just det som spelar roll – `redigera` sätter `Cache-Control: private, no-store` (:8), uppladdningen inte (:10). Listan över tillåtna origin står i `next.config.ts:11` (server actions) och som `allowedOriginPatterns()` i `src/lib/allowed-origins.ts` (uppladdningen, :29) – kommentaren på `next.config.ts:10` ber läsaren hålla dem i synk för hand. Rättas ett meddelande, en regex eller en värd på ett ställe glider de andra.
- **Åtgärd:** `forbidden(msg?)` och `simplify` i `src/lib/admin/helpers.ts`; `json()` med `no-store` som standard i en `src/lib/api.ts` som båda rutterna använder; en enda origin-lista som `next.config.ts` importerar från `src/lib/allowed-origins.ts`.
- **Verifiering:** `grep -rn "const simplify\|const forbidden\|const json =" src` ger en träff vardera; svaret från `/api/admin/upload` bär `Cache-Control: private, no-store`; en ny värd tillagd på ett ställe gäller både actions och uppladdning.
- **Status:** Öppen – belagd 2026-11-03

### ST-12 Revalidering för hand: `revalidatePath("/", "layout")` tömmer alla skal, en verkningslös rad i uppladdningsrutten
- **Källa:** A/S13; se SB-34
- **Fil och rad:** `src/lib/admin/helpers.ts:39-42`; `src/app/api/admin/upload/route.ts:71`; `src/app/admin/_actions/tasks.ts:25`; `src/components/edit-mode/edit-drawer.tsx:71-72`; `src/lib/data/exam-stats.ts:9-11`
- **Kodrad:** `revalidatePath("/", "layout");` — `src/lib/admin/helpers.ts:41`; `revalidatePath("/", "layout");` — `src/app/api/admin/upload/route.ts:71`; `const revalidateBoard = () => revalidatePath("/admin", "layout");` — `src/app/admin/_actions/tasks.ts:25`; `if (open.type === "event-images") router.refresh();` — `src/components/edit-mode/edit-drawer.tsx:72`; `* Svaren sparas i databasen – inte i Nexts minnescache, som töms när Fly-maskinen stängs av – och` — `src/lib/data/exam-stats.ts:10`
- **Belägg:** `node_modules/next/dist/docs/01-app/02-guides/how-revalidation-works.md:49` — `Each segment in the path gets a layout tag, plus the leaf route itself.`; `node_modules/next/dist/docs/01-app/02-guides/how-revalidation-works.md:51` — `it invalidates cache entries associated with that path's leaf route tag and its ancestor layout soft tags`; `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidatePath.md:175` — `and invalidate all cached data for revalidation on the next page visit.`; `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidatePath.md:20` — `Marks the path for revalidation. The revalidation is done on the next visit to the specified path.`; `node_modules/next/dist/docs/01-app/01-getting-started/09-revalidating.md:187` — `over path-based when possible — it's more precise and avoids over-invalidating.`; `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/refresh.md:13` — `It cannot be used in Route Handlers, Client Components, or any other context.`; `node_modules/next/dist/docs/01-app/02-guides/server-actions.md:46` — `to refetch the current route's RSC Payload.`; `node_modules/next/dist/server/web/spec-extension/revalidate.js:71` — `refresh can only be called from within a Server Action.`; `node_modules/next/dist/server/web/spec-extension/revalidate.js:74` — `// The Server Action version of refresh() only revalidates the dynamic data`; `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/connection.md:84` — `only when rendering should wait for a real user request.`
- **Felscenario:** Varje action anropar `audit()` och `revalidateSite()` för hand, och `revalidateSite` är `revalidatePath("/", "layout")` (:41): det träffar rotens layout-tagg `_N_T_/layout`, som varje sida bär (Belägg how-revalidation-works.md:49-51), så hela den cachade sajten plus klientcachen (revalidatePath.md:175) töms vid varje liten ändring – även där en smalare sökväg räcker, som uppdragstavlans `/admin` (tasks.ts:25). Nexts egen rekommendation är taggar (09-revalidating.md:187). I uppladdningsrutten (:71) är anropet dessutom verkningslöst för panelen: i en Route Handler markerar `revalidatePath` bara sökvägen för nästa besök (revalidatePath.md:20), och panelen gör ändå `router.refresh()` när lådan stängs (edit-drawer.tsx:72). Glöms ett `revalidateSite()` i en ny action visas gammalt innehåll tills nästa deploy. A:s två förslag – `revalidatePath("/admin", "layout")` (L12) och `refresh()` (S13) – är B-14; `refresh()` går bara i Server Actions (refresh.md:13, revalidate.js:71) och rör inte cachad data (revalidate.js:74).
- **Åtgärd:** Vänta på B-14. Oavsett: en `commit(user, { action, entity, id, label, tags })`-hjälpare som gör `audit()` + revalidering i ett, med `revalidateTag`/`updateTag` per innehållstyp (`events`, `news`, `settings`) i stället för hela layouten; ta bort raden i uppladdningsrutten eller ersätt den med evenemangets tagg. Tentastatistikens sparade svar (exam-stats.ts:10) ligger i databasen och berörs inte.
- **Verifiering:** Ändra en nyhet och mät `/evenemang`: svaret serveras utan ny rendering (svarstid och serverlogg); ändra ett evenemang och `/evenemang` uppdateras direkt; inget `revalidatePath("/", "layout")` kvar i `src`.
- **Status:** Öppen – belagd 2026-11-03; väntar på beslut B-14

### ST-13 N+1 i `listGalleryAlbums` och inga index på `*_media_id`/`committee_id`
- **Källa:** A/S14
- **Fil och rad:** `src/lib/data/events.ts:125-133`; `src/lib/data/events.ts:92`; `src/lib/db/migrations.ts:49`; `src/lib/db/migrations.ts:74-75`; `src/lib/db/migrations.ts:90-91`; `src/lib/db/migrations.ts:118-119`; `src/lib/db/migrations.ts:156`; `src/lib/db/migrations.ts:66`; `src/lib/db/migrations.ts:99`; `src/lib/db/migrations.ts:110`; `src/lib/db/migrations.ts:127`; `src/lib/db/migrations.ts:176`; `src/lib/db/migrations.ts:204-205`; `src/lib/db/migrations.ts:213`; `src/lib/db/migrations.ts:245`
- **Kodrad:** `const previewStmt = db.prepare(` — `src/lib/data/events.ts:125`; `const preview = (previewStmt.all(event.id) as Media[]).map((m) => toImageRef(m)!).filter(Boolean);` — `src/lib/data/events.ts:131`; `committee_id INTEGER REFERENCES committees(id) ON DELETE SET NULL,` — `src/lib/db/migrations.ts:90`; `cover_media_id INTEGER REFERENCES media(id) ON DELETE SET NULL,` — `src/lib/db/migrations.ts:91`; `photo_media_id INTEGER REFERENCES media(id) ON DELETE SET NULL,` — `src/lib/db/migrations.ts:74`; `CREATE INDEX events_starts ON events(starts_at);` — `src/lib/db/migrations.ts:99`; `CREATE INDEX event_images_event ON event_images(event_id, sort_order);` — `src/lib/db/migrations.ts:110`
- **Saknar:** `(committee_id` i `src/lib/db/migrations.ts`; `(cover_media_id` i `src/lib/db/migrations.ts`; `(photo_media_id` i `src/lib/db/migrations.ts`; `(logo_media_id` i `src/lib/db/migrations.ts`
- **Felscenario:** Galleriet kör en `SELECT` per album (events.ts:131 i loopen :129-133): 60 album är 61 frågor per sidvisning. Nio index finns (migrations.ts:66–245) men inget på FK-kolumnerna `committee_id` (fyra tabeller: :49, :75, :90, :119), `cover_media_id` (:91, :118), `photo_media_id` (:74) eller `logo_media_id` (:156): `deleteMediaIfUnused` (SD-09), utskottsfiltret `WHERE e.committee_id = ?` (events.ts:92) och `ON DELETE SET NULL` från `media` blir tabellsvep. Litet i dag, men det är just de frågorna som körs vid varje radering och varje utskottssida.
- **Åtgärd:** Ett migreringssteg (numret ordnas i B-7) med `CREATE INDEX events_committee ON events(committee_id)` och motsvarande för alla `*_media_id`; skriv om `listGalleryAlbums` till en fråga (`ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY sort_order, id) <= 4`).
- **Verifiering:** `EXPLAIN QUERY PLAN` för `DELETE FROM media WHERE id = ?` och för utskottsfiltret visar `USING INDEX`; galleriet gör en fråga (räknat med `verbose`-loggen).
- **Status:** Öppen – belagd 2026-11-03

### ST-14 Döda exporter: `canManageUsers`, `canManageSiteContent`, `requireRole`, `initialFormState`
- **Källa:** A/S15 (inkl. A/rad-886)
- **Fil och rad:** `src/lib/auth/permissions.ts:55`; `src/lib/auth/permissions.ts:58`; `src/lib/auth/session.ts:101`; `src/lib/admin/form.ts:12`
- **Kodrad:** `export const canManageUsers = isAdmin;` — `src/lib/auth/permissions.ts:55`; `export const canManageSiteContent = isEditor;` — `src/lib/auth/permissions.ts:58`; `export async function requireRole(...roles: Role[]): Promise<SessionUser> {` — `src/lib/auth/session.ts:101`; `export const initialFormState: FormState = {};` — `src/lib/admin/form.ts:12`
- **Felscenario:** Grep 2026-11-03: `canManageUsers`, `canManageSiteContent`, `requireRole` och `initialFormState` förekommer bara i filen som exporterar dem, medan grannarna `canReviewEvents` och `canManageSettings` används i fyra respektive fem filer. A:s "~20 exporter som bara används i egen fil" (rad 886) är inte räknat här – de fyra är stickprov. Döda behörighetsalias är det farliga: nästa utvecklare tror att `canManageUsers` är spärren för kontosidan och ändrar regeln där, men ingen sida går genom aliaset.
- **Åtgärd:** Kör `npx knip` (eller `ts-prune`) en gång och ta bort det som är dött; låt CI (SN-06) köra `knip` som varning.
- **Verifiering:** `npx knip` rapporterar 0 oanvända exporter; `npm run typecheck` grönt.
- **Status:** Öppen – belagd 2026-11-03

### ST-15 Testluckor: nyheter i admin, låst konto, `must_change_password`, CSRF, `/media`-traversering, Markdown, sista admin
- **Källa:** A/S16 (A/rad-887–889)
- **Fil och rad:** `tests/smoke.mjs:16`; `tests/smoke.mjs:76`; `tests/smoke.mjs:112`; `tests/smoke.mjs:137`; `tests/smoke.mjs:140`; `tests/e2e.mjs:1080`
- **Kodrad:** `expect(res.status === 308 && location.endsWith("/tentastatistik/732G33"),` — `tests/smoke.mjs:76`; `await check("Kalenderflöde /kalender.ics", async () => {` — `tests/smoke.mjs:112`; `expect(res.status >= 300 && res.status < 400 && location.includes("/logga-in"),` — `tests/smoke.mjs:137`; `await check("Okänd sida ger 404", async () => {` — `tests/smoke.mjs:140`; `"/nyheter",` — `tests/smoke.mjs:16`; `// Grafiskt ansvar: bilderna på alla evenemang och nyheter, men inte texterna.` — `tests/e2e.mjs:1084`
- **Saknar:** `must_change_password` i `tests/e2e.mjs`; `must_change_password` i `tests/smoke.mjs`; `locked_until` i `tests/e2e.mjs`; `failed_logins` i `tests/e2e.mjs`; `Origin` i `tests/e2e.mjs`; `Origin` i `tests/smoke.mjs`; `../` i `tests/smoke.mjs`; `%2e` i `tests/e2e.mjs`
- **Felscenario:** Smoke täcker redan omdirigeringen (:76), ICS (:112), inloggningskravet (:137) och 404 (:140), så A:s förslag om dem är gjorda. Men "nyhet" förekommer i e2e bara i en kommentar (:1080) och i smoke bara som sökvägen `/nyheter` (:16): ingen test skapar eller redigerar en nyhet i admin (SB-33, SD-33). Ingen test rör kontolåsningen efter 20 försök (SD-11/SD-12; ordet "låst" i e2e gäller bara kategorifältet, :1129), tvångsbytet vid första inloggning (`must_change_password`), inaktiverat konto med levande session, POST utan `Origin` till uppladdningen (SD-20), `../` i `/media/`-sökvägar, Markdown-rensningen (SB-17) eller spärren mot att inaktivera sista admin.
- **Åtgärd:** Ny `tests/auth.mjs` utan webbläsare (fetch mot `npm run start`): 21:a försöket, tvångsbyte, inaktiverat konto, `Origin`-saknad → 403, `GET /media/..%2f..%2fetc%2fpasswd` → 404, Markdown med `<script>` → rensat, sista admin; nyhetssteg i e2e.
- **Verifiering:** Varje nytt steg rött när motsvarande skydd kommenteras bort, grönt annars; körs i CI (SN-06).
- **Status:** Öppen – belagd 2026-11-03

### ST-16 `priority` på tre evenemangskort som alltid ligger under vikningen
- **Källa:** A/S17
- **Fil och rad:** `src/components/home/home-sections.tsx:93`; `src/components/content/smart-image.tsx:27-29`; `src/components/home/hero.tsx:94`
- **Kodrad:** `<EventCard event={e} priority={i < 3} className="h-full" />` — `src/components/home/home-sections.tsx:93`; `loading={priority ? "eager" : "lazy"}` — `src/components/content/smart-image.tsx:27`; `fetchPriority={priority ? "high" : undefined}` — `src/components/content/smart-image.tsx:29`; `<section className="noise relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-ink text-white">` — `src/components/home/hero.tsx:94`
- **Felscenario:** Hjälten fyller hela första skärmen (`min-h-[100svh]`, hero.tsx:94), så de tre första evenemangskorten (home-sections.tsx:93) ligger alltid under vikningen – ändå får deras omslag `loading="eager"` och `fetchPriority="high"` (smart-image.tsx:27-29). Webbläsaren laddar tre omslag med hög prioritet i konkurrens med hjältens typsnitt och skript; LCP är hjälten, inte korten.
- **Åtgärd:** Ta bort `priority={i < 3}` (låt korten vara `lazy`), eller sätt `priority` bara när hjälten är avstängd.
- **Verifiering:** Nätverksfliken på startsidan: kortens bilder laddas först vid scroll; Lighthouse "Largest Contentful Paint" oförändrad eller bättre.
- **Status:** Öppen – belagd 2026-11-03

### ST-17 Inget `pruneOrphanMedia`: bilder laddas upp innan formuläret sparas och filer skrivs före raden
- **Källa:** A/M5 (städdelen), A/L34 (del), N3; se SD-09, SD-21, SD-30
- **Fil och rad:** `src/components/admin/image-field.tsx:44`; `src/components/admin/markdown-editor.tsx:69`; `src/app/api/admin/upload/route.ts:75`; `src/lib/media-store.ts:69`; `src/lib/media-store.ts:98`
- **Kodrad:** `const res = await uploadFile(file, { purpose: "image" }, setProgress);` — `src/components/admin/image-field.tsx:44`; `const res = await uploadFile(file, { purpose: "image" });` — `src/components/admin/markdown-editor.tsx:69`; `const media = await storeImage(file, user.id, String(fd.get("alt") ?? ""));` — `src/app/api/admin/upload/route.ts:75`; ``.toFile(path.join(UPLOADS_DIR, `${base}-${w}.webp`));`` — `src/lib/media-store.ts:69`; ``await fs.writeFile(path.join(UPLOADS_DIR, `${base}.${ext}`), buffer);`` — `src/lib/media-store.ts:98`
- **Saknar:** `pruneOrphanMedia` i `src/lib/media-store.ts`
- **Felscenario:** Bilder laddas upp i samma ögonblick som de väljs (image-field.tsx:44, markdown-editor.tsx:69 → upload/route.ts:75), innan formuläret sparas. Avbryter redaktören, laddar om sidan eller byter bild två gånger ligger tre WebP-varianter kvar på volymen med en `media`-rad som inget pekar på; `storeImage` (:69) och `storeFile` (:98) skriver filerna innan raden finns (SD-21), så ett fel däremellan ger filer utan rad. Inget rensar – `pruneOrphanMedia` finns inte – och volymen (10 GB, SN-07) växer tyst. Huvudkopiorna i D#4 (SD-30) ligger utanför `media` och måste undantas från gallringen.
- **Åtgärd:** `pruneOrphanMedia({ olderThanDays: 7 })` i `media-store.ts`: rader utan referens (samma räkning som `deleteMediaIfUnused`, breddad enligt SD-09) och filer i `uploads/` utan rad; knapp i Admin → Bilder och en veckokörning när CI/cron finns (SN-06).
- **Verifiering:** Ladda upp en bild i redigeringen och avbryt; efter gallring finns varken rad eller filer; en bild som bara används i Markdown (SD-09) överlever.
- **Status:** Öppen – belagd 2026-11-03

### ST-18 `create-admin.mjs` gör UPDATE + `DELETE FROM sessions` utan transaktion; inget skript kontrollerar `user_version`
- **Källa:** A/L11 (inkl. A/rad-583)
- **Fil och rad:** `scripts/create-admin.mjs:39-42`; `scripts/create-accounts.mjs:74`; `node_modules/better-sqlite3/lib/database.js:33`
- **Kodrad:** `"UPDATE users SET password_hash = ?, role = 'admin', active = 1, must_change_password = 1, failed_logins = 0, locked_until = NULL WHERE id = ?",` — `scripts/create-admin.mjs:40`; `db.prepare("DELETE FROM sessions WHERE user_id = ?").run(existing.id);` — `scripts/create-admin.mjs:42`; `db.transaction(() => {` — `scripts/create-accounts.mjs:74`; `const timeout = 'timeout' in options ? options.timeout : 5000;` — `node_modules/better-sqlite3/lib/database.js:33`
- **Saknar:** `transaction` i `scripts/create-admin.mjs`; `user_version` i `scripts/create-admin.mjs`; `user_version` i `scripts/create-accounts.mjs`
- **Felscenario:** `create-admin.mjs` skriver lösenordet (:40-41) och tar bort sessionerna (:42) som två satser; `create-accounts.mjs` gör motsvarande i `db.transaction` (:74). Körs skriptet medan servern håller databasen låst (busy-timeout 5 000 ms, database.js:33) kan andra satsen få `SQLITE_BUSY` efter att första gått igenom: nytt lösenord, gamla sessioner lever. Inget av skripten läser `PRAGMA user_version` (A/rad-583), så ett skript från en äldre checkout kan köras mot ett nyare schema utan att märka det (SN-02).
- **Åtgärd:** Slå in i `db.transaction()`; läs `user_version` och vägra om det inte är skriptets väntade (exportera talet från `migrations.ts` eller duplicera medvetet med kommentar); samma kontroll i `create-accounts.mjs`.
- **Verifiering:** Håll databasen låst (`BEGIN IMMEDIATE` i en annan process) och kör skriptet: allt eller inget; kör mot en databas med fel `user_version`: skriptet stoppar med tydligt meddelande.
- **Status:** Öppen – belagd 2026-11-03

### ST-19 `.env.example` saknar fyra variabler och har Railway-rubrik; `.claude/` ignoreras bara lokalt
- **Källa:** A/L20 (övriga delen), NY-17; se SN-09
- **Fil och rad:** `.env.example:6`; `.env.example:19-20`; `fly.toml:18`; `src/lib/data/exam-stats.ts:13`; `scripts/docker-entrypoint.mjs:10-11`; `scripts/seed.ts:66`; `.git/info/exclude:9`
- **Kodrad:** `ADMIN_EMAIL=webb@statlin.se` — `.env.example:6`; `# CLIENT_IP_HEADER=x-real-ip` — `.env.example:21`; `CLIENT_IP_HEADER = "fly-client-ip"` — `fly.toml:18`; `const SOURCE = (process.env.EXAM_STATS_URL ?? "https://liutentor.lukasabbe.com").replace(/\/$/, "");` — `src/lib/data/exam-stats.ts:13`; `const uid = Number(process.env.APP_UID ?? 1001);` — `scripts/docker-entrypoint.mjs:10`; `const password = process.env.DEMO_PASSWORD ?? generatePassword();` — `scripts/seed.ts:66`; `.claude/` — `.git/info/exclude:9`
- **Saknar:** `EXAM_STATS_URL` i `.env.example`; `DEMO_PASSWORD` i `.env.example`; `APP_UID` i `.env.example`; `.claude` i `.gitignore`
- **Felscenario:** Koden läser `EXAM_STATS_URL` (exam-stats.ts:13), `DEMO_PASSWORD` (seed.ts:66) och `APP_UID`/`APP_GID` (docker-entrypoint.mjs:10-11) men `.env.example` nämner ingen av dem – nästa förvaltare hittar dem bara genom att läsa koden. Exemplet föreslår `webb@` som adminadress medan seed använder `admin@` (SD-15) och har Railway-rubriken `x-real-ip` (:19-20) fast driften är Fly (`fly-client-ip`, fly.toml:18; SN-09). `.claude/` hålls utanför `git status` bara av den lokala `.git/info/exclude:9` – på nästa dator dyker `.claude/launch.json` och worktrees upp som otrackade filer.
- **Åtgärd:** Komplettera `.env.example` med de fyra (utkommenterade, med standardvärden) och Fly-rubrik; lägg `.claude/` i `.gitignore` bredvid `/data`.
- **Verifiering:** `grep -c "EXAM_STATS_URL\|DEMO_PASSWORD\|APP_UID\|APP_GID" .env.example` → 4; `git status` i en ny klon med `.claude/` visar inget.
- **Status:** Öppen – belagd 2026-11-03

### ST-20 `SITE_URL` bakas in vid bygget; domänbytet kräver ombyggnad och en värdomdirigering som inte finns
- **Källa:** A/L22 (inkl. A/rad-666, A/rad-973), D#3 (omdirigering); se SB-04, ST-22, U-02
- **Fil och rad:** `src/app/layout.tsx:6-7`; `src/app/robots.ts:4`; `src/lib/site-url.ts:5-7`; `fly.toml:13`; `fly.toml:16`; `next.config.ts:44-50`; `README.md:168`; `tests/smoke.mjs:94-96`; `tests/smoke.mjs:123`
- **Kodrad:** `// Läses vid bygget för förrenderade sidor – se Dockerfile (ARG SITE_URL).` — `src/app/layout.tsx:6`; `const SITE_URL = process.env.SITE_URL || "http://localhost:3000";` — `src/app/layout.tsx:7`; `const base = process.env.SITE_URL?.replace(/\/$/, "");` — `src/app/robots.ts:4`; `if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");` — `src/lib/site-url.ts:6`; `SITE_URL = "https://statlin-web.fly.dev"` — `fly.toml:13`; `{ source: "/utbildning", destination: "/studenter/kandidat", permanent: true },` — `next.config.ts:46`; `**Egen domän:** kör` — `README.md:164`; `expect(IS_LOCAL || !og.includes("localhost"),` — `tests/smoke.mjs:96`; `expect(IS_LOCAL || !body.includes("localhost"), "adresserna pekar på localhost – sätt SITE_URL");` — `tests/smoke.mjs:123`
- **Felscenario:** `SITE_URL` läses vid bygget för förrenderade sidor (layout.tsx:6-7, `ARG SITE_URL` i Dockerfile) och är `https://statlin-web.fly.dev` i både build-arg och env (fly.toml:13, :16): `og:image`, `canonical`, sitemap och robots pekar på fly.dev tills imagen byggs om – `fly secrets set` räcker inte, vilket README:168 också säger. Smoke kontrollerar bara att adresserna inte är `localhost` (:96, :123), inte att de är `SITE_URL` (A/rad-973). `redirects()` (next.config.ts:46-48) har tre sökvägar och ingen värdregel: efter domänbytet svarar `statlin-web.fly.dev` vidare med samma innehåll (dubblettinnehåll för Google) tills en `has: host`-omdirigering läggs till (D#3).
- **Åtgärd:** I domänbytets PR (U-02): `SITE_URL=https://statlin.se` i `[build.args]` och `[env]`, bygg om; lägg `{ source: "/:path*", has: [{ type: "host", value: "statlin-web.fly.dev" }], destination: "https://statlin.se/:path*", permanent: true }` i `redirects()`; låt smoke jämföra `og:image`, sitemap och robots mot `SITE_URL` (A/rad-973). ICS-UID:n byter värd samtidigt (SB-04/B-5).
- **Verifiering:** `curl -sI https://statlin-web.fly.dev/` → 308 till `https://statlin.se/`; `curl -s https://statlin.se/sitemap.xml | grep -c fly.dev` → 0; smoke grönt mot den nya domänen.
- **Status:** Öppen – belagd 2026-11-03

### ST-21 `kill_timeout` saknas – `after()`-jobben kan avbrytas när Fly stoppar maskinen (informativt)
- **Källa:** A/L23
- **Fil och rad:** `fly.toml:33`; `fly.toml:35`; `src/lib/data/exam-stats.ts:123`; `src/lib/data/exam-stats.ts:170`; `node_modules/next/dist/server/lib/start-server.js:317-333`; `node_modules/next/dist/server/lib/start-server.js:377-380`
- **Kodrad:** `auto_stop_machines = "stop"` — `fly.toml:33`; `min_machines_running = 0` — `fly.toml:35`; `if (isStale(fetchedAt)) after(refreshCodes);` — `src/lib/data/exam-stats.ts:123`; `if (isStale(row.fetched_at)) after(() => refreshCourse(code));` — `src/lib/data/exam-stats.ts:170`
- **Saknar:** `kill_timeout` i `fly.toml`
- **Belägg:** `node_modules/next/dist/server/lib/start-server.js:317` — `// first, stop accepting new connections and finish pending requests,`; `node_modules/next/dist/server/lib/start-server.js:318` — ``// because they might affect `nextServer.close()` (e.g. by scheduling an `after`)``; `node_modules/next/dist/server/lib/start-server.js:331` — `nextServer == null ? void 0 : nextServer.close().catch(console.error),`; `node_modules/next/dist/server/lib/start-server.js:379` — `process.on('SIGTERM', cleanup);`
- **Felscenario:** Maskinen stoppas när trafiken upphör (`auto_stop_machines = "stop"`, `min_machines_running = 0`). Tentastatistiken uppdateras i `after()` efter att svaret skickats (exam-stats.ts:123, :170); Nexts server fångar SIGTERM (start-server.js:379), slutar ta emot anslutningar och väntar in `after`-jobben i `nextServer.close()` (:317-331) – men bara så länge Fly väntar. Utan `kill_timeout` gäller Flys standard (5 s enligt Flys dokumentation; inte belagt i repot): en långsam hämtning från källan avbryts och raden förblir gammal till nästa besök. Inget går sönder – därav "informativt" – men förklaringen till att statistiken ibland inte uppdateras finns inte i repot.
- **Åtgärd:** `kill_timeout = "30s"` i `fly.toml` med en kommentar som pekar på `after()`-jobben.
- **Verifiering:** `fly machine stop` under en pågående uppdatering (logga start/slut i `refreshCourse`): loggen visar att jobbet hann klart.
- **Status:** Öppen – belagd 2026-11-03

### ST-22 Sitemapen cachas inte (`max-age=0`) och per-evenemangs-ICS saknar `Cache-Control` helt
- **Källa:** A/L25, NY-13; se SB-04, ST-20
- **Fil och rad:** `src/app/sitemap.ts:7-9`; `src/app/(site)/evenemang/[slug]/kalender.ics/route.ts:10-14`; `src/app/kalender.ics/route.ts:13`; `src/app/api/tentastatistik/koder/route.ts:7-8`
- **Kodrad:** `export default async function sitemap(): Promise<MetadataRoute.Sitemap> {` — `src/app/sitemap.ts:7`; `const base = await siteUrl();` — `src/app/sitemap.ts:8`; `"Content-Type": "text/calendar; charset=utf-8",` — `src/app/(site)/evenemang/[slug]/kalender.ics/route.ts:11`; `"Cache-Control": "public, max-age=900",` — `src/app/kalender.ics/route.ts:13`; `const cacheControl = codes.length ? "public, max-age=3600, stale-while-revalidate=86400" : "no-store";` — `src/app/api/tentastatistik/koder/route.ts:7`
- **Saknar:** `Cache-Control` i `src/app/sitemap.ts`; `Cache-Control` i `src/app/(site)/evenemang/[slug]/kalender.ics/route.ts`
- **Felscenario:** Live 2026-11-03: `/sitemap.xml` svarar `cache-control: public, max-age=0, must-revalidate` (Nexts standard för en dynamisk metadatarutt – ingen egen rubrik i `sitemap.ts`), `/evenemang/hostsittning/kalender.ics` svarar helt utan `cache-control`, medan `/kalender.ics` har `public, max-age=900`. Sitemapen läser tre tabeller per anrop (:9) och genereras om för varje sökmotorbesök; kalenderprogram som prenumererar på ett enskilt evenemang hämtar om vid varje uppdatering. Flödet (:13) och kodlistan (:7-8) har redan rubriker – A/rad-1091:s "bara sitemapen" stämde inte (R-06). Lasten är liten i dag; poängen är att det är de två rutterna som växer med fler evenemang.
- **Åtgärd:** `"Cache-Control": "public, max-age=900"` i `[slug]/kalender.ics/route.ts` som i flödet; en `headers()`-regel för `/sitemap.xml` i `next.config.ts` (`public, max-age=3600`).
- **Verifiering:** `curl -sI https://statlin-web.fly.dev/sitemap.xml` och `/evenemang/<slug>/kalender.ics` visar `cache-control: public, max-age=…`.
- **Status:** Öppen – belagd 2026-11-03 (live)

### ST-23 Formelringens serif-typsnitt sätts i `globals.css` och på β̂-raden – inte på rad 238 som D anger
- **Källa:** D#7 (formelringen, D/rad-48); se ST-24, ST-08
- **Fil och rad:** `src/app/globals.css:29`; `src/app/globals.css:615-616`; `src/components/brand/formula-ring.tsx:244-245`
- **Kodrad:** `--font-serif: Georgia, "Times New Roman", serif;` — `src/app/globals.css:29`; `.logo-formler text {` — `src/app/globals.css:615`; `font-family: var(--font-serif);` — `src/app/globals.css:616`; `<tspan fontFamily="'Times New Roman', serif">β̂</tspan> = (XᵀX)⁻¹Xᵀy` — `src/components/brand/formula-ring.tsx:245`
- **Felscenario:** D (rad 48) vill byta ringens typsnitt och pekar på `formula-ring.tsx:238`; den raden är `<text fill={…}>` – typsnittet kommer från `.logo-formler text { font-family: var(--font-serif) }` (globals.css:615-616) med `--font-serif: Georgia, "Times New Roman", serif` (:29), och β̂-raden tvingar `'Times New Roman'` separat (formula-ring.tsx:245; kommentaren på :244 förklarar hatten). Ett byte "på rad 238" ändrar inget; ett byte av `--font-serif` ändrar all serif-text på sajten, och β̂ följer inte med. Loggan som vektor i samma klientkomponent (`formula-ring.tsx:4`) är ST-08/B-19.
- **Åtgärd:** Om typsnittet ska bytas (D#7, grafiskt ansvarig): ett eget `--font-formulas` som bara `.logo-formler` använder, och β̂-undantaget löst med samma typsnitt eller en kombinerande hatt (U+0302) kontrollerad i Safari/Firefox.
- **Verifiering:** Ringen och β̂ renderas i samma typsnitt i Chrome, Firefox och Safari; `grep -n "Times New Roman" src` ger en träff (variabeln).
- **Status:** Öppen – belagd 2026-11-03 (D:s radnummer rättat)

### ST-24 Loggorna: WebP 286–640 px visas i upp till 352 CSS-px, nedladdningarna är PNG, SVG tillåts inte som dokument
- **Källa:** D#7 (loggor); se ST-23, U-03
- **Fil och rad:** `src/app/(site)/foretag/page.tsx:70`; `src/app/(site)/grafisk-profil/page.tsx:25`; `src/lib/file-types.ts:2-13`
- **Kodrad:** `<img src="/brand/utskott/star.webp" alt="STAR-loggan" className="w-[min(70vw,22rem)] animate-float drop-shadow-[0_40px_60px_rgba(0,0,0,0.5)]" />` — `src/app/(site)/foretag/page.tsx:70`; `{ file: "ubu", name: "UBU", note: "Utbildningsutskottet" },` — `src/app/(site)/grafisk-profil/page.tsx:25`; `export const FILE_TYPES: Record<string, string> = {` — `src/lib/file-types.ts:2`; `zip: "application/zip",` — `src/lib/file-types.ts:12`
- **Saknar:** `svg` i `src/lib/file-types.ts`
- **Felscenario:** Mätt 2026-11-03 (sharp): `public/brand/utskott/` har elva WebP mellan 286×282 (scb-rund) och 640×640 (statpub, ubu); `star.webp` är 360×360 men visas i upp till 352 CSS-px (`w-[min(70vw,22rem)]`, foretag:70) – på en 2×-skärm begärs 704 px och bilden skalas upp. `public/brand/download/` har tolv PNG (statlin 1042×1042, statpub 1625×1626, scb-rund 286×282) och `grafiskt-styrdokument.pdf` (1,3 MB) med 37 `/Subtype /Image`-objekt och inga Form-XObjects (grep) – stödjer D:s "loggorna som pixel" men bevisar det inte (R-48). Sektionsloggan finns som SVG (`public/brand/statlin*.svg`, fem filer), utskottens inte. `FILE_TYPES` (file-types.ts:2-13) saknar `svg`, så vektorloggor kan inte laddas upp som dokument – och SVG kan bära skript, så det kräver sanering eller `attachment` (jfr CSP-sandboxen i `/media`, SB-24).
- **Åtgärd:** Be grafiskt ansvarig om originalen (U-03); lägg SVG/PNG ≥ 1024 px i `download/` och generera WebP i 2× (≥ 704 px för STAR) från dem; `svg` i `FILE_TYPES` bara tillsammans med `Content-Disposition: attachment` eller `svgo` med skript borttagna.
- **Verifiering:** `node -e` med sharp: varje WebP i `utskott/` är ≥ 2× sin största CSS-bredd; Lighthouse "Properly size images" utan anmärkning på `/foretag`; en uppladdad SVG med `<script>` visas utan att köra.
- **Status:** Öppen – belagd 2026-11-03 (PDF-delen heuristik)

### ST-25 Formelringssteget i e2e blandar fejkad klocka och realtid
- **Källa:** A/L21 (e2e-delen 2); se SN-10, SB-25
- **Fil och rad:** `tests/e2e.mjs:133`; `tests/e2e.mjs:137`; `tests/e2e.mjs:139`; `tests/e2e.mjs:143`
- **Kodrad:** `await clocked.clock.install();` — `tests/e2e.mjs:137`; `await clocked.waitForFunction(ringIsVisible, null, { timeout: 10000 });` — `tests/e2e.mjs:141`; `await clocked.waitForFunction(ringIsHidden, null, { timeout: 15000 });` — `tests/e2e.mjs:143`; `await clocked.waitForTimeout(1000);` — `tests/e2e.mjs:147`
- **Felscenario:** Steget installerar Playwrights fejkade klocka (:133) för att styra ringens animation, men väntar sedan i riktig tid: `waitForFunction` med 10 och 15 s timeout (:137, :139) och `waitForTimeout(1000)` (:143) går på väggklockan medan sidans timers lyder den fejkade. Resultatet är ett steg som är känsligt för CPU-last (minnesanteckning: faller under belastning, grönt när det körs ensamt) och som inte provar det det påstår – att ringen syns efter N fejkade sekunder.
- **Åtgärd:** Antingen helt fejkad tid (`clock.runFor(…)` i stället för `waitForTimeout`, `waitForFunction` med `polling: "raf"` efter `runFor`) eller helt riktig tid utan `clock.install` med `prefers-reduced-motion` emulerad för att korta animationen. Övriga e2e-fynd: SB-25; falskt grönt: SN-10.
- **Verifiering:** Steget grönt tio gånger i rad med `npm run build` igång i bakgrunden (CPU-last), inte bara ensamt.
- **Status:** Öppen – belagd 2026-11-03

### ST-26 Grenar och worktrees: en patch-ekvivalent gren som inte räknas som inmergad, en försvunnen upstream, fyra worktrees
- **Källa:** A/steg-26, NY-18
- **Fil och rad:** `.git/info/exclude:9-10`
- **Kodrad:** `.claude/` — `.git/info/exclude:9`; `.claude/worktrees/` — `.git/info/exclude:10`
- **Felscenario:** Läst 2026-11-03 (`git branch --merged`/`--no-merged Main-Real`, `git cherry`, `git worktree list`, `git branch -r`): tio lokala grenar är inmergade i Main-Real (`claude/epic-jang-e2ea12`, `claude/happy-newton-e0b639`, `claude/objective-snyder-839af4`, `claude/readme-windows-install`, `claude/trusting-darwin-wifqfg`, `dockerignore-claude`, `lint-ignorera-claude`, `officiell-logga`, `redigering-och-uppdrag`, `sokbar-statistik-och-hjalpmedel`); den enda ej inmergade, `claude/sad-jackson-24aa60` (0393a96), är patch-ekvivalent (`git cherry` → `-`) och kräver därför `git branch -D`; `claude/trusting-darwin-wifqfg` spårar en borttagen fjärrgren (`[gone]`). Fyra worktrees under `.claude/worktrees/` (epic-jang 14bb665, happy-newton 0cd2143, objective-snyder 5c2581f, sad-jackson 0393a96) håller sina grenar låsta. Fjärren: alla fyra `origin/claude/*` och `origin/main-test` är inmergade, inget ej inmergat. Katalogen syns inte i `git status` bara tack vare `.git/info/exclude:9-10` (ST-19).
- **Åtgärd:** `git worktree remove` ×4, `git branch -d` för de tio inmergade, `git branch -D claude/sad-jackson-24aa60` när `git cherry Main-Real claude/sad-jackson-24aa60` bara visar `-`, `git fetch --prune`; ta bort `origin/main-test` och `origin/claude/*` på GitHub om de inte behövs (inställningar går via användaren).
- **Verifiering:** `git branch -a` visar Main-Real och origin/Main-Real; `git worktree list` en rad.
- **Status:** Öppen – belagd 2026-11-03

### ST-27 Utskottsnamn, programfakta och adresser hårdkodade i copy; sluggen `ubu` i tre sidor
- **Källa:** A/S9, B/småfel-4 (koddelen), NY-5 (flyttad från synliga buggar)
- **Fil och rad:** `src/lib/navigation.ts:13`; `src/app/(site)/utskott/page.tsx:12`; `src/app/(site)/en/masters/page.tsx:29`; `src/app/(site)/en/masters/page.tsx:63`; `src/app/(site)/en/masters/page.tsx:67`; `src/components/content/ubu-card.tsx:23`; `src/components/content/ubu-card.tsx:27`; `src/app/(site)/grafisk-profil/page.tsx:25`; `src/components/home/home-sections.tsx:27`; `src/components/home/home-sections.tsx:30`; `src/app/(site)/sektionen/page.tsx:64-72`; `src/app/(site)/foretag/page.tsx:32`; `src/app/(site)/studenter/master/page.tsx:35`; `src/app/(site)/studenter/kandidat/page.tsx:30`; `src/app/(site)/studenter/kandidat/page.tsx:42`
- **Kodrad:** `{ href: "/utskott", label: "Utskott", description: "SCB, UBU, SASU, StatPub, STIG, eSTIG" },` — `src/lib/navigation.ts:13`; `description: "SCB, UBU, SASU, StatPub, STIG, eSTIG och fler – hitta ditt sammanhang på StatLin.",` — `src/app/(site)/utskott/page.tsx:12`; `const [ubu, events] = await Promise.all([getCommitteeBySlug("ubu"), listUpcomingEvents(4)]);` — `src/app/(site)/en/masters/page.tsx:29`; `<Mail size={15} /> Email UBU` — `src/app/(site)/en/masters/page.tsx:63`; `<Mail size={15} /> Mejla UBU` — `src/components/content/ubu-card.tsx:23`; `{ file: "ubu", name: "UBU", note: "Utbildningsutskottet" },` — `src/app/(site)/grafisk-profil/page.tsx:25`; `{ value: utskott.length, label: "Utskott & grupper", note: "från SCB till eSTIG" },` — `src/components/home/home-sections.tsx:27`; `{ value: 2, label: "Program", note: "kandidat och master" },` — `src/components/home/home-sections.tsx:30`; `Statistics and Machine Learning, 120 hp` — `src/app/(site)/sektionen/page.tsx:71`; `const contact = sasu?.email || "sasu@statlin.se";` — `src/app/(site)/foretag/page.tsx:32`; `const [ubu, shortcuts] = await Promise.all([getCommitteeBySlug("ubu"), listFeaturedLinks()]);` — `src/app/(site)/studenter/kandidat/page.tsx:30`; `{ubu && <UbuCard ubu={ubu} />}` — `src/app/(site)/studenter/kandidat/page.tsx:42`
- **Felscenario:** Utskottslistan "SCB, UBU, SASU, StatPub, STIG, eSTIG" står i menyn (navigation.ts:13) och i sidbeskrivningen (utskott/page.tsx:12), "från SCB till eSTIG" och "2 program" i startsidans siffror (home-sections.tsx:27, :30), programnamn och poäng i sektionssidan (sektionen/page.tsx:64-72), `sasu@statlin.se` som reservadress (foretag:32) och "UBU" i knapptexter (ubu-card.tsx:23, :27; en/masters:63, :67) – medan utskottet i databasen heter "UB" (live `/utskott` 2026-11-03, B/småfel-4). Tre sidor hämtar kortet med `getCommitteeBySlug("ubu")` (en/masters:29, master:35, kandidat:30) och renderar inget om sluggen byts (kandidat:42 `{ubu && …}`) – kortet försvinner tyst. Databasdelen av UBU→UB (bio, fikaevenemanget, programsidorna) rättas i Admin (R-39).
- **Åtgärd:** Läs listan ur `committees` (`listCommittees({ visibleOnly: true })`) i meny, beskrivning och siffror; flytta programfakta och reservadresser till `settings` eller `seed-content.ts` som en källa; peka ut UBU-kortet via en inställning (`settings.education_committee_id`) eller en flagga på utskottet i stället för sluggen, och logga när den saknas.
- **Verifiering:** Döp om utskottet i Admin: menyn, `/utskott`, startsidan och kortet följer med utan deploy; `grep -rn '"ubu"' src` ger ingen träff utanför seed.
- **Status:** Öppen – belagd 2026-11-03

## 7 Beslut krävs

Tjugoen beslut och två faktamotsägelser som avgjorts genom mätning. Varje beslut citerar planerna med rad; **Väntar** listar punkterna som har status "väntar på beslut". Inget av besluten är taget här – det är uppdragets regel. Kriteriet för "ingen motsägelse" står i listan sist i avsnittet.

### B-1 Deploy-väg: lokalt skript eller knapp i GitHub
- **Källa:** A/M27 (A:413–423, A:1140–1141), D#5 (D:40)
- **A säger:** "`npm run deploy` (`scripts/deploy.mjs`) som vägrar köra med smutsig arbetskatalog, tar `fly volumes snapshots create <vol>` och väntar tills den är klar, kör säkerhetskopian (H1) … och `node tests/smoke.mjs` mot produktionen" (A:419–423); "'före varje deploy' kan inte tvingas från ett flöde när deploy körs för hand från en dator" (A:84–85, A:1140–1141).
- **D säger:** "Lägg till en driftsättningsknapp i GitHub som tar en ögonblicksbild först, så att fler än du kan driftsätta." (D:40).
- **Anmärkning:** Vägarna utesluter inte varandra ("en eller båda"). GitHub-vägen kräver Fly-token och server-actions-nyckeln (SD-03) som secrets i ett publikt repo (secrets är inte repoinnehåll) och gör att nyckeln blir en GitHub-secret i stället för en lokal fil.
- **Väntar:** SN-03; SD-03 är kopplad (nyckelns plats följer beslutet).

### B-2 Backup: kadens, utlösare och lagring
- **Källa:** A/H1 (A:76–86, A:96–97, A:1138–1139), D#1 (D:14–15)
- **A säger:** "Kopian tas i `scripts/deploy.mjs` (M27) före varje deploy, plus veckovis via en enkel påminnelse/rutin." (A:86); hämtning "med `fly ssh sftp get` … till privat, krypterad lagring utanför Fly och utanför GitHub" (A:80–81); "Repetera migreringar i CI mot senaste kopian" (A:96–97).
- **D säger:** "Kopiera databasen och uppladdningarna varje natt till en annan leverantör, till exempel Backblaze B2 eller Cloudflare R2." (D:14); "Maskinen sover när ingen besöker sajten, så nattjobbet måste väcka den utifrån." (D:15).
- **Anmärkning:** Före-deploy + veckovis för hand (A) mot nattligt jobb utifrån (D) är olika utlösare och olika lagringsplatser; A:s CI-repetition av migreringar kräver att CI når lagringen utanför GitHub. Omfånget (vad som får ligga i kopian) är B-16.
- **Väntar:** SN-01

### B-3 Kopia före migrering – i deploy-skriptet eller i `migrations.ts`
- **Källa:** A/H1 (A:86, A:92–93), D#1 (D:16, D:78)
- **A säger:** kopian tas i `scripts/deploy.mjs` (A:86); "Ingen `instrumentation.ts` för detta: hälsokontrollen fångar redan en trasig migrering, och `register()` kan köras även i bygg-/förrenderingsarbetare och då öppna databasen vid bygget." (A:92–93).
- **D säger:** "Ta en kopia av databasen före varje migrering. Migreringar körs automatiskt vid start" (D:16); "Kopia före migrering (punkt 1): `src/lib/db/migrations.ts`." (D:78).
- **Anmärkning:** "En eller båda". `migrate(db)` körs vid första `getDb()` (`src/lib/db/index.ts:26`), ofta från hälsokontrollen – inte "vid start" (R-09); en kopia inuti `migrate()` måste därför klara att tas mitt i en request.
- **Väntar:** SN-01

### B-4 Dependabot-kadens
- **Källa:** A/M16 (A:286), D#5 (D:41)
- **A säger:** "`.github/dependabot.yml` (npm, veckovis, grupperade minor/patch, separata PR för major) + CI (M11)." (A:286).
- **D säger:** "Slå på Dependabot med samlade uppdateringar en gång i månaden." (D:41).
- **Väntar:** BE-02

### B-5 ICS-UID-domän – nu eller vid domänbytet
- **Källa:** A/M21 (A:351), D#3 (D:29, D:81)
- **A säger:** "fast UID-domän (`@statlin.se`) – helst i samma veva som domänbytet." (A:351).
- **D säger:** "Lås UID till `@statlin.se` redan nu." (D:29); "punkt 3 och 4 blir dyrare för varje dag" (D:81).
- **Anmärkning:** Båda vill ha `@statlin.se`; frågan är bara tidpunkten. Varje byte av UID ger prenumeranter dubbletter en gång, så det bör ske exakt en gång.
- **Väntar:** SB-04; U-02 hänger på samma val.

### B-6 Filer i server actions eller via uppladdningsrutten
- **Källa:** A/M23 (A:372–377, A:901–902), C/fas-1 (C:48, C:52)
- **A säger:** "återställ `bodySizeLimit` till standard (eller 2 MB) och ta bort `proxyClientMaxBodySize`; skicka dokument- och hjälpmedelsfiler via `/api/admin/upload`" (A:372–374); samma i åtgärdsplanen (A:901–902).
- **C säger:** "Filen skickas med server action, som saveDocument gör (gränsen är redan 32 MB)." (C:48); filrutten "ligger under `/admin`, så proxy.ts täcker den också" (C:52) – det vill säga bygger vidare på `proxyClientMaxBodySize`.
- **Anmärkning:** C:s kvittoflöde (F-02) förutsätter den gräns A vill ta bort; väljs A:s väg måste F-02 skriva om inlämningen till uppladdningsrutten.
- **Väntar:** SD-01; F-02 följer.

### B-7 Migreringssteg 10 – tre planer vill ha det
- **Källa:** A/S1 (A:822), B/fragelada (B:77), C/fas-1 (C:28–29)
- **A säger:** "Migrering 10: `committees.logo_media_id`, backfill från `path_base`" (A:822).
- **B säger:** "`src/lib/db/migrations.ts`: steg 10 med `inbox_threads`, `inbox_messages` och flaggan på `users`" (B:77).
- **C säger:** "Databas (steg 10 i migrations.ts): `users.treasurer`" (C:28–29) och `receipts`.
- **Anmärkning:** Stegen körs i arrayordning och `migrations.ts` har nio i dag (SN-02); den första som mergas tar nummer 10 och de andra måste numreras om – ordningen är ett beslut, inte en teknisk fråga. ST-13:s index är ett fjärde steg.
- **Väntar:** ST-01; ST-13, F-01, F-02 och F-04 följer.

### B-8 CI-webbläsare: bara Chromium eller även WebKit och Firefox
- **Källa:** A/M11 (A:231–232, A:968, A:1006), D#5 (D:38–39, D:86), B/rad-103, C/rad-105
- **A säger:** "`.github/workflows/ci.yml` (lint, typecheck, build, smoke, e2e **ensamt**)" (A:231–232; A:968); e2e kör Chromium (`tests/e2e.mjs:16`).
- **D säger:** "Safari och Firefox har inte testats i de senaste driftsättningarna, trots att många studenter har iPhone." (D:38); "Kör lint, typkontroll, bygge och tester på varje pull request, även i WebKit och Firefox." (D:39).
- **Anmärkning:** "Ensamt" betyder bara separat körning på grund av CPU-last – A:1006, D:86, B:103 och C:105 menar samma sak (ingen motsägelse). Beslutet gäller webbläsarmatrisen och dess kostnad i CI-minuter.
- **Väntar:** SN-06

### B-9 Node-golv: `>=22.13` med `engine-strict` eller "24 överallt" (svag)
- **Källa:** A/M10 (A:965–966), D#6 (D:44)
- **A säger:** "Node 24 i Dockerfile (`ARG NODE_IMAGE`), `.nvmrc` = 24, devcontainer, `@types/node ^24`; `engines.node >=22.13` + `.npmrc engine-strict`" (A:965–966).
- **D säger:** "Gå över till Node 24 (support till april 2028) överallt och lägg till `.nvmrc`." (D:44) – nämner inte `engines`.
- **Anmärkning:** Körningsgolvet är 22.12 (`sanitize-html`), 22.13 kommer från dev-beroenden (NO-01). Svag motsägelse: A:s golv tillåter 22 i drift, D:s inte.
- **Väntar:** NO-01

### B-10 Saknade sidor svarar 200 med `noindex` – acceptera eller slug-kontroll i proxyn (A:s eget öppna val)
- **Källa:** A/L24 (A:677–680)
- **A säger:** "*Beslut:* acceptera (skalet är poängen) men dokumentera det och låt `smoke.mjs` kontrollera texten 'hittades inte' i stället för statuskoden – eller gör slug-kontrollen i `proxy.ts` för de tre innehållstyperna om riktiga 404:or behövs." (A:677–680).
- **Annan plan:** ingen; A lämnar valet öppet.
- **Anmärkning:** Slug-kontroll i proxyn betyder en databasläsning per sidvisning före skalet (och att proxyn måste nå SQLite); acceptera betyder soft-404 i Search Console.
- **Väntar:** SB-16

### B-11 Anonymitetslöftet: bygga Frågelådan eller ändra texterna
- **Källa:** B/tre-1 (B:9)
- **B säger:** "Sajten lovar anonymitet men kan inte ge den. … Den enda vägen är vanlig e-post, där avsändaren syns. Frågelådan lagar alltså ett löfte som redan finns ute." (B:9).
- **Alternativ:** ändra texterna i kod och databas (SB-26) så att löftet försvinner tills en anonym väg finns.
- **Anmärkning:** Texterna kan ändras på en timme; Frågelådan (F-01) är ett bygge med beslut B-7, B-17 och B-18 framför sig. Löftet står ute tills något av dem är gjort.
- **Väntar:** SB-26

### B-12 A internt: M4:s vakt – byteräkning eller rubrikkontroll
- **Källa:** A/M4 (A:137–143, A:916, A:1017, A:1167)
- **A:s fynd säger:** "räkna byte under läsningen – låt `request.body` gå genom en `TransformStream` som avbryter med 413 när 32 MB passerats … En ren rubrikkontroll … vilar på att Flys proxy alltid skickar `Content-Length` vidare, vilket inte är provat." (A:137–142); dubbelkollen: "byteräkning hellre än 411" (A:1167).
- **A:s åtgärdsplan säger:** "`upload/route.ts`: `content-length`-kontroll före `formData()` (M4)." (A:916); verifieringen testar bara 33 MB med rubrik (A:1017).
- **Anmärkning:** A:916 är den inaktuella raden (R-33); båda vakterna kan finnas, men byteräkningen är den som fångar chunked/HTTP/2-kroppar utan rubrik.
- **Väntar:** SD-02

### B-13 A internt: proxyns kopia – matchern, `/tentastatistik` eller bara nyckeln
- **Källa:** A/M23 (A:368–369, A:901–903)
- **A:s fynd säger:** "mot `/admin/*` håller proxyn dessutom en egen kopia upp till `proxyClientMaxBodySize` även när den bara omdirigerar till inloggningen." (A:368–369).
- **A:s åtgärdsplan säger:** "`bodySizeLimit` tillbaka till standard, `proxyClientMaxBodySize` bort … Test: anonym `POST /` med 5 MB multipart → 413 utan att minnet rör sig." (A:901–903) – tar bort nyckeln (→ standard 10 MB) men inte kopian, och testar `POST /`, som aldrig går genom proxyn.
- **Anmärkning:** SD-01 visar att `/tentastatistik` släpps igenom utan inloggning (`src/proxy.ts:14`) och ändå buffras. Valet: smalare matcher (`src/proxy.ts:41`), ta bort genomsläppet, och/eller lägre `proxyClientMaxBodySize` i stället för att stryka nyckeln (R-34).
- **Väntar:** SD-01

### B-14 A internt: revalidering – `revalidatePath("/admin", "layout")` eller `refresh()`
- **Källa:** A/L12 (A:588), A/S13 (A:872–876), A/L40
- **L12 säger:** "`revalidatePath("/admin", "layout")` (eller `refresh()`)." (A:588).
- **S13 säger:** "låt uppdateringen vara `refresh()` från `next/cache` … i stället för `revalidatePath`; ta bort `revalidatePath` i uppladdningsrutten" (A:873–875); L40 hänvisar till S13.
- **Anmärkning:** `refresh()` går bara i server actions och rör inte cachad data (ST-12:s Belägg: `refresh.md:13`, `revalidate.js:74–76`), så den räcker inte där cachade sidor ska ändras; taggar är Nexts rekommendation (`09-revalidating.md:187`). Beslutet avgör ST-12:s hjälpare och SB-34:s auth-actions.
- **Väntar:** SB-34, ST-12

### B-15 Felsidor – `admin/error.tsx` eller `global-error.tsx`
- **Källa:** A/M14 (A:263), D#10 (D:79)
- **A säger:** "lägg `src/app/error.tsx` + `src/app/admin/error.tsx` som skyddsnät" (A:263).
- **D säger:** "`src/app/error.tsx`, `src/app/global-error.tsx`, `src/instrumentation.ts`" (D:79).
- **Anmärkning:** Union är möjlig (alla tre), men omfånget ska bekräftas: `global-error.tsx` ersätter rotlayouten och måste bära egen `<html>`; `admin/error.tsx` ger admin en egen felvy med adminramen kvar.
- **Väntar:** SD-05

### B-16 Backupens omfång mot raderingslöften
- **Källa:** A/H1 (A:77), D#1 (D:13–14), C/rad-21, C/rad-11, C/rad-57, C/rad-17, C/rad-60, B/rad-68
- **A och D säger:** kopian är "`backups/<datum>.db` + `backups/<datum>-uploads.tgz`" (A:77) respektive "databasen och uppladdningarna" (D:14) – allt.
- **C och B lovar radering:** "Kvitton sparas i `DATA_DIR/kvitton`, utanför `UPLOADS_DIR`" (C:21); kontonumret "raderas när utlägget är utbetalt eller nekat" (C:11) / "Nekat och utbetalt tömmer `payee_account` i samma sats" (C:57); "Kvittofilen raderas från sajten 90 dagar efter att den skickats till Fortnox" (C:17, C:60); "Meddelanden raderas automatiskt 12 månader efter senaste aktivitet" (B:68).
- **Anmärkning:** En kopia av hela databasen behåller kontonummer och meddelanden som sajten lovat radera, och C:s kvitton ligger utanför det A/D kopierar. Beslut: gallra kopiorna i takt med löftena, undanta tabeller/kataloger, eller skriva om löftena. SD-30:s huvudkopior ska in i kopian (D#4).
- **Väntar:** SN-01; SD-30 och F-01/F-02 följer.

### B-17 Loggning mot Frågelådans anonymitet
- **Källa:** A/M28 (A:431–432), A/L14 (A:961–962), B/fragelada (B:58, B:60, B:61), D#10 (D:64)
- **A säger:** "`onRequestError` i `instrumentation.ts` … som loggar strukturerat" (A:431–432) – kroken får sökväg, frågesträng och rubriker (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/instrumentation.md:103-105`); "komplettera `audit()` (L14) – inklusive misslyckade inloggningar och låsningar (M24)" (A:961–962). D: "logga serverfel" (D:64).
- **B säger:** "Inga namn, IP-adresser, webbläsaruppgifter eller kakor sparas." (B:58); "Datum sparas per dag, inte per klockslag, så att meddelanden inte kan kopplas till serverloggar." (B:60); "Innehållet skrivs aldrig till `audit_log` eller till loggarna." (B:61).
- **Anmärkning:** Strukturerad felloggning med sökväg och klockslag gör att ett fel i `/fragelada` kan kopplas till ett meddelande via tid; B:s regel kräver att kroken maskar den rutten. SN-07:s loggning och SD-32:s breddade `audit()` måste utformas med den regeln.
- **Väntar:** SN-07, SD-32; SD-31 och F-01 följer.

### B-18 Avisering: mejl till posten eller bara en siffra i menyn
- **Källa:** B/rad-44, B/rad-73, C/rad-62
- **B säger:** "funktionen ska nå posten av sig själv. Något som kräver att någon minns att logga in dör vid första överlämningen." (B:44); "skickas ett mejl utan innehåll ('Du har ett nytt meddelande') till posten om `SMTP_*`-variablerna är satta" (B:73).
- **C säger:** "`Kvitton` för alla i sidebar.tsx, med en siffra för kassören via layout.tsx" (C:62) – ingen avisering utanför sajten.
- **Anmärkning:** Ingen checklistepunkt väntar; beslutet styr F-01, F-02 och F-07 (posttabellens regel) och kräver U-05 (SMTP) om mejlvägen väljs.
- **Väntar:** inga checklistepunkter; F-01, F-02, F-07.

### B-19 Klientbundlen: flytta loggans vektorbanor eller låta dem vara
- **Källa:** A/S8 (A:847–851), D#7 (D:48)
- **A säger:** "**Mät först** – då flyttar byten från ett oföränderligt, cachat JS-chunk till HTML + RSC-payload per sidvisning, så återkommande besökare kan få ladda mer, inte mindre; troligen inte värt det." (A:849–851).
- **D säger:** ringen "kan bli vektorbanor utan att något går" förlorat – mer vektordata i samma klientkomponent (`src/components/brand/formula-ring.tsx:4`) (D:48).
- **Anmärkning:** Mätvärdena står i ST-08 (31 096 B rå, 11 925 B gzip). D:s förslag ökar det A vill minska; båda kan vara rätt beroende på hur chunkarna delas – därav "mät först".
- **Väntar:** ST-08; ST-23 nämner.

### B-20 Varumärkesrött mot WCAG-kontrast
- **Källa:** A/L19 (A:635), D#7 (D:49)
- **A säger:** "använd `red-deep` (5,5:1), `stone` (5,7:1), `white/60`" (A:635).
- **D säger:** behåll "Georgia i citat, som styrdokumentet föreskriver" (D:49) – och styrdokumentets rött är `#FF0707` (Pantone 2347 CP, `src/app/(site)/grafisk-profil/page.tsx:45`), som ger 3,97:1 med vit text (SB-12).
- **Anmärkning:** Beslut för grafiskt ansvarig/styrelsen: WCAG AA (4,5:1) för text på rött kräver antingen mörkare rött eller att rött bara används för stora texter och dekor.
- **Väntar:** SB-12

### B-21 Verifieringsmiljö för bildstegen: Docker/Linux som saknas lokalt
- **Källa:** A/rad-1006, A/rad-1007, D/rad-91
- **A säger:** "På Windows saknar standalone libvips-DLL:erna (känt), så bildstegen verifieras i Docker/Linux." (A:1006–1007).
- **D säger:** "Docker saknas på datorn, så Node 24-bilden kan bara byggas hos Fly." (D:91) – bekräftat av minnesanteckningen (bara Flys fjärrbyggare).
- **Anmärkning:** Valet är Docker lokalt (installation), en Linux-maskin/CI (SN-06) eller att prova imagen i en Fly-app för test.
- **Väntar:** SN-08

**Faktamotsägelser – avgjorda genom mätning 2026-11-03**

- **Fakta-1 `npm audit`:** A (A:30–31) "16 'moderate', alla i ESLint-kedjan"; D (D:41) "`npm audit` visar 0 sårbarheter i dag". Mätt: `npm audit` → 16 moderate (`minimatch < 11.0.1`, GHSA-g3hv-75wg-m249, dev-kedjan), `npm audit --omit=dev` → 0. Båda har rätt med sin flagga; D anger inte flaggan (BE-05, R-08).
- **Fakta-2 "Sajten visar också allt innehåll utan JavaScript":** D (D:69). Motsägs av Nexts dokumentation (`node_modules/next/dist/docs/01-app/02-guides/streaming.md:582`) och av live-DOM:en: Suspense-hål levereras som `<div hidden id="S:…">` och visas först när skript körs (SB-27, R-11). Inte provat med JS avstängt i webbläsare; DOM-läsningen räcker för att vederlägga "allt".

**Ingen motsägelse – union eller parameterval** (kriterium: värden som ryms i varandra eller förslag som kompletterar varandra; skrivs som samsyn i punkten, aldrig som eget val)

- Övervakningsintervall: A/M28 "≥ 30 min" (A:434) och D#10 "ungefär en gång i timmen" (D:65) ryms i varandra → SN-07.
- `instrumentation.ts` med `onRequestError` bakom `NEXT_RUNTIME`: A/M28 = D#10, med förbehållet B-17 → SN-07.
- Node 24 som mål: A/M10 = D#6; bara golvet är B-9 → NO-01.
- `snapshot_retention` 30 dagar: A/H1 = D#1; D:13 "kolla priset först" → U-07, SN-01.
- `deleteMediaIfUnused`: A/M5 breddar räkningen, D#4 lägger till huvudkopian → SD-09, SD-30.
- e2e "ensamt": A (A:1006), B (B:103), C (C:105), D (D:86) menar alla separat körning på grund av CPU-last → SN-06, ST-25.
- Felsidor: A/M14 + D#10 är en union så länge omfånget bekräftas → B-15.

## 8 Funktionsförslag och uppgifter utanför koden

Åtta funktionsförslag (F) och nio uppgifter utanför koden (U). De är inte fel och följer inte checklistemallen: varje block sammanfattar, pekar på planfil och rad, och listar beroenden mot beslut och checklistepunkter. Det som i planerna B, C och D var fel i koden står i avsnitt 1–6; det som inte gick att belägga står i avsnitt 9.

### F-01 Frågelådan – anonyma meddelanden till AMO, utbildningsbevakaren eller ordförande
- **Källa:** B/fragelada (B:46–89), B/tre-1 (B:9)
- **Innehåll:** Ny sida `/fragelada` med val av mottagare (B:50); svarskod som lagras hashad som sessionerna; `/admin/fragelada` med flagga per konto; inga namn, IP-adresser eller klockslag (B:58–61); radering efter 12 månader och knappen "Töm lådan" (B:68); avisering via SMTP om variablerna finns (B:73); migreringssteg 10 med `inbox_threads`/`inbox_messages` (B:77); e2e-steg enligt B:103–109.
- **Beroenden:** B-11 (bygga eller ändra texterna; SB-26), B-7 (migreringsnumret), B-17 (loggning mot anonymiteten; SN-07, SD-32), B-18 (avisering), B-16 (kopiorna behåller det som raderas), U-04 (vem läser `amo@`), U-05 (SMTP). Obs: `rateLimitHit` håller räknaren i minnet och nollas vid varje kallstart (`src/lib/auth/rate-limit.ts:2`), och maskinen stoppas utan trafik (`fly.toml:35` `min_machines_running = 0`) – skräppostskyddet i B:59 är därför svagare än det låter.

### F-02 Kvittokö och Fortnox-inkorg
- **Källa:** C/fas-1 (C:24–63), C/fas-2 (C:64–82), C/fas-3 (C:83–93), B/post (B:19 "Kvittoinlämning med status: inskickad, godkänd, utbetald")
- **Innehåll:** Utlägg med fil, belopp, Swish/kontonummer som bara kassören och inlämnaren ser och som raderas vid utbetalt/nekat (C:11, C:57); kvitton utanför `media` i `DATA_DIR/kvitton` (C:21); `users.treasurer` och `receipts` i steg 10 (C:28–29); HEIC-kontroll bruten ur `storeImage` (C:45); server actions för inlämning och beslut (C:48); filrutt under `/admin` med `private, no-store` och sandbox-rubriker (C:52); gallring 90 dagar efter Fortnox (C:17, C:60); meny med siffra (C:62); fas 2–3 skickar till Fortnox inkorg och kräver bolagets konto (U-06).
- **Beroenden:** B-6 (filer i server actions – C:48 bygger på gränsen A vill ta bort; SD-01), B-7, B-16, B-18, SD-02:s vakt (samma kropp-buffring gäller kvittofilen), SB-24 (C:52 ärver `/media`-rubrikerna, inkl. Safari-frågan), SD-14/SD-36 (C:40 lägger till ett demokonto i `seed.ts`), ST-06/SD-22/SD-30 (C:45 HEIC i samma funktion som bildavkodningen), U-06.

### F-03 Glömt lösenord via mejl
- **Källa:** D#2 (D:24), B/rad-73, README:258 (att göra-listan)
- **Innehåll:** Återställning via adressen som hör till posten, så att den följer posten vid årsskiftet (D:24); samma SMTP-väg som Frågelådans avisering (B:73).
- **Beroenden:** U-05 (SMTP); engångslänkens nyckelrymd och utgångstid bör sättas med SD-24 i åtanke.

### F-04 Verksamhetsår, "Tidigare styrelser", gallring och integritetssida
- **Källa:** D#8 (D:51–55), B/tre-2, B/rad-68, C/rad-11, C/rad-17
- **Innehåll:** Årsfält på styrelseposter så att överlämningen inte raderar historiken (`board_members` saknar årsfält, `src/lib/db/migrations.ts:68-76` – SD-17 visar hur bootstrap seedar om tomma tabeller); sidan "Tidigare styrelser"; gallringsregler för `audit_log` (SD-31), meddelanden (B:68) och kvitton (C:11, C:17); en integritetssida som beskriver vad som sparas och hur länge.
- **Beroenden:** B-7 (migreringssteg), SD-31 (integritetssidan hör ihop med loggens gallring), B-16; styrelsebeslut om vad som ska visas om tidigare förtroendevalda.

### F-05 Länkkontroll, "senast granskad" och bevakning av tentastatistikens källa
- **Källa:** D#9 (D:57–60)
- **Innehåll:** Månatlig länkkontroll som inte larmar på inloggningslänkar (D:58); "senast granskad" per sida och en adminlista över sidor som inte setts över på ett år (D:59); bevakning av `EXAM_STATS_URL`-källan, som verkar drivas av en privatperson (`src/lib/data/exam-stats.ts:13`, D:60) – sajten klarar avbrott med sparad data (SB-19) men ingen får veta om källan försvinner.
- **Beroenden:** SN-07 (samma larmväg som hälsokontrollen); ST-19 (`EXAM_STATS_URL` saknas i `.env.example`).

### F-06 Engagera dig: anmälan, passlistor, postpärm och årshjul
- **Källa:** B/verktyg-2, B/verktyg-3, B/verktyg-4, B/tre-3 (B:11), B/rad-31 (postpärm), D/rad-22 (årshjul, "större uppgraderingar i juni")
- **Innehåll:** Publika formulär för anmälan till sittningar med platser, kö och specialkost som raderas efteråt (B:23), passlistor (B:24), "Jag kommer"-knapp (B:26), intresseanmälan (B:28); postpärm med anteckningar och filer som följer kontot (B:31); årshjul där återkommande uppgifter blir uppdrag på tavlan (B:17, D:22). B:11 "inte ett enda publikt formulär" är omformulerat i R-12: inget formulär som skickar något *till sektionen*.
- **Beroenden:** F-01 (samma skräppost- och anonymitetsregler), B-16 (allergiuppgifter i kopiorna), SD-31 (gallring).

### F-07 Posttabellen – varje post väljer sin viktigaste punkt
- **Källa:** B/post (B:15–29), B/rad-5, B/rad-44
- **Innehåll:** B:s tabell med "störst nytta" och "också bra" per post: ordförande (årshjul, B:17), vice (utskottspuls, B:18), kassör (kvitton, B:19 → F-02), info (Veckans StatLin, B:20), utbildningsbevakare (anonym kursfeedback, B:21), näringsliv (företagsregister efter STAR, B:22), mästeri (anmälan, B:23), pub (passlista, B:24), grafiskt ansvarig (beställningsmall, B:25), STIG/eSTIG (B:26–27), masteransvarig vakant (B:28), AMO (Frågelådan, B:29 → F-01). B:5: "Låt gärna varje post välja sin viktigaste punkt på nästa styrelsemöte". Regeln B:44: "funktionen ska nå posten av sig själv".
- **Beroenden:** B-18 (regeln kräver avisering); F-01, F-02, F-06 är de punkter som redan är planerade.

### F-08 Spara gamla adresser och vidarebefordra när en slug ändras
- **Källa:** D/rad-30 (D#3)
- **Innehåll:** "Ändras adressen för hand dör den gamla länken, så spara gamla adresser och skicka dem vidare." (D:30). I dag finns bara tre fasta omdirigeringar (`next.config.ts:46-48`, ST-20); `uniqueSlug` (`src/lib/admin/helpers.ts:29`) hindrar krockar men minns inget.
- **Beroenden:** B-7 (en `slug_history`-tabell är ett migreringssteg); SB-20 (länkar till dolda sidor) löses lämpligen i samma omdirigeringslager.

### U-01 Ägarskap: Fly-konto, domän hos Name.com, betalkort, två personer per tjänst
- **Källa:** D#2 (D:20–21), B/tre-2
- **Innehåll:** "Kolla vem som står på Fly-kontot, domänen hos Name.com och betalkortet" (D:20); flytta till ett konto som följer posten, minst två personer per tjänst, automatisk förnyelse av domänen (D:21). Överlämningsdokumentet i README (SN-09) ska peka på detta.
- **Beroenden:** Fakta om ägarskapet kräver kontona (R-46); SN-09.

### U-02 Domänbyte till statlin.se: DNS, MX, vidarebefordran från fly.dev, UID-värd
- **Källa:** D#3 (D:27–30), A/L22
- **Innehåll:** `fly certs add statlin.se` och DNS-poster (README:168), MX-posterna kvar för e-posten, permanent vidarebefordran från `statlin-web.fly.dev` (ST-20:s värdregel), `SITE_URL` på båda ställena i `fly.toml` och ombyggnad (ST-20), ICS-UID byter värd en gång (SB-04, `src/lib/ics.ts:62,77`, även per-evenemangsfilen) – därför B-5.
- **Beroenden:** B-5, ST-20, SB-04, U-01 (vem äger domänen).

### U-03 Originalloggor från grafiskt ansvarig
- **Källa:** D#7 (D:47)
- **Innehåll:** Vektor- eller högupplösta original för de elva utskottsloggorna och STAR (ST-24: WebP 286–640 px, PNG-nedladdningar, PDF med pixelloggor enligt heuristik – R-48).
- **Beroenden:** ST-24; B-20 om färgen ändras samtidigt.

### U-04 Bekräfta vem som är AMO och att `amo@statlin.se` läses
- **Källa:** B/rad-87, Live (2026-11-03)
- **Innehåll:** "Sajten visar inget namn, och lådan ska inte öppnas för en post som ingen läser." (B:87). Kontot finns (`scripts/create-accounts.mjs:38`); live finns inget AMO-/Pub-kort på styrelsesidan och `/utskott` visar AMO som "Förtroendepost" (R-38).
- **Beroenden:** F-01 får inte gå live före detta.

### U-05 SMTP-åtkomst i Google Workspace
- **Källa:** B/rad-88
- **Innehåll:** "Valfritt: skapa SMTP-åtkomst i Google Workspace för aviseringen. Lådan kan gå live utan den." (B:88). Samma väg bär F-03.
- **Beroenden:** B-18 avgör om det behövs; F-01, F-03.

### U-06 Fortnox: dold integration i livebolaget, licens, utvecklarkonto på postadress
- **Källa:** C/fas-3 (C:83–93)
- **Innehåll:** Fortnox-kontot, integrationens godkännande och en utvecklarregistrering på en adress som följer kassörsposten; utan dem stannar F-02 i fas 1 (kön utan inkorg).
- **Beroenden:** F-02; U-01 (samma ägarskapsregel).

### U-07 Pris för 30 dagars ögonblicksbilder hos Fly
- **Källa:** D/rad-13 (D#1)
- **Innehåll:** "Höj sparandet hos Fly till ungefär 30 dagar (kolla priset först)." (D:13). `snapshot_retention` saknas i `fly.toml` (SN-01) och A:1141 påpekar att det även kräver `fly volumes update`.
- **Beroenden:** SN-01, B-2.

### U-08 Aliasen `vice.orforande@`, `ub@` och `grafisktansvarig@`: bekräfta att de finns eller rätta i Admin
- **Källa:** B/småfel-1 (B:94), A/L20 (aliasdelen), Live (2026-11-03)
- **Innehåll:** Live använder `mailto:vice.orforande@statlin.se` (kortet för vice på `/sektionen/styrelsen`), `ub@` och `grafisktansvarig@`, medan koden seedar `vice@`/`ubu@`/`grafiskt@` (`src/lib/seed-content.ts:113,117`, `scripts/create-accounts.mjs:27,32`): adresserna är ändrade i databasen. Bekräfta i Google Workspace att aliasen finns och når rätt konton, annars rätta dem i Admin → Styrelsen/Utskott. R-36.
- **Beroenden:** ingen kod; SN-09:s överlämningsdokument bör lista alla alias.

### U-09 Rensa demoinnehållet i produktionen och kontrollera demokontona
- **Källa:** SD-36 (NY-1), B/småfel-5 (B:98)
- **Innehåll:** Ta ögonblicksbild först. Ta bort de nio seedade evenemangen (`scripts/seed.ts:78-102`, inkl. forms.gle-länkar `seed.ts:81,99`) och nyheten "Välkommen till nya statlin.se" (`seed.ts:148`) – eller ersätt med riktiga. Kontrollera `SELECT email, role, must_change_password FROM users` (eller Admin → Konton): demokontona `scb@`, `ubu@`, `info@` och eventuellt `admin@` ska ha nya lösenord eller tas bort; `info@` höjdes till admin utan lösenordsbyte (`scripts/create-accounts.mjs:83-85,92`).
- **Beroenden:** SD-14 (spärren för `seed --demo` mot produktion), SD-36, R-45 (kontodelen kräver produktionsdatabasen).

## 9 Refuterat

Femtio rader i tre grupper, alla med status: (a) **Refuterad** – koden eller en mätning säger emot påståendet; (b) **Vederlagd åtgärd** – ett åtgärdsförslag som A:s dubbelkoll (eller den här genomgången) visat vara fel, listat så att ingen gör om det; (c) **Obelagd – kräver X** – påståendet går inte att belägga i koden, med vad som skulle belägga det och vad live-läsningen 2026-11-03 visade. B/småfel-5 (kalenderdatumen) är inte obelagd: evenemangen är demodata och står som SD-36.

### (a) Koden säger emot

### R-01 `gradeColors` skulle indexera en tom skala
- **Källa:** A/rad-55 (A:s egen refuterade kandidat)
- **Påstående:** `gradeColors` kan läsa utanför en tom färgskala.
- **Orsak:** `src/lib/exam-stats.ts:56` har `PASS_RAMPS[…] ?? []` – en tom skala ger en tom lista, aldrig ett index utanför. A refuterade själv kandidaten.
- **Status:** Refuterad

### R-02 `uniqueSlug` har en kapplöpning
- **Källa:** A/rad-55 (A:s egen refuterade kandidat), A/rad-1130
- **Påstående:** Två samtidiga sparningar kan få samma slug.
- **Orsak:** `uniqueSlug` (`src/lib/admin/helpers.ts:29-31`) är synkron mot better-sqlite3 i en enda process; ingen `await` mellan läsning och skrivning. Med flera processer (SN-09:s "en process") skulle det bli ett fynd.
- **Status:** Refuterad

### R-03 L19:s delpåstående om piltangenterna i hjälpmedlens flikar
- **Källa:** A/L19, A/rad-1112
- **Påstående:** Piltangenterna fungerar bara åt ett håll i `resource-board`.
- **Orsak:** `src/components/resources/resource-board.tsx:41-43` går till nästa flik för både vänster- och högerpil; med två flikar är det samma sak som "åt båda håll". Det som återstår (Home/End) står i SB-14. A:1112: "L19 överdrev piltangenterna".
- **Status:** Refuterad

### R-04 Falskt grönt i e2e uppstår via "inloggningen mellan stegen"
- **Källa:** A/rad-658, A/L21
- **Påstående:** `catch {}` på `tests/e2e.mjs:1149` sväljer fel som sker utanför ett steg, "t.ex. i inloggningen mellan stegen".
- **Orsak:** Inloggningen sker inuti ett steg (`tests/e2e.mjs:830`); mellan stegen finns bara deklarationer. Den verkliga vägen till falskt grönt är `e.message` på något som inte är `Error` (SN-10, N4).
- **Status:** Refuterad

### R-05 "`user-form.tsx` är 69 rader" och visar lösenordet
- **Källa:** A/rad-1176, A/L44
- **Påstående:** Lösenordet för nya konton visas i `user-form.tsx`.
- **Orsak:** Filen är 68 rader (`wc -l` 2026-11-03) och lösenordet visas i `src/components/admin/action-form.tsx:131-135` (`state.data.password`). Felhänvisning i A, inte ett fynd; SD-28 pekar på rätt fil.
- **Status:** Refuterad

### R-06 "Cache-Control saknas bara på sitemapen"
- **Källa:** A/rad-1091, A/L25
- **Påstående:** Sitemapen är den enda rutten utan `Cache-Control`.
- **Orsak:** Per-evenemangs-ICS (`src/app/(site)/evenemang/[slug]/kalender.ics/route.ts:10-13`) saknar också rubriken; live 2026-11-03 svarar den utan `cache-control` (ST-22).
- **Status:** Refuterad

### R-07 L25:s första påstående: `/kalender.ics` och `/api/tentastatistik/koder` saknar `Cache-Control`
- **Källa:** A/L25
- **Påstående:** Flödet och kodlistan saknar cache-rubrik.
- **Orsak:** `src/app/kalender.ics/route.ts:13` sätter `public, max-age=900` (live bekräftat) och `src/app/api/tentastatistik/koder/route.ts:7-8` sätter `max-age=3600` respektive `no-store`. Kvar av L25 är ST-22.
- **Status:** Refuterad

### R-08 "`npm audit` visar 0 sårbarheter i dag"
- **Källa:** D/rad-41, D#5
- **Påstående:** Inga sårbarheter.
- **Orsak:** Utan flagga 16 moderate (ESLint-kedjan); 0 bara med `--omit=dev` (mätt 2026-11-03, BE-05, Fakta-1).
- **Status:** Refuterad

### R-09 "Migreringar körs automatiskt vid start"
- **Källa:** D/rad-16, D#1
- **Påstående:** Migreringarna körs när processen startar.
- **Orsak:** `migrate(db)` körs vid första `getDb()` (`src/lib/db/index.ts:26`), lat – ofta utlöst av hälsokontrollen (SN-07) eller första besöket, inte av processstarten. Det påverkar var en "kopia före migrering" kan tas (B-3).
- **Status:** Refuterad

### R-10 "Formelringens typsnitt sätts på `formula-ring.tsx:238`"
- **Källa:** D/rad-48, D#7
- **Påstående:** Rad 238 bär typsnittet.
- **Orsak:** Rad 238 är `<text fill={…}>`; typsnittet kommer från `src/app/globals.css:29,615-616` och β̂-raden `src/components/brand/formula-ring.tsx:245` (ST-23).
- **Status:** Refuterad

### R-11 "Sajten visar också allt innehåll utan JavaScript"
- **Källa:** D/rad-69
- **Påstående:** Allt innehåll syns utan skript.
- **Orsak:** Suspense-hål (sidfot, dokumentlista, header) levereras som `<div hidden id="S:…">` och visas av ett inline-skript (`node_modules/next/dist/docs/01-app/02-guides/streaming.md:582`; live-DOM 2026-11-03) – SB-27, Fakta-2. Botar får hela dokumentet, så SEO-delen av påståendet håller.
- **Status:** Refuterad

### R-12 "Sajten har inte ett enda publikt formulär"
- **Källa:** B/tre-3 (B:11)
- **Påstående:** Inget publikt formulär finns.
- **Orsak:** Kurssökningen är ett GET-formulär (`src/components/exam/course-search.tsx:60-62`) och inloggningen ett POST-formulär (`src/app/logga-in/login-form.tsx:16`). B:s poäng håller omformulerad – inget formulär som skickar något *till sektionen* (F-06).
- **Status:** Refuterad

### R-13 L35:s rubrik "ingen pixelgräns"
- **Källa:** A/L35
- **Påstående:** Bilder avkodas utan någon pixelgräns.
- **Orsak:** sharp har 268 Mpx som standard (`node_modules/sharp/dist/constructor.cjs:161,168`); det som saknas är en *egen* lägre gräns (SD-22).
- **Status:** Refuterad

### R-14 "Engångslösenordens nyckelrymd ~20 bitar"
- **Källa:** A/rad-1138, A/L39
- **Påstående:** Alla engångslösenord har ~20 bitars rymd.
- **Orsak:** 12 ord × 12 ord × 9 000 ≈ 2^20,3 gäller skripten (`scripts/create-accounts.mjs:55-57`); appens `generatePassword` har 24 ord (`src/lib/auth/password.ts:16-22`) ≈ 2^22,3 (SD-24, ST-09).
- **Status:** Refuterad

### R-15 L14:s delpåstående "lösenordsbyte loggas inte"
- **Källa:** A/L14
- **Påstående:** Byte av eget lösenord lämnar inget spår i `audit_log`.
- **Orsak:** `src/app/admin/_actions/auth.ts:86` loggar `"Bytte lösenord"`. Profiländring och utloggning av andra enheter loggas däremot inte (SD-32).
- **Status:** Refuterad

### R-16 "Sju demoevenemang" i produktionen
- **Källa:** B/småfel-5 (B:98), NY-1 (genomförandeplanens SD-36-rad)
- **Påstående:** Sju seedade evenemang ligger live.
- **Orsak:** `scripts/seed.ts:78-102` seedar nio (pubkväll, höstsittning, lunchföreläsning, LAN, innebandy, kursutvärderingsfika, STAR, julsittning, höstmöte) och live-listan 2026-11-03 visar alla nio (SD-36, U-09). B:98 nämner två av dem som "kan vara platshållare" – de är det.
- **Status:** Refuterad

### (b) Åtgärdsförslag som vederlagts – så att ingen gör om dem

### R-17 `deploymentId` mot "Failed to find Server Action"
- **Källa:** A/M19 (A:316–319, A:1156–1157)
- **Påstående:** `deploymentId` i `next.config.ts` löser felet efter deploy.
- **Orsak:** Servern kontrollerar action-id innan sin deployment-id-logik, och `deploymentId.md:71` kräver att värden dirigerar per deployment – Fly gör inte det. Rätt väg: fast `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` (SD-03).
- **Status:** Vederlagd åtgärd

### R-18 CSS-animation som reserv för `.reveal` och `data-shown` i inline-skriptet
- **Källa:** A/M13 (A:252–256)
- **Påstående:** En animation på `.js .reveal` som tvingar `opacity: 1` efter 2,5 s, eller `data-shown` satt i inline-skriptet, skyddar mot osynligt innehåll.
- **Orsak:** Animationsvärden slår igenom även när JS fungerar och fixerar varje `.reveal` i synligt läge så att scrollavslöjandet aldrig spelas; inline-skriptet körs i `<head>` innan `<body>` finns och krockar med serverns `data-shown="false"` (`src/components/ui/reveal.tsx:40`). SB-03:s åtgärd är `dataset.hydrated` i en effekt.
- **Status:** Vederlagd åtgärd

### R-19 "Reserv"-`postcss.config.mjs` bredvid Turbopack-laddaren
- **Källa:** A/L26 (A:695–696, A:1162)
- **Påstående:** En PostCSS-konfiguration bredvid `@tailwindcss/turbopack` ger fallback.
- **Orsak:** Next plockar upp `postcss.config.*` automatiskt (`node_modules/next/dist/docs/01-app/03-api-reference/08-turbopack.md:99`) och skulle köra Tailwind två gånger. Antingen hela vägen `@tailwindcss/postcss` eller dokumentera nuvarande upplägg (BE-06).
- **Status:** Vederlagd åtgärd

### R-20 Bokstavlig kopia av `seeded_links`-logiken för styrelse/dokument
- **Källa:** A/M12 (A:238)
- **Påstående:** Kopiera flaggan `seeded_links` rakt av för de andra tabellerna.
- **Orsak:** Flaggan (`src/lib/db/bootstrap.ts:31`) skyddar bara en tabell och skrivs vid första körningen; en kopia per tabell utan att skilja "tom för att raderad" från "tom för att ny" ger samma återseedning (SD-17). Åtgärden är flaggor per tabell satta vid seedning *och* vid medveten tömning.
- **Status:** Vederlagd åtgärd

### R-21 Ren `Date.parse`/rundtur utan `Number.isFinite`-vakt
- **Källa:** A/M15 (A:1159–1160)
- **Påstående:** Validera datum genom att parsa och formatera tillbaka.
- **Orsak:** Rundturen kastade själv `RangeError` för `13-01`/`12:60` (`toISOString` på `Invalid Date`); vakten måste komma före formateringen (SB-32).
- **Status:** Vederlagd åtgärd

### R-22 "503 från rutten" när kodlistan är tom
- **Källa:** A/L28 (A:704–705)
- **Påstående:** Låt `/api/tentastatistik/koder` svara 503 när källan inte svarar.
- **Orsak:** `r.ok ? r.json() : []` (`src/components/exam/course-search.tsx:13`) cachar `[]` även vid 503; `codesPromise` måste nollställas vid tom lista (SB-18).
- **Status:** Vederlagd åtgärd

### R-23 Jämföra ISO-strängar för "oförändrat datum"
- **Källa:** A/M25 (A:1189)
- **Påstående:** Hoppa över `published_at` om strängen är oförändrad.
- **Orsak:** Formuläret skickar lokal tid utan sekunder, databasen ISO med Z; strängarna skiljer sig alltid (SB-33, ST-02). Åtgärden är ett tomt fält för utkast och explicit `published`-flagga.
- **Status:** Vederlagd åtgärd

### R-24 GitHub Actions-artefakter som backuplagring; `instrumentation.ts` för migreringskontroll
- **Källa:** A/H1 (A:82–85, A:92–93, A:1139–1141)
- **Påstående:** Spara kopiorna som artefakter i ett flöde; kontrollera migreringar i `register()`.
- **Orsak:** Repot är publikt – artefakter kan laddas ner av alla inloggade GitHub-användare; schemalagda flöden stängs av efter 60 dagars inaktivitet; "före varje deploy" kan inte tvingas från ett flöde när deploy körs för hand. `register()` kan köras i bygg-/förrenderingsarbetare och öppna databasen vid bygget (SN-01, B-2, B-3).
- **Status:** Vederlagd åtgärd

### R-25 `sftp put` mot en körande databas
- **Källa:** A/H1 (A:1143)
- **Påstående:** Återställ genom att skriva databasfilen med `fly ssh sftp put`.
- **Orsak:** En körande process med gammal WAL skriver över eller blandar sidor; återställning kräver stoppad maskin, `fly machine clone --attach-volume` eller en återställningskrok i startskriptet (SN-02).
- **Status:** Vederlagd åtgärd

### R-26 Nonce-baserad CSP
- **Källa:** A/L1 (A:1160–1161)
- **Påstående:** Inför CSP med nonce i proxyn.
- **Orsak:** Nonce är inkompatibel med förrenderingen/skalet (Cache Components); "Without Nonces"-varianten (`node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md:417-435`) är den som gäller (SD-19).
- **Status:** Vederlagd åtgärd

### R-27 Villkorad `chown` ("bara när toppnivåns uid skiljer sig")
- **Källa:** A/M17 (A:294–297, A:1145)
- **Påstående:** Hoppa över hela promenaden om toppkatalogen redan har rätt ägare.
- **Orsak:** Promenaden tar under en sekund även med tusentals filer; villkoret skulle lämna delvis fel ägda träd oåtgärdade. Rätt: `lstatSync`, hoppa över symlänkar, chowna bara poster med fel uid/gid (SD-18).
- **Status:** Vederlagd åtgärd

### R-28 `.clone()` + `Promise.all` i sharp
- **Källa:** A/S6 (A:1173)
- **Påstående:** Klona en sharp-instans per bredd och kör parallellt för att spara avkodning.
- **Orsak:** Klonerna delar inte avkodningen – varje gren avkodar – och parallellkörning höjer toppminnet (ST-06, SD-22).
- **Status:** Vederlagd åtgärd

### R-29 `key`-varianten för `UserForm`
- **Källa:** A/M7 (A:1162)
- **Påstående:** Ge formuläret en ny `key` efter lyckad sparning för att nollställa radioknapparna.
- **Orsak:** Kräver en extra klientkomponent runt serverformuläret; okontrollerade radioknappar med `defaultChecked` löser det utan (SB-31).
- **Status:** Vederlagd åtgärd

### R-30 `attempts.delete(key)` vid lyckad inloggning
- **Källa:** A/M1 (A:108, A:1166)
- **Påstående:** Nollställ spärren när inloggningen lyckas.
- **Orsak:** Då kan en angripare med rätt lösenord till ett konto nollställa räknaren för hela IP-nyckeln; spärren stoppar det 21:a försöket och e2e gör ~18 inloggningar (SD-12).
- **Status:** Vederlagd åtgärd

### R-31 `zUrl`-validering av `logo_url`
- **Källa:** A/L5 (A:560, A:1123)
- **Påstående:** Validera loggans adress med `zUrl`.
- **Orsak:** `zUrl` godtar allt som börjar med `/` (`src/lib/admin/form.ts:58`), alltså även andras `/media/`-adresser – problemet i SD-10 kvarstår. Åtgärden är `logo_media_id` + `canUseImage` (ST-01, B-7).
- **Status:** Vederlagd åtgärd

### R-32 `setUser` som behåller `open`
- **Källa:** A/M2 (A:1187–1188)
- **Påstående:** Låt `setUser` behålla `open` så att lådan inte stängs.
- **Orsak:** Städningen nollar `open` först, så halvan var verkningslös; stabila beroenden (`[user.id]`) är åtgärden (SB-30).
- **Status:** Vederlagd åtgärd

### R-33 Ren rubrikkontroll (`content-length`) som enda vakt för uppladdningen
- **Källa:** A/M4 (A:140–142, A:916, A:1167)
- **Påstående:** Kontrollera `content-length` före `formData()`.
- **Orsak:** `Number(null)` är 0, så en chunked- eller HTTP/2-kropp utan rubrik passerar; vakten vilar på att Flys proxy alltid vidarebefordrar `Content-Length`, vilket inte är provat. A:916 är den inaktuella raden – B-12 (SD-02).
- **Status:** Vederlagd åtgärd

### R-34 A:901 som skydd mot proxyns minnesrisk (delvis)
- **Källa:** A/M23 (A:901–903)
- **Påstående:** Ta bort `proxyClientMaxBodySize` och sänk `bodySizeLimit`, testa med `POST /`.
- **Orsak:** Att stryka nyckeln ger standard 10 MB men tar inte bort kopian; `POST /` går aldrig genom proxyn (matchern `src/proxy.ts:41`), så testet provar fel väg; `/tentastatistik` släpps igenom oinloggat (`src/proxy.ts:14`) och buffras ändå. Delvis vederlagd – sänkningen av `bodySizeLimit` står (SD-01, B-13).
- **Status:** Vederlagd åtgärd

### R-35 `npm audit fix --force`
- **Källa:** npm:s eget förslag i `npm audit` 2026-11-03 ("fix available via `npm audit fix --force`"), A/rad-30
- **Påstående:** Kör den föreslagna tvångsrättningen.
- **Orsak:** Den installerar `eslint@4.0.0` ("breaking change") för att bli av med `minimatch` i dev-kedjan; produktionsberoendena har 0 (BE-05).
- **Status:** Vederlagd åtgärd

### (c) Går inte att belägga i koden

### R-36 `vice.orforande@statlin.se` på tre sidor
- **Källa:** B/småfel-1 (B:94), Live (2026-11-03)
- **Påstående:** Adressen ser ut som ett stavfel och finns på tre sidor.
- **Orsak:** 0 träffar i koden (`src/lib/seed-content.ts:113` har `vice@`); live bekräftat på `/sektionen/styrelsen` → värdet ligger i databasen. Om adressen är ett fungerande alias avgörs i Google Workspace (U-08).
- **Status:** Obelagd – kräver Admin → Styrelsen och Google Workspace

### R-37 `/dokument` är tomt
- **Källa:** B/småfel-2 (B:95), Live (2026-11-03), NY-19
- **Påstående:** Dokumentsidan är tom fast menyn lovar stadgar och protokoll.
- **Orsak:** Live visar "Inga dokument uppladdade ännu" trots att bootstrap seedar ett grafiskt styrdokument (`src/lib/db/bootstrap.ts:39-41`); `published` har standard 1 (`src/lib/db/migrations.ts:137`) och listan filtrerar på det (`src/lib/data/content.ts:126`) – raden är troligen avpublicerad eller raderad. Ingen kod krävs för att lägga upp stadgarna.
- **Status:** Obelagd – kräver Admin → Dokument

### R-38 AMO och StatPub utan kontaktperson; kort utan beskrivning; Master vakant
- **Källa:** B/småfel-3 (B:96), Live (2026-11-03)
- **Påstående:** Innehållsluckor på styrelse- och utskottskorten.
- **Orsak:** Live bekräftat (`/sektionen/styrelsen`, `/utskott`): data, inte kod. "Vi söker"-kortet för masteransvarig är F-07 (B:28).
- **Status:** Obelagd – kräver Admin → Styrelsen/Utskott

### R-39 UB/UBU i databasen: bio, fikaevenemanget, programsidorna
- **Källa:** B/småfel-4 (B:97), Live (2026-11-03)
- **Påstående:** Namnbytet till UB är inte genomfört överallt.
- **Orsak:** Koddelen (meny, knappar, sluggen `ubu`) är ST-27. Live `/utskott` visar "UB Utbildningsbevakare" med slug `ubu`; texterna i utskottets beskrivning, fikaevenemanget och programsidorna ligger i databasen.
- **Status:** Obelagd – kräver Admin → Utskott/Evenemang/Sidor

### R-40 "i sin inverterade form" på `/studenter/ny-student`
- **Källa:** D/rad-57, Live (2026-11-03), Minne (2026-11-02)
- **Påstående:** Gammal text ligger kvar i produktionen.
- **Orsak:** Live bekräftat; sidinnehållet ligger i `pages`-tabellen (bootstrap `INSERT OR IGNORE`, SD-17) och e2e:s textkontroll (`tests/e2e.mjs:101-104`) gäller `/grafisk-profil`, inte den sidan. Rättas i Admin → Sidor; "senast granskad" (F-05) skulle fånga nästa.
- **Status:** Obelagd – kräver Admin → Sidor

### R-41 M29:s andra, okopplade volym
- **Källa:** A/M29, Minne (2026-10-31)
- **Påstående:** En lös volym med samma namn kan kopplas in vid `fly machine destroy`/`scale`.
- **Orsak:** Minnesanteckningen från 2026-10-31 nämner vol_491j0dldgmng2x5r som okopplad; Fly-beteendet syns inte i repot (SN-05). Färskt läge kräver `fly volumes list` (inte kört – inga `fly`-kommandon i uppdraget).
- **Status:** Obelagd – kräver `fly volumes list`

### R-42 PDF `inline` under CSP `sandbox` i Safari/iOS
- **Källa:** A/L36
- **Påstående:** Safari visar inte PDF:er under `sandbox`-rubriken.
- **Orsak:** Rubrikerna finns (`src/app/media/[...path]/route.ts:36-37`); beteendet är webbläsarens (SB-24).
- **Status:** Obelagd – kräver Safari/iOS

### R-43 L42/L43: utloggning via listen och utgången kaka
- **Källa:** A/L42, A/L43
- **Påstående:** Utloggningen är en in-app-omdirigering som behåller skalet; en utgången kaka tappar formulärtexten.
- **Orsak:** Kodvägarna finns (SD-29, SD-27) men konsekvensen syns bara i en webbläsare med riktig kaka och tid.
- **Status:** Obelagd – kräver webbläsare

### R-44 "Produktionen använder dessa adresser" (kontonas e-post)
- **Källa:** A/M24, Minne (2026-10-31)
- **Påstående:** Kontona i produktionen har adresserna i `create-accounts.mjs`.
- **Orsak:** Minnesanteckningen säger att skriptet kördes 2026-10-31; live använder dessutom andra alias (U-08). Bekräftelse kräver produktionsdatabasen (SD-11).
- **Status:** Obelagd – kräver produktionsdatabasen

### R-45 SD-36:s kontodel: demokonton och lösenord i produktionen
- **Källa:** NY-1 (SD-36)
- **Påstående:** Demokontona (`scb@`, `ubu@`, `info@`, ev. `admin@`) ligger kvar med seedade eller publika lösenord.
- **Orsak:** Evenemangen och nyheten syns live; kontona syns inte utifrån (U-09).
- **Status:** Obelagd – kräver `SELECT email, role, must_change_password FROM users` i produktionen eller Admin → Konton

### R-46 Ägarskapet: Fly-konto, Name.com, betalkort
- **Källa:** D/rad-20, D/rad-21, D#2
- **Påstående:** Driften och domänen står på en person.
- **Orsak:** Inget i repot säger vem som äger vad (U-01).
- **Status:** Obelagd – kräver Fly- och Name.com-kontona

### R-47 "Safari och Firefox har inte testats i de senaste driftsättningarna"
- **Källa:** D/rad-38, Minne
- **Påstående:** Bara Chromium är provad.
- **Orsak:** e2e kör Chromium (`tests/e2e.mjs:16`) och minnesanteckningen bekräftar; vad som testats för hand syns inte i repot (SN-08, B-8).
- **Status:** Obelagd – kräver körning i WebKit/Firefox

### R-48 "Styrdokumentets PDF har loggorna som pixelbilder"
- **Källa:** D/rad-47, D#7
- **Påstående:** PDF:ens loggor är raster.
- **Orsak:** `grep -a` 2026-11-03: 37 `/Subtype /Image`-objekt och 0 Form-XObjects i `public/brand/download/grafiskt-styrdokument.pdf` – heuristiken stödjer, men vektorbanor kan ligga i sidströmmarna (ST-24, U-03).
- **Status:** Obelagd – kräver PDF-inspektion (t.ex. `pdfimages -list`/`mutool`)

### R-49 Node 22 tappar support i april 2027, Node 24 har support till april 2028
- **Källa:** D/rad-44, D#6
- **Påstående:** EOL-datumen.
- **Orsak:** Extern fakta (nodejs.org/releases); inte något repot kan belägga (NO-01).
- **Status:** Obelagd – kräver nodejs.org

### R-50 `fly deploy` skickar hela arbetskatalogen
- **Källa:** A/M27 (A:413), D#5
- **Påstående:** flyctl packar arbetskatalogen inklusive ocommittade filer.
- **Orsak:** `.dockerignore:1-12` och `Dockerfile:20` (`COPY . .`) visar vad imagen tar med, men hur flyctl bygger kontexten (git-spårat eller allt) är flyctl:s beteende (SN-03).
- **Status:** Obelagd – kräver flyctl-dokumentationen eller ett prov med en ocommittad fil

## 10 Täckningstabell

Varje kanoniskt käll-id ur planerna A–D och varje delpåstående utan eget id, med de block som tar hand om det. Raderna är genererade ur blockens Källa-fält (skript i sessionen 2026-11-03), så tabellen är en avbild av dokumentet, inte en separat lista; id som bara förekommer i avsnitt 7–9 pekar på B-, F-, U- eller R-block. Ett käll-id med flera block är antingen avsiktligt delat (`se <id>` i varje Källa) eller ett beslut/refuterat påstående vid sidan av checklistepunkten.

| Käll-id | Block |
|---|---|
| A/H1 | SN-01, SN-02, B-2, B-3, B-16, R-24, R-25 |
| A/M1 | SD-12, R-30 |
| A/M2 | SB-30, R-32 |
| A/M3 | SD-07 |
| A/M4 | SD-02, B-12, R-33 |
| A/M5 | SD-09, ST-17 |
| A/M6 | SD-16 |
| A/M7 | SB-31, R-29 |
| A/M8 | SB-01 |
| A/M9 | SB-02 |
| A/M10 | NO-01, B-9 |
| A/M11 | SN-06, BE-01, B-8 |
| A/M12 | SD-17, R-20 |
| A/M13 | SB-03, R-18 |
| A/M14 | SD-05, B-15 |
| A/M15 | SB-32, R-21 |
| A/M16 | BE-02, B-4 |
| A/M17 | SD-18, R-27 |
| A/M18 | SD-15 |
| A/M19 | SD-03, R-17 |
| A/M20 | SD-14 |
| A/M21 | SB-04, B-5 |
| A/M22 | SB-05 |
| A/M23 | SD-01, B-6, B-13, R-34 |
| A/M24 | SD-11, R-44 |
| A/M25 | SB-33, R-23 |
| A/M26 | SN-04 |
| A/M27 | SN-02, SN-03, B-1, R-50 |
| A/M28 | SN-07, B-17 |
| A/M29 | SN-05, R-41 |
| A/M30 | SD-04 |
| A/M31 | SD-06 |
| A/M32 | SD-33 |
| A/M33 | SD-34 |
| A/M34 | SD-25 |
| A/M35 | SD-08 |
| A/M36 | SD-35 |
| A/L1 | SD-19, R-26 |
| A/L2 | SD-20 |
| A/L3 | SD-13 |
| A/L4 | SD-21 |
| A/L5 | SD-10, R-31 |
| A/L6 | SB-06 |
| A/L7 | SB-07 |
| A/L8 | SB-08 |
| A/L9 | SB-09 |
| A/L10 | SB-10 |
| A/L11 | ST-18 |
| A/L12 | SB-34, B-14 |
| A/L13 | SD-04 |
| A/L14 | SD-32, B-17, R-15 |
| A/L15 | SB-35 |
| A/L16 | SB-36 |
| A/L17 | SB-37 |
| A/L18 | SB-38 |
| A/L19 | SB-11, SB-12, SB-13, SB-14, SB-15, B-20, R-03 |
| A/L20 | SN-09, ST-19, U-08 |
| A/L21 | SN-10, SB-25, ST-25, R-04 |
| A/L22 | ST-20, U-02 |
| A/L23 | ST-21 |
| A/L24 | SB-16, B-10 |
| A/L25 | ST-22, R-06, R-07 |
| A/L26 | BE-06, R-19 |
| A/L27 | SB-17 |
| A/L28 | SB-18, R-22 |
| A/L29 | SB-20 |
| A/L30 | SB-19 |
| A/L31 | SB-21 |
| A/L32 | SB-22 |
| A/L33 | SB-23 |
| A/L34 | SD-21, ST-17 |
| A/L35 | SD-22, R-13 |
| A/L36 | SB-24, R-42 |
| A/L37 | SN-08 |
| A/L38 | SD-23 |
| A/L39 | SD-24, R-14 |
| A/L40 | SB-34, B-14 |
| A/L41 | SD-26 |
| A/L42 | SD-29, R-43 |
| A/L43 | SD-27, R-43 |
| A/L44 | SD-28, R-05 |
| A/S1 | ST-01, B-7 |
| A/S2 | ST-02 |
| A/S3 | ST-03 |
| A/S4 | ST-04 |
| A/S5 | ST-05 |
| A/S6 | ST-06, R-28 |
| A/S7 | ST-07 |
| A/S8 | ST-08, B-19 |
| A/S9 | ST-27 |
| A/S10 | ST-09 |
| A/S11 | ST-10 |
| A/S12 | ST-11 |
| A/S13 | ST-12, B-14 |
| A/S14 | ST-13 |
| A/S15 | ST-14 |
| A/S16 | ST-15 |
| A/S17 | ST-16 |
| D#1 | SN-01, SN-02, B-2, B-3, B-16, U-07, R-09 |
| D#2 | SN-09, F-03, U-01, R-46 |
| D#3 | SB-04, ST-20, B-5, F-08, U-02 |
| D#4 | SD-09, SD-30 |
| D#5 | SN-03, SN-06, BE-01, BE-02, B-1, B-4, B-8, R-08, R-50 |
| D#6 | NO-01, B-9, R-49 |
| D#7 | ST-23, ST-24, B-19, B-20, U-03, R-10, R-48 |
| D#8 | SD-31, F-04 |
| D#9 | F-05 |
| D#10 | SN-01, SN-07, SD-05, B-15, B-17 |
| B/tre-1 | SB-26, B-11, F-01 |
| B/tre-2 | SD-17, F-04, U-01 |
| B/tre-3 | F-06, R-12 |
| B/småfel-1 | U-08, R-36 |
| B/småfel-2 | R-37 |
| B/småfel-3 | R-38 |
| B/småfel-4 | ST-27, R-39 |
| B/småfel-5 | SD-36, U-09, R-16 |
| B/post | F-02, F-07 |
| B/verktyg-2 | F-06 |
| B/verktyg-3 | F-06 |
| B/verktyg-4 | F-06 |
| B/fragelada | B-7, B-17, F-01 |
| C/fas-1 | B-6, B-7, F-02 |
| C/fas-2 | F-02 |
| C/fas-3 | F-02, U-06 |
| D/rad-30 | F-08 |
| C/rad-11 | SD-31, B-16, F-04 |
| C/rad-57 | B-16 |
| C/rad-62 | B-18 |
| B/rad-31 | F-06 |
| A/rad-430 | SN-07 |
| A/rad-583 | ST-18 |
| A/rad-886 | ST-14 |
| A/rad-966 | NO-01 |
| A/rad-973 | ST-20 |
| A/rad-998 (verifieringslistan A:998–1070) | Verifiering-fälten i avsnitt 1–6, t.ex. SD-07, SD-12, SD-14, SB-01, SB-04, SD-33 |
