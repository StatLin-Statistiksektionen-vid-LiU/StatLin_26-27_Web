/**
 * Standardinnehåll som läggs in vid första start. Allt går att redigera i adminpanelen.
 * Utskott, förkortningar och loggor kommer från StatLins grafiska styrdokument.
 */
import type { LinkCategory } from "./types";

export const SEED_COMMITTEES = [
  {
    slug: "styrelsen",
    name: "Styrelsen",
    short_name: "Styrelsen",
    kind: "styrelse",
    logo_url: "/brand/statlin.svg",
    accent: "#ff0707",
    email: "styrelsen@statlin.se",
    tagline: "Leder sektionen och företräder statistikstudenterna i Linköping.",
    description_md: `Styrelsen ansvarar för sektionens löpande verksamhet, ekonomi och långsiktiga riktning. Vi företräder statistikstudenterna gentemot universitetet, kåren och näringslivet – och ser till att alla utskott har det de behöver för att göra studietiden bättre.

Styrelsen väljs på sektionsmötet och sitter ett verksamhetsår. Vill du engagera dig, har en idé eller bara undrar något? Hör av dig eller kom förbi på ett styrelsemöte.`,
  },
  {
    slug: "ubu",
    name: "Utbildningsutskottet",
    short_name: "UBU",
    kind: "utskott",
    logo_url: "/brand/utskott/ubu.webp",
    accent: "#2e7d32",
    email: "ubu@statlin.se",
    tagline: "Bevakar utbildningens kvalitet och studenternas intressen.",
    description_md: `UBU är StatLins utbildningsbevakande utskott. Vi samlar in synpunkter på kurser och undervisning, sitter med i programråd och ser till att statistikstudenternas röst hörs när utbildningen utvecklas.

**Vi hjälper dig med**
- Frågor om kurser, examination och studiegång
- Kursutvärderingar och återkoppling till lärare
- Kontakt med programansvariga och studievägledning

Trädet i vår logga – fem grenar som förgrenar sig i många små – står för hur utbildningen växer åt flera håll.`,
  },
  {
    slug: "sasu",
    name: "StatLins Arbetssociala Utskott",
    short_name: "SASU",
    kind: "utskott",
    logo_url: "/brand/utskott/sasu.webp",
    accent: "#ff0707",
    email: "sasu@statlin.se",
    tagline: "Bygger broar mellan statistikstudenter och arbetslivet.",
    description_md: `SASU knyter ihop studenterna med framtida arbetsgivare. Vi anordnar lunchföreläsningar, case-kvällar och företagsbesök – och tillsammans med SCB:s sponsoransvariga står vi bakom **STAR**, StatLins arbetsmarknadsdag.

Loggans sju prickar sammanlänkade i ett nätverk symboliserar just det: kontakter som leder vidare.`,
  },
  {
    slug: "scb",
    name: "StatLins Centrala Bärseri",
    short_name: "SCB",
    kind: "utskott",
    logo_url: "/brand/utskott/scb.webp",
    accent: "#d5252b",
    email: "scb@statlin.se",
    tagline: "Sektionsmästeriet – sittningar, fester och gemenskap.",
    description_md: `SCB är StatLins studiesociala utskott, sektionsmästeriet. Vi ordnar sittningar, sektionsfester och allt däremellan som gör att man lär känna sina kursare på riktigt.

Du känner igen oss på mästeristassen: svarta hängselbyxor med röda uppslag, röd fluga och röd-svart-randiga strumpor. Gamla mästerimedlemmar kallas för **XCB**.`,
  },
  {
    slug: "statpub",
    name: "StatLins Pubutskott",
    short_name: "StatPub",
    kind: "utskott",
    logo_url: "/brand/utskott/statpub.webp",
    accent: "#e8a33d",
    email: "statpub@statlin.se",
    tagline: "Pubkvällar för hela sektionen.",
    description_md: `StatPub håller i sektionens pubverksamhet – från lugna afterworks till temapubar som folk pratar om i veckor. Alla är välkomna, oavsett om du dricker öl, alkoholfritt eller bara kommer för sällskapet.`,
  },
  {
    slug: "stig",
    name: "StatLins Idrottsgrupp",
    short_name: "STIG",
    kind: "utskott",
    logo_url: "/brand/utskott/stig.webp",
    accent: "#111111",
    email: "stig@statlin.se",
    tagline: "Fotboll, innebandy och allt som får pulsen att stiga.",
    description_md: `STIG samlar sektionen kring idrott. Vi bokar hallar, ställer upp i korpen och ordnar prova-på-aktiviteter. Ingen förkunskap krävs – det viktiga är att det är kul.`,
  },
  {
    slug: "estig",
    name: "StatLins e-Idrottsgrupp",
    short_name: "eSTIG",
    kind: "utskott",
    logo_url: "/brand/utskott/estig.webp",
    accent: "#2e3192",
    email: "estig@statlin.se",
    tagline: "LAN, turneringar och spelkvällar.",
    description_md: `eSTIG är StatLins e-idrottsgrupp. Vi ordnar LAN, turneringar och spelkvällar – från tävlingsinriktat till sällskapsspel. Tetrisbitarna i loggan säger det mesta.`,
  },
  {
    slug: "amo",
    name: "Arbetsmiljöombud",
    short_name: "AMO",
    kind: "ovrigt",
    logo_url: "/brand/utskott/amo.webp",
    accent: "#111111",
    email: "amo@statlin.se",
    tagline: "Studiemiljö och trivsel – för alla.",
    description_md: `Arbetsmiljöombudet arbetar för en trygg och inkluderande studiemiljö, både i studierna och i sektionens verksamhet. Har du upplevt något som inte känns okej? Hör av dig – du kan alltid vara anonym.`,
  },
] as const;

export const SEED_BOARD = [
  { post: "Ordförande", email: "ordforande@statlin.se", committee: "styrelsen", bio: "Leder styrelsen och sektionens arbete. Kontaktperson mot universitet och kår." },
  { post: "Vice ordförande", email: "vice@statlin.se", committee: "styrelsen", bio: "Ordförandens högra hand och sammanhållande för utskotten." },
  { post: "Kassör", email: "kassor@statlin.se", committee: "styrelsen", bio: "Ansvarar för sektionens ekonomi, budget och bokföring." },
  { post: "Sekreterare", email: "sekreterare@statlin.se", committee: "styrelsen", bio: "För protokoll och håller ordning på sektionens dokument." },
  { post: "Informationsansvarig", email: "info@statlin.se", committee: "styrelsen", bio: "Sköter webb, sociala medier och sektionens kommunikation." },
  { post: "Utbildningsansvarig", email: "ubu@statlin.se", committee: "ubu", bio: "Ordförande i UBU och studenternas röst i utbildningsfrågor." },
  { post: "Näringslivsansvarig", email: "sasu@statlin.se", committee: "sasu", bio: "Ordförande i SASU och projektledare för STAR." },
  { post: "Ordförande SCB", email: "scb@statlin.se", committee: "scb", bio: "Leder sektionsmästeriet StatLins Centrala Bärseri." },
] as const;

export const SEED_PAGES: { slug: string; title: string; lead: string; body_md: string }[] = [
  {
    slug: "om",
    title: "Om *StatLin*",
    lead: "StatLin – Statistiksektionen i Linköping – är sektionen för alla som läser statistik vid Linköpings universitet.",
    body_md: `## Vad gör en sektion?

En sektion är studenternas egen förening på programmet. Vi ordnar det sociala – sittningar, pubar, idrott och spelkvällar – men också det som påverkar själva utbildningen: studiebevakning, kursutvärderingar och kontakt med arbetslivet. Allt drivs ideellt av studenter.

## Grupperingar och gemenskap

> Statistikstudenten vet mycket om grupperingar, både vad som skiljer dem åt och vad som för dem samman.

Det står i vårt grafiska styrdokument, och det sammanfattar sektionen ganska bra. StatLin är liten nog för att alla ska känna igen varandra, men tillräckligt stor för att det alltid ska hända något. Gamla och nya medlemmar delar samma symboler – den rödsvarta overallen, loggan och traditionerna.

## Engagera dig

Det enklaste sättet att engagera sig är att dyka upp på ett evenemang. Vill du göra mer finns det plats i alla utskott, och varje år väljs en ny styrelse på sektionsmötet. Ingen erfarenhet krävs – bara lust.

## Namnet

StatLin står för *Statistiksektionen i Linköping* och skrivs med versalt S och L. Förkortningarna StLn, StL, SL och S förekommer också.`,
  },
  {
    slug: "lankar",
    title: "Länkar",
    lead: "Schema, tentor, Lisam och allt annat du behöver under studietiden – samlat på ett ställe. Fäst dina favoriter med stjärnan så hamnar de överst.",
    body_md: "",
  },
  {
    slug: "hjalpmedel",
    title: "Hjälp*medel*",
    lead: "Fusklappar, GitHub-länkar och guider till kandidaten och mastern, sorterade på årskurs och termin.",
    body_md: "",
  },
  {
    slug: "ny-student",
    title: "Ny student",
    lead: "Grattis till platsen! Här är allt du behöver veta inför starten – på kandidaten eller mastern.",
    body_md: `## Mottagningen

De första veckorna är fyllda av aktiviteter där du lär känna dina kursare, äldre studenter och Linköping. Allt är frivilligt och det finns alltid alkoholfria alternativ. Schemat publiceras under **Evenemang** och i våra kanaler i god tid innan terminsstart.

## Overallen

Statistikstudenter bär **svart overall med röda revärer** – från halsen längs ärmarna och längs benens utsida. Ditt namn eller smeknamn sys på i rött tyg, och sektionsloggan sitter i sin inverterade form på ryggen. Du får veta hur du beställer under mottagningen.

## Vanliga frågor

<details><summary>Måste jag vara med på allt under mottagningen?</summary>

Nej. Allt är frivilligt och du väljer själv vad du vill vara med på. Det viktigaste är att du trivs.
</details>

<details><summary>Kostar det något att vara medlem?</summary>

Information om medlemskap och eventuell avgift får du av styrelsen. Hör av dig om du är osäker.
</details>

<details><summary>Var hittar jag schema och kursinformation?</summary>

Schema och kursinformation finns hos Linköpings universitet. UBU hjälper gärna till om något är oklart.
</details>

<details><summary>Vem kan jag prata med om jag inte mår bra?</summary>

Prata med någon du litar på i sektionen, vårt arbetsmiljöombud eller universitetets studenthälsa. Du är aldrig ensam.
</details>`,
  },
  {
    slug: "utbildning",
    title: "Kandidat",
    lead: "Statistik och dataanalys vid Linköpings universitet – och hur sektionen hjälper dig genom studierna.",
    body_md: `## Programmet

**Statistik och dataanalys, kandidatprogram (180 hp)** ges på Campus Valla och leder till en filosofie kandidatexamen med statistik som huvudområde. Programmet blandar matematik och statistisk teori med programmering, maskininlärning och tillämpade projekt mot verkliga data.

För dig som vill vidare finns masterprogrammet **Statistics and Machine Learning** vid samma universitet.

## Studiebevakning

Utbildningsutskottet (UBU) bevakar att utbildningen håller hög kvalitet. Vi sammanställer synpunkter, deltar i programråd och följer upp kursutvärderingar tillsammans med lärarna.

- **Har du synpunkter på en kurs?** Kontakta UBU – vi tar det vidare, anonymt om du vill.
- **Kursutvärderingar** är det viktigaste verktyget för att förbättra kurser. Fyll i dem!
- **Studievägledning** finns på universitetet för frågor om studieplanering och behörighet.

## Hjälp och stöd

Universitetet erbjuder studenthälsa, studieverkstad och stöd vid funktionsnedsättning. Hör av dig till oss om du inte vet vart du ska vända dig – vi hjälper dig att hitta rätt.`,
  },
  {
    slug: "master",
    title: "Master",
    lead: "Läser du Statistics and Machine Learning? StatLin är din sektion också – här är det viktigaste för att komma igång.",
    body_md: `## Programmet

**Statistics and Machine Learning (120 hp)** är ett tvåårigt masterprogram vid Linköpings universitet som ges helt på engelska. Det bygger vidare på statistik, maskininlärning och programmering, och många av studenterna kommer från andra universitet och länder.

## StatLin är till för båda programmen

Sektionen representerar kandidat- och masterstudenterna lika mycket. Alla evenemang är öppna för dig, och vi byter gärna till engelska.

- **Kom på ett evenemang.** Allt vi ordnar finns i kalendern.
- **Prata med vår masteransvariga** i styrelsen om du har frågor eller idéer för masterstudenterna.
- **Engagera dig** i ett utskott – fester, idrott, spel, karriär eller utbildning.

## Frågor om studierna?

UBU bevakar kvaliteten i båda programmen. Kontakta dem om kurser, examination eller studiemiljö – anonymt om du vill.`,
  },
  {
    slug: "foretag",
    title: "För företag",
    lead: "Nå Linköpings statistik- och data-studenter – framtidens analytiker, data scientists och statistiker.",
    body_md: `## Varför StatLin?

Våra medlemmar läser statistik, programmering och maskininlärning och möter arbetslivet med både teoretiskt djup och praktisk erfarenhet av riktiga data. Vi är en liten sektion – vilket betyder att ni når rätt personer, inte en anonym massa.

## Det här kan vi göra tillsammans

- **STAR – StatLins arbetsmarknadsdag.** Sektionens största arbetsmarknadsevenemang.
- **Lunchföreläsningar och case-kvällar** där studenterna får prova på era verkliga problem.
- **Exjobb, praktik och sommarjobb** som vi sprider i våra kanaler.
- **Profilkläder.** Sponsorloggor kan tryckas längs ärmarna på styrelsens och mästeriets hoodies.

## Kontakt

Hör av er till vår näringslivsansvariga i SASU så tar vi fram ett upplägg som passar er.`,
  },
  {
    slug: "kontakt",
    title: "Kontakt",
    lead: "Frågor, idéer eller samarbeten? Vi svarar så snabbt vi kan.",
    body_md: `Skriv till rätt person i styrelsen nedan, eller använd den allmänna adressen om du är osäker på vem du ska vända dig till.`,
  },
  // Engelska sidor för masterprogrammet (som ges på engelska) och andra som inte läser svenska.
  {
    slug: "en",
    title: "StatLin in English",
    lead: "StatLin is the student association for everyone who studies statistics at Linköping University – on the bachelor's programme Statistik och dataanalys and the master's programme Statistics and Machine Learning.",
    body_md: `## What we do

StatLin – *Statistiksektionen i Linköping* – is run entirely by students, on a voluntary basis. We take care of the social side of student life, from sittnings (formal student dinners) and pubs to sports and game nights. We also work on the education itself: following up on course quality, passing on student feedback and connecting students with future employers.

## Everyone is welcome

You are part of StatLin whether you speak Swedish or not. Most of our events are open to everyone in the section. If an event description is in Swedish, just ask the organisers – most of us are happy to switch to English.

## Get involved

The easiest way to get involved is to turn up at an event. If you want to do more, every committee welcomes new members, and a new board is elected at the section meeting every year. No experience needed.`,
  },
  {
    slug: "en-masters",
    title: "Master's students",
    lead: "Studying Statistics and Machine Learning at LiU? StatLin is your student association too – here is how to get started.",
    body_md: `## Welcome

The master's programme Statistics and Machine Learning is a two-year programme taught in English. Whether you did your bachelor's here or are new to Linköping, StatLin is a good way to meet people from both programmes.

## Your first weeks

- **Come to an event.** Everything we organise is in the calendar, and you can add it to your phone so you never miss anything.
- **Say hi to the board.** You will find everyone's e-mail address on the contact page.
- **Join a committee** if you want to organise things yourself – parties, sports, gaming, careers or education.

## Questions about your studies?

UBU, our education committee, works for the quality of both programmes. Contact them about courses, exams or your study environment – anonymously if you prefer.

For housing, residence permits and other practical matters, Linköping University's support for international students is the best place to start.`,
  },
];

/* ---------- Länksidan (/studenter/lankar) ---------- */

type SeedLink = { label: string; description: string; url: string; category: LinkCategory; keywords?: string; icon?: string; featured?: boolean };

/**
 * Grundlänkar för studenterna. Genvägarna (featured) är samma vanliga länkar som Tenuil har överst.
 * Läggs in en gång – sedan ändras de under Admin → Länkar.
 */
export const SEED_LINKS: SeedLink[] = [
  // Genvägar
  { label: "Schema", description: "TimeEdit för kurser och program", url: "https://cloud.timeedit.net/liu/web/schema/ri1Q7.html", category: "studier", keywords: "timeedit kalender schema", icon: "calendar", featured: true },
  { label: "Boka rum", description: "Grupprum och lokaler i TimeEdit", url: "https://cloud.timeedit.net/liu/web/wr_stud/", category: "campus", keywords: "grupprum lokal boka", icon: "door", featured: true },
  { label: "Karta", description: "Hitta salen på campus i MazeMap", url: "https://use.mazemap.com/#v=1&config=liu&zlevel=2&center=15.576769,58.398512&zoom=15.1&campusid=742", category: "campus", keywords: "mazemap campus sal lokal hitta", icon: "map", featured: true },
  { label: "Skriva ut", description: "Utskrift, kopiering och skanning", url: "https://print.liu.se/", category: "it", keywords: "papercut skanna kopiera skrivare", icon: "printer", featured: true },
  { label: "Tentamensanmälan", description: "Anmäl dig till tentor i Lisam", url: "https://liuonline.sharepoint.com/sites/Lisam/SitePages/Tentamensanm%C3%A4lan.aspx", category: "tentor", keywords: "tentaanmälan anmälan tenta", icon: "pen", featured: true },
  { label: "E-post", description: "LiU-mejlen i Outlook", url: "https://outlook.office.com/mail/", category: "it", keywords: "outlook epost mejl mail", icon: "mail", featured: true },
  { label: "Tentastatistik", description: "Betyg per tentatillfälle – sök på kurskod", url: "/tentastatistik", category: "tentor", keywords: "betyg statistik godkända underkända", icon: "chart", featured: true },
  // Studier
  { label: "Kursrum (Lisam)", description: "Material och inlämningar för dina kurser", url: "https://liuonline.sharepoint.com/sites/Lisam/SitePages/Kurser-och-program.aspx", category: "studier", keywords: "lisam kurssida kursrum inlämning" },
  { label: "Kursregistrering (Ladok)", description: "Registrera dig på terminens kurser", url: "https://www.student.ladok.se/student/app/studentwebb/", category: "studier", keywords: "ladok registrera kurs" },
  { label: "Studieresultat (Ladok)", description: "Betyg och avklarade poäng", url: "https://www.student.ladok.se/student/app/studentwebb/min-utbildning/alla", category: "studier", keywords: "resultat poäng betyg hp" },
  { label: "Intyg (Ladok)", description: "Registrerings- och resultatintyg", url: "https://www.student.ladok.se/student/app/studentwebb/intyg", category: "studier", keywords: "registreringsintyg resultatintyg csn" },
  { label: "Kurs- och programinfo", description: "Kursplaner och programplaner i Studieinfo", url: "https://studieinfo.liu.se/", category: "studier", keywords: "kursplan programplan studieinfo" },
  { label: "Terminstider", description: "När terminer och läsperioder börjar och slutar", url: "https://liu.se/artikel/terminstider", category: "studier", keywords: "läsperiod terminstart ledighet" },
  { label: "Teams", description: "Möten och kurskanaler", url: "https://teams.microsoft.com/", category: "studier", keywords: "microsoft teams möte" },
  // Tentor
  { label: "Tentamenstillfällen", description: "När och var går tentan?", url: "https://talprod2.it.liu.se/tentasearch/", category: "tentor", keywords: "tentaschema tentadatum sal" },
  { label: "Hämta rättad tenta", description: "Så får du tillbaka din tenta", url: "https://liuonline.sharepoint.com/sites/student-under-studietiden/SitePages/hamta-rattad-tenta.aspx", category: "tentor", keywords: "rättad tenta hämta" },
  { label: "Tentastatistik hos liustats", description: "Studentdriven statistik över tentaresultat", url: "https://liustats.se/", category: "tentor", keywords: "statistik betyg" },
  { label: "Tentastatistik (LiU, officiell)", description: "LiU:s egen sammanställning i Lisam", url: "https://liuonline.sharepoint.com/sites/Lisam/SitePages/Tentamenstatistik.aspx", category: "tentor", keywords: "statistik betyg officiell" },
  { label: "Tentaarkiv (IDA)", description: "Gamla tentor, kräver LiU-inloggning", url: "https://www.ida.liu.se/edu/ugrad/office/old_exams/", category: "tentor", keywords: "gamla tentor arkiv" },
  { label: "Tentaarkiv (liutentor)", description: "Studentdrivet arkiv med gamla tentor", url: "https://liutentor.se/", category: "tentor", keywords: "gamla tentor arkiv" },
  { label: "Omprövning av betyg", description: "Rättelse eller omprövning av ett betygsbeslut", url: "https://liuonline.sharepoint.com/sites/student-rattigheter-och-skyldigheter/SitePages/Rattelse-eller-omprovning-av-betygsbeslut.aspx", category: "tentor", keywords: "överklaga rättelse ompröva" },
  { label: "Kursutvärderingar (Evaliuate)", description: "Vad tyckte tidigare studenter om kursen?", url: "https://admin.evaliuate.liu.se/search?lang=sv", category: "tentor", keywords: "evaliuate utvärdering" },
  // IT
  { label: "Min IT", description: "Ditt LiU-konto och lösenord", url: "https://minit.liu.se/", category: "it", keywords: "konto lösenord liu-id" },
  { label: "Eduroam", description: "Wifi på campus", url: "https://minit.liu.se/myaccounts/Eduroam", category: "it", keywords: "wifi nätverk internet" },
  { label: "Mjukvara", description: "Program du kan installera, t.ex. R och Office", url: "https://minit.liu.se/applications", category: "it", keywords: "program installera r rstudio office matlab" },
  { label: "Overleaf (LaTeX)", description: "LiU:s Overleaf för rapporter och uppsatser", url: "https://latex-online.liu.se/", category: "it", keywords: "latex rapport uppsats overleaf" },
  { label: "Driftinfo", description: "Störningar i LiU:s IT-system", url: "https://status.liu.se/", category: "it", keywords: "driftstörning status nere" },
  { label: "Fjärranslutning", description: "Logga in på LiU:s datorer hemifrån", url: "https://liuonline.sharepoint.com/sites/student-under-studietiden/SitePages/Fjarrinloggning.aspx", category: "it", keywords: "remote rdp thinlinc vpn" },
  // Campus
  { label: "Biblioteket", description: "Lån, studieplatser och hjälp med sökning", url: "https://liuonline.sharepoint.com/sites/student-under-studietiden/SitePages/Biblioteket.aspx", category: "campus", keywords: "bibliotek låna böcker" },
  { label: "Databaser", description: "Artiklar och e-böcker via biblioteket", url: "https://liu.se/biblioteket/databaser", category: "campus", keywords: "artiklar e-böcker vetenskapliga" },
  { label: "Öppettider", description: "När lokalerna på campus är öppna", url: "https://liuonline.sharepoint.com/sites/student-campus-och-lokaler/SitePages/oppettider.aspx", category: "campus", keywords: "öppet lokaler kväll helg" },
  { label: "Felanmälan", description: "Något trasigt i en lokal?", url: "https://felanmalan.liu.se/", category: "campus", keywords: "trasig fel lokal" },
  { label: "Campusbussen", description: "Tidtabell och biljett mellan campus", url: "https://bussen.it.liu.se/ticketing/", category: "campus", keywords: "buss norrköping campus" },
  // Stöd
  { label: "Infocenter och helpdesk", description: "Frågor om studier, konton och lokaler", url: "https://liuonline.sharepoint.com/sites/student-stod-och-kontakt/SitePages/Home.aspx", category: "stod", keywords: "hjälp kontakt support" },
  { label: "Studievägledning", description: "Hjälp att planera dina studier", url: "https://liuonline.sharepoint.com/sites/student-stod-och-kontakt/SitePages/studievagledning.aspx", category: "stod", keywords: "vägledning studieplan" },
  { label: "Studenthälsan", description: "Stöd för hälsa och mående", url: "https://liuonline.sharepoint.com/sites/student-stod-och-kontakt/SitePages/Studenthalsan.aspx", category: "stod", keywords: "hälsa stress kurator" },
  { label: "Språkverkstaden", description: "Hjälp med att skriva rapporter och uppsatser", url: "https://liuonline.sharepoint.com/sites/student-stod-och-kontakt/SitePages/Sprakstod-svenska.aspx", category: "stod", keywords: "skriva språk handledning" },
  { label: "StuFF", description: "Studentkåren för filosofiska fakulteten", url: "https://stuff.liu.se/", category: "stod", keywords: "studentkår kår" },
  // StatLin
  { label: "Hjälpmedel", description: "Fusklappar, GitHub-länkar och guider per program", url: "/studenter/hjalpmedel", category: "statlin", keywords: "fusklapp formelblad github kod guide" },
  { label: "UBU – studiebevakning", description: "Problem med en kurs? Säg till, gärna anonymt", url: "/utskott/ubu", category: "statlin", keywords: "studiebevakning klagomål kurs utbildning" },
  { label: "Evenemang", description: "Allt StatLin ordnar", url: "/evenemang", category: "statlin", keywords: "event sittning pub" },
  { label: "Kalenderflöde", description: "Prenumerera på evenemangen i din kalender", url: "/kalender.ics", category: "statlin", keywords: "ical ics kalender prenumerera" },
  { label: "Dokument", description: "Stadgar, protokoll och styrdokument", url: "/dokument", category: "statlin", keywords: "stadgar protokoll" },
  { label: "Ännu fler LiU-länkar", description: "Tenuil samlar nästan allt för LiU-studenter", url: "https://tenuil.com/", category: "statlin", keywords: "tenuil länkar" },
];

export const STAR_COPY = {
  title: "STAR",
  subtitle: "StatLins Arbetsmarknadsdag",
  text: "Sektionens största arbetsmarknadsrelaterade evenemang, arrangerat av SASU och SCB:s sponsoransvariga. Träffa företag, hitta exjobb och se vart statistiken kan ta dig.",
};
