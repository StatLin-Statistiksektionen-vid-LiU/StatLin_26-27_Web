"use client";

import { useState } from "react";
import { parts } from "@/lib/dates";
import {
  MIN_RESULTS,
  formatPercent,
  gradeColors,
  mergeGradeOrder,
  primaryModule,
  summarizeModule,
  visibleOccasions,
  type ExamOccasion,
  type ExamStats,
} from "@/lib/exam-stats";
import { cn } from "@/lib/utils";

/** Så många tillfällen visas innan "Visa alla". Är det bara några få till visas alla direkt. */
const FIRST_ROWS = 12;
const SHOW_ALL_UP_TO = 15;

/** Datum, stapel och andel godkända – samma kolumner i rubrikraden och på varje rad. */
const ROW =
  "grid cursor-default grid-cols-[4.75rem_minmax(0,1fr)_5.75rem] items-center gap-3 px-2 py-1.5 sm:grid-cols-[6.5rem_minmax(0,1fr)_7.5rem] sm:px-3";

const shortDate = (date: string) => {
  const p = parts(date);
  return `${p.day} ${p.monthShort} ${p.year}`;
};

/**
 * Betygen per tentatillfälle: en 100 %-stapel per tillfälle, nyast först, med andelen godkända och
 * antalet skrivande bredvid. Hovra eller tabba till en rad för exakta siffror; tabellvyn visar allt
 * utan diagram. Mönstret följer dataviz-skillen: tunna staplar, 2 px mellanrum mellan betygen,
 * teckenförklaring och en tabell som tvilling.
 */
export function ExamChart({ stats, today }: { stats: ExamStats; today: string }) {
  const now = new Date(today);
  const primary = primaryModule(stats, now);
  const modules = stats.modules
    .filter((m) => visibleOccasions(m).length > 0)
    .sort((a, b) => Number(b.code === primary?.code) - Number(a.code === primary?.code));
  const [moduleCode, setModuleCode] = useState(primary?.code ?? modules[0]?.code);
  const [view, setView] = useState<"chart" | "table">("chart");
  const [showAll, setShowAll] = useState(false);
  const [tip, setTip] = useState<{ index: number; top: number } | null>(null);

  const m = modules.find((x) => x.code === moduleCode) ?? modules[0];
  if (!m) return null;
  const occasions = visibleOccasions(m);
  const hidden = m.occasions.length - occasions.length;
  const collapsible = occasions.length > SHOW_ALL_UP_TO;
  const rows = showAll || !collapsible ? occasions : occasions.slice(0, FIRST_ROWS);
  // Samma färg för ett betyg på alla rader, även på tillfällen där inte alla betyg förekommer.
  const order = mergeGradeOrder(occasions.map((o) => o.grades.map((g) => g.grade)));
  const palette = gradeColors(order);
  const color = new Map(order.map((g, i) => [g, palette[i]]));
  const summary = summarizeModule(m, now);
  // Kurser som inte getts på tre år visar i stället åren nyckeltalen bygger på.
  const [fromYear, toYear] = summary ? [summary.from.slice(0, 4), summary.to.slice(0, 4)] : ["", ""];
  const period = summary?.recent ? "de senaste tre åren" : fromYear === toYear ? fromYear : `${fromYear}–${toYear}`;
  const active = tip ? rows[tip.index] : null;

  return (
    <div>
      {modules.length > 1 && (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Moment">
          {modules.map((x) => (
            <button
              key={x.code}
              type="button"
              aria-pressed={x.code === m.code}
              onClick={() => {
                setModuleCode(x.code);
                setTip(null);
                setShowAll(false);
              }}
              className={cn(
                "h-10 rounded-full border px-4 text-sm font-semibold transition-colors",
                x.code === m.code ? "border-ink bg-ink text-white" : "border-ink/15 bg-white text-ink hover:border-ink",
              )}
            >
              {x.title} <span className={cn("ml-1 font-mono text-xs", x.code === m.code ? "text-white/60" : "text-stone")}>{x.code}</span>
            </button>
          ))}
        </div>
      )}

      {summary && (
        <dl className="mt-8 grid grid-cols-2 overflow-hidden rounded-[1.5rem] border border-ink/10 bg-white lg:grid-cols-4">
          <Tile label="Godkända" value={formatPercent(summary.passRate)} note={period} className="border-b border-r lg:border-b-0" />
          <Tile label="Skrivningar" value={String(summary.total)} note={period} className="border-b lg:border-b-0 lg:border-r" />
          <Tile label="Vanligaste betyg" value={summary.commonGrade ?? "–"} note={`bland godkända, ${period}`} className="border-r" />
          <Tile
            label="Godkända senast"
            value={formatPercent(summary.latest.passed / summary.latest.total)}
            note={`${shortDate(summary.latest.date)}, ${summary.latest.total} skrivande`}
          />
        </dl>
      )}

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="display-tight text-2xl">Betyg per tillfälle</h2>
          <p className="mt-1 text-sm text-stone">
            {m.title} ({m.code}) · nyast först
          </p>
        </div>
        <div className="inline-flex self-start rounded-full border border-ink/10 bg-white p-1 sm:self-auto" role="group" aria-label="Visa som">
          {(["chart", "table"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn("h-9 rounded-full px-4 text-sm font-semibold transition-colors", view === v ? "bg-ink text-white" : "text-stone hover:text-ink")}
            >
              {v === "chart" ? "Diagram" : "Tabell"}
            </button>
          ))}
        </div>
      </div>

      {/* Teckenförklaring: sämsta betyget till vänster, som i staplarna. */}
      <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-stone" aria-label="Betyg">
        {order.map((g) => (
          <li key={g} className="inline-flex items-center gap-2">
            <span aria-hidden className="h-3 w-3 rounded-[3px]" style={{ background: color.get(g) }} />
            {g}
          </li>
        ))}
      </ul>

      {view === "chart" ? (
        // Med mus försvinner rutan när pekaren lämnar diagrammet. Med touch ligger den kvar tills man trycker någon annanstans.
        <div className="relative mt-4" onPointerLeave={(e) => e.pointerType !== "touch" && setTip(null)}>
          <div aria-hidden className={cn(ROW, "kicker cursor-auto py-0 pb-2 text-stone-light")}>
            <span>Datum</span>
            <span>Betyg</span>
            <span className="text-right">Godkända</span>
          </div>
          <ol className="space-y-1">
            {rows.map((o, i) => (
              <li
                key={o.date}
                tabIndex={0}
                onPointerEnter={(e) => setTip({ index: i, top: e.currentTarget.offsetTop + e.currentTarget.offsetHeight })}
                onFocus={(e) => setTip({ index: i, top: e.currentTarget.offsetTop + e.currentTarget.offsetHeight })}
                onBlur={() => setTip(null)}
                className={cn(
                  ROW,
                  "rounded-xl outline-none transition-colors focus-visible:ring-2 focus-visible:ring-red/50",
                  tip?.index === i ? "bg-paper-2" : "hover:bg-paper-2",
                )}
              >
                <span className="tabular text-[0.8rem] text-stone sm:text-sm">{shortDate(o.date)}</span>
                <Bar occasion={o} color={color} />
                <span className="tabular whitespace-nowrap text-right text-sm">
                  <span className="font-semibold">{formatPercent(o.passed / o.total)}</span>
                  <span className="text-stone"> av {o.total}</span>
                </span>
                <span className="sr-only">
                  {" "}
                  godkända av {o.total} skrivande. {o.grades.map((g) => `${g.grade}: ${g.count}`).join(", ")}.
                </span>
              </li>
            ))}
          </ol>
          {active && tip && <Tooltip occasion={active} color={color} top={tip.top} />}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-[1.25rem] border border-ink/10 bg-white">
          <table className="w-full min-w-max text-sm">
            <caption className="sr-only">
              Betyg per tentatillfälle för {m.title} ({m.code})
            </caption>
            <thead>
              <tr className="border-b border-ink/10 text-left">
                <th scope="col" className="kicker px-4 py-3 font-medium text-stone">
                  Datum
                </th>
                {order.map((g) => (
                  <th key={g} scope="col" className="kicker px-3 py-3 text-right font-medium text-stone">
                    {g}
                  </th>
                ))}
                <th scope="col" className="kicker px-3 py-3 text-right font-medium text-stone">
                  Totalt
                </th>
                <th scope="col" className="kicker px-4 py-3 text-right font-medium text-stone">
                  Godkända
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/[0.07]">
              {rows.map((o) => (
                <tr key={o.date}>
                  <th scope="row" className="tabular whitespace-nowrap px-4 py-2.5 text-left font-normal">
                    {shortDate(o.date)}
                  </th>
                  {order.map((g) => (
                    <td key={g} className="tabular px-3 py-2.5 text-right">
                      {o.grades.find((x) => x.grade === g)?.count ?? "–"}
                    </td>
                  ))}
                  <td className="tabular px-3 py-2.5 text-right">{o.total}</td>
                  <td className="tabular px-4 py-2.5 text-right font-semibold">{formatPercent(o.passed / o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 text-sm text-stone sm:flex-row sm:items-center sm:justify-between">
        <p>
          Godkända = alla betyg utom U, F och Fx.
          {hidden > 0 && ` ${hidden} ${hidden === 1 ? "tillfälle" : "tillfällen"} med färre än ${MIN_RESULTS} resultat visas inte.`}
        </p>
        {collapsible && (
          <button type="button" onClick={() => setShowAll((s) => !s)} className="btn btn-ghost btn-sm self-start sm:self-auto">
            {showAll ? "Visa färre" : `Visa alla ${occasions.length} tillfällen`}
          </button>
        )}
      </div>
    </div>
  );
}

function Tile({ label, value, note, className }: { label: string; value: string; note: string; className?: string }) {
  return (
    <div className={cn("border-ink/10 p-5 md:p-6", className)}>
      {/* På mobil bryts längre etiketter på två rader – samma höjd på alla gör att värdena hamnar i linje. */}
      <dt className="kicker min-h-[2lh] text-stone sm:min-h-0">{label}</dt>
      <dd className="mt-3 text-[clamp(1.6rem,3vw,2.2rem)] font-semibold leading-none tracking-tight">{value}</dd>
      <dd className="mt-2 text-sm text-stone">{note}</dd>
    </div>
  );
}

/** En 100 %-stapel: ≤24 px hög, rak vid baslinjen till vänster och rundad i slutet, 2 px yta mellan betygen. */
function Bar({ occasion, color }: { occasion: ExamOccasion; color: Map<string, string> }) {
  return (
    <span aria-hidden className="flex h-5 gap-[2px] overflow-hidden rounded-r-[4px]">
      {occasion.grades.map((g) =>
        g.count > 0 ? <span key={g.grade} className="min-w-[2px] basis-0" style={{ flexGrow: g.count, background: color.get(g.grade) }} /> : null,
      )}
    </span>
  );
}

/** Exakta siffror för raden. Värdet först och starkast, betyget efter – med en kort linje i betygets färg. */
function Tooltip({ occasion, color, top }: { occasion: ExamOccasion; color: Map<string, string>; top: number }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-[5.5rem] z-10 w-56 rounded-2xl border border-ink/10 bg-white p-4 text-sm shadow-[0_24px_50px_-24px_rgb(10_10_10/0.45)] sm:left-[8rem]"
      style={{ top: top + 4 }}
    >
      <p className="font-semibold">{shortDate(occasion.date)}</p>
      <p className="text-stone">
        {occasion.total} skrivande · {formatPercent(occasion.passed / occasion.total)} godkända
      </p>
      <ul className="mt-3 space-y-1.5">
        {occasion.grades.map((g) => (
          <li key={g.grade} className="flex items-center gap-2.5">
            <span aria-hidden className="h-[3px] w-3 rounded-full" style={{ background: color.get(g.grade) }} />
            <span className="tabular font-semibold">{g.count}</span>
            <span className="tabular text-stone">({formatPercent(g.count / occasion.total)})</span>
            <span className="ml-auto text-stone">{g.grade}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
