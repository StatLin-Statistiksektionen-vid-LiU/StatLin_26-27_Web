/**
 * Projektplanernas mallar. De är konstanter och inte databasrader: en mall ändras i koden, och det som skapats av den ändras i planen.
 * weeks är antalet veckor före planens datum, och 0 är samma dag. Negativa tal ligger efter datumet.
 */
import { addDaysLocal } from "@/lib/dates";

export interface PlanTemplateStep {
  title: string;
  description: string;
  weeks: number;
}

export interface PlanTemplate {
  key: string;
  name: string;
  summary: string;
  steps: PlanTemplateStep[];
}

const step = (weeks: number, title: string, description: string): PlanTemplateStep => ({ weeks, title, description });

export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    key: "evenemang",
    name: "Evenemang",
    summary: "Pub, spelkväll eller turnering: det mesta som inte har en egen mall.",
    steps: [
      step(6, "Bestäm datum och ansvariga", "Kolla krockar med tentor och andra evenemang i kalendern."),
      step(5, "Boka lokal", "Boka lokalen och fråga vad som ingår."),
      step(4, "Sätt budget", "Vad får det kosta, och vem betalar? Stäm av med kassören."),
      step(3, "Beställ affisch och omslag", "Lägg ett uppdrag till grafiskt ansvarig."),
      step(2, "Lägg upp evenemanget på sajten", "Publicera med plats, tid och pris."),
      step(1, "Påminn i sociala medier", "Inlägg en vecka före, och ett till samma dag."),
      step(0, "Genomför", "Ta bilder till galleriet."),
      step(-1, "Följ upp och skriv lärdomar", "Stäm av mot budgeten och skriv lärdomar till nästa år."),
    ],
  },
  {
    key: "star",
    name: "Arbetsmarknadsdag (STAR)",
    summary: "Företag, mässa och program. Börja tidigt, företagen planerar långt i förväg.",
    steps: [
      step(26, "Boka lokal och spika datum", "Campus bokas snabbt. Stäm av datumet mot tentaperioderna."),
      step(24, "Sätt budget och pris för företag", "Utgå från förra årets utfall. Stäm av med kassören."),
      step(20, "Skicka inbjudan till företag", "Börja med förra årets utställare och företagsregistret."),
      step(14, "Bestäm programmet", "Lunchpanel, CV-granskning och mingel."),
      step(10, "Bekräfta företag och skicka fakturor", "Kassören fakturerar när företagen bekräftat."),
      step(8, "Beställ grafiskt material", "Affischer, program och skyltar till grafiskt ansvarig."),
      step(6, "Lägg upp evenemanget och informera studenter", "Publicera på sajten och berätta i Veckans StatLin."),
      step(4, "Boka mat och fika", "Antal, specialkost och leverans."),
      step(2, "Rekrytera funktionärer", "Passlista för uppbyggnad, värdar och nedplock."),
      step(1, "Skicka praktisk information till företagen", "Tider, plats, parkering och kontaktperson."),
      step(0, "Genomför STAR", "Ta bilder och samla in vad företagen tyckte."),
      step(-2, "Tacka, följ upp och skriv lärdomar", "Tacka företagen, stäm av ekonomin och uppdatera företagsregistret."),
    ],
  },
  {
    key: "sittning",
    name: "Sittning",
    summary: "Anmälan, mat, sångbok och toastmaster.",
    steps: [
      step(10, "Boka lokal", "Sittningslokaler går åt tidigt, särskilt före jul."),
      step(8, "Sätt tema, meny och budget", "Räkna fram ett pris. Glöm inte alkoholfritt paket."),
      step(6, "Boka toastmaster och underhållning", "Fråga i god tid."),
      step(4, "Öppna anmälan", "Med pris, klädkod och specialkost."),
      step(3, "Beställ affisch och omslag", "Lägg ett uppdrag till grafiskt ansvarig."),
      step(2, "Handla och beställ mat", "Stäm av specialkosten mot anmälningarna."),
      step(1, "Skriv bordsplacering och tryck sångböcker", "Skicka praktisk information till alla anmälda."),
      step(0, "Genomför sittningen", "Dukning, servering och städning."),
      step(-1, "Följ upp, radera specialkost och skriv lärdomar", "Allergiuppgifter sparas inte efteråt. Stäm av mot budgeten."),
    ],
  },
  {
    key: "gastforelasning",
    name: "Gästföreläsning",
    summary: "En föreläsare utifrån som måste bokas i god tid.",
    steps: [
      step(10, "Bestäm ämne och önskad talare", "Fråga programmet och alumner vem som vore intressant."),
      step(8, "Boka talaren", "Bekräfta datum, ämne och eventuell ersättning."),
      step(6, "Boka sal", "Med projektor och ljud som fungerar."),
      step(4, "Lägg upp evenemanget på sajten", "Publicera med ämne, talare och sal."),
      step(2, "Informera i kurser och sociala medier", "Fråga lärare om det går att säga något på en föreläsning."),
      step(1, "Bekräfta med talaren", "Tid, plats, parkering och tekniken."),
      step(0, "Genomför föreläsningen", "Någon möter talaren och presenterar. Lunch eller fika om det ingår."),
      step(-1, "Tacka och skriv lärdomar", "Hur många kom? Vill vi ha samma talare igen?"),
    ],
  },
];

export const planTemplate = (key: string) => PLAN_TEMPLATES.find((t) => t.key === key);

export const stepDate = (planDate: string, weeks: number) => addDaysLocal(planDate, -7 * weeks).slice(0, 10);

/** Antal hela veckor från ett steg till planens datum: 8 är åtta veckor före och -1 en vecka efter. */
export function weeksBefore(planDate: string, due: string): number {
  return Math.round((Date.parse(`${planDate}T00:00:00Z`) - Date.parse(`${due}T00:00:00Z`)) / (7 * 86_400_000));
}

/** Giltigt datum, "YYYY-MM-DD", som finns i kalendern. */
export function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}
