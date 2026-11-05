import type { Term } from "@/lib/arshjul";

export interface WheelSuggestion {
  seed_key: string;
  title: string;
  description: string;
  responsible: string;
  month: number | null;
  term: Term | null;
  depends_on: string;
  template: string;
}

const item = (
  seed_key: string,
  title: string,
  month: number | null,
  term: Term | null,
  responsible: string,
  description: string,
  depends_on = "",
  template = "",
): WheelSuggestion => ({ seed_key, title, description, responsible, month, term, depends_on, template });

/**
 * Startuppsättningen bakom "Fyll med förslag": det en studentsektion brukar göra under ett år, med posterna och utskotten i
 * seed-content.ts. Alla månader är en gissning som sektionen själv ändrar. Nyckeln gör att förslaget aldrig läggs in två gånger.
 */
export const WHEEL_SUGGESTIONS: WheelSuggestion[] = [
  // Vårterminen
  item("budget", "Budget för året", 1, null, "Kassör", "Ta fram budgeten och stäm av den med styrelsen inför vårens sektionsmöte."),
  item("varmote", "Sektionsmöte på våren", 3, null, "Sekreterare", "Kallelse, handlingar och protokoll. Verksamhetsberättelsen och bokslutet tas upp här."),
  item("val-nominering", "Valberedning och nomineringar", 3, null, "Vice ordförande", "Annonsera vilka poster som går att söka och prata med dem som är nyfikna.", "Valberedningen och de som söker"),
  item("val", "Val av nästa års styrelse", 4, null, "Ordförande", "Val på sektionsmötet. Boka lokal och se till att kandidaterna hinner presentera sig."),
  item("star-lokal", "STAR: boka lokal och datum", 2, null, "Näringslivsansvarig", "Spika datum tidigt, innan företagen hunnit planera sin höst.", "Campus och företagen", "star"),
  item("varsittning", "Vårsittning", 4, null, "SCB", "Terminens stora sittning med sångbok, tal och anmälan.", "", "sittning"),
  item("overlamning", "Överlämning till nästa styrelse", 5, null, "Ordförande", "Varje post går igenom sin pärm, konton och årshjulet med den som tar över."),
  item("uppgradering", "Webben: uppgraderingar och återställningsövning", 6, null, "Informationsansvarig", "Större uppgraderingar görs i juni när sajten används som minst. Se README, Årshjul."),
  item("lunch-vt", "Lunchföreläsningar på våren", null, "vt", "SASU", "Företag som berättar om jobb och examensarbeten, med lunch.", "Företag som föreläser", "gastforelasning"),
  item("gast-vt", "Gästföreläsning på våren", null, "vt", "UBU", "En föreläsare utanför kurserna, till exempel en alumn. Måste bokas i god tid.", "Gästföreläsaren", "gastforelasning"),
  item("kursutvardering-vt", "Kursutvärderingar på våren", null, "vt", "Utbildningsansvarig", "Samla in vad studenterna tycker och ta det vidare till programmet.", "Programansvariga"),

  // Höstterminen
  item("mottagning-plan", "Mottagningen: schema och faddrar", 6, null, "SCB", "Schemat måste vara klart före sommaren, och faddrarna behöver veta vad som gäller.", "Faddrarna och LiU:s upprop"),
  item("mottagning", "Mottagningen", 8, null, "SCB", "Nya studenter börjar. Overaller, gasque och allt däremellan.", "", "evenemang"),
  item("hostmote", "Sektionsmöte på hösten", 10, null, "Sekreterare", "Kallelse, handlingar och protokoll. Verksamhetsplanen och kompletteringsval tas upp här."),
  item("star", "STAR, arbetsmarknadsdagen", 10, null, "Näringslivsansvarig", "Sektionens största arbetsmarknadsevenemang. Företag, program och mässa.", "Företagen som ställer ut", "star"),
  item("hostsittning", "Höstsittning", 10, null, "SCB", "Mästeriet dukar upp för höstens finaste sittning.", "", "sittning"),
  item("julsittning", "Julsittning", 12, null, "SCB", "Terminens sista sittning, med julbord och snapsvisor.", "", "sittning"),
  item("bokslut", "Halvårskoll av ekonomin", 12, null, "Kassör", "Stäm av mot budgeten och samla ihop kvitton före årsskiftet."),
  item("lunch-ht", "Lunchföreläsningar på hösten", null, "ht", "SASU", "Företag som berättar om jobb och examensarbeten, med lunch.", "Företag som föreläser", "gastforelasning"),
  item("gast-ht", "Gästföreläsning på hösten", null, "ht", "UBU", "En föreläsare utanför kurserna, till exempel en alumn. Måste bokas i god tid.", "Gästföreläsaren", "gastforelasning"),
  item("kursutvardering-ht", "Kursutvärderingar på hösten", null, "ht", "Utbildningsansvarig", "Samla in vad studenterna tycker och ta det vidare till programmet.", "Programansvariga"),
];
