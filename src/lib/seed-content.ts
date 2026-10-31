/**
 * Standardinnehåll som läggs in vid första start. Allt går att redigera i adminpanelen.
 * Utskott, förkortningar och loggor kommer från StatLins grafiska styrdokument.
 */

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

export const STAR_COPY = {
  title: "STAR",
  subtitle: "StatLins Arbetsmarknadsdag",
  text: "Sektionens största arbetsmarknadsrelaterade evenemang, arrangerat av SASU och SCB:s sponsoransvariga. Träffa företag, hitta exjobb och se vart statistiken kan ta dig.",
};
