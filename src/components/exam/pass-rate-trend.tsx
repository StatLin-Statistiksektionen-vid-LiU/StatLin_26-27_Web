"use client";

import { useState, type PointerEvent } from "react";
import { formatDateShort } from "@/lib/dates";
import { formatPercent, passRateByYear, type ExamOccasion, type YearPassRate } from "@/lib/exam-stats";

/**
 * Neutrala med flit: rött betyder underkänt i betygsfärgerna bredvid. Dataviz-skillens validator godkänner
 * paret för färgblindhet och kontrast (ΔE 49, över 3:1) men inte som kategoriska färger, eftersom de saknar
 * kulör. Det är linje mot prick som skiljer dem åt, inte färgen – och tabellvyn har samma siffror.
 */
const LINE = "#0a0a0a";
const DOT = "#8f8b84";
const GRID = [100, 75, 50, 25, 0];
/** Årsetiketter närmare varandra än så här, i procent av bredden, glesas ut. */
const MIN_LABEL_GAP = 13;

const share = (r: { passed: number; total: number }) => r.passed / r.total;

/**
 * Andel godkända över tid: en prick per tillfälle och en linje genom varje års samlade skrivningar.
 * Enskilda tillfällen svänger mycket när få skriver, så det är linjen som visar utvecklingen.
 * Linjer och stödlinjer är SVG som töjs med bredden; prickar och etiketter är HTML, så att de behåller sin form.
 */
export function PassRateTrend({ occasions }: { occasions: ExamOccasion[] }) {
  const [active, setActive] = useState<number | null>(null);

  const sorted = [...occasions].sort((a, b) => a.date.localeCompare(b.date));
  const times = sorted.map((o) => Date.parse(o.date));
  const start = times[0];
  const span = Math.max(1, times[times.length - 1] - start);
  const x = (time: number) => ((time - start) / span) * 100;
  const y = (r: { passed: number; total: number }) => 100 - share(r) * 100;

  const years = passRateByYear(sorted);
  const first = years[0];
  const last = years[years.length - 1];
  // Från det senaste året och bakåt, så att det senaste alltid har en etikett.
  const labels = years.reduceRight<YearPassRate[]>((kept, year) => (!kept.length || x(kept[0].at) - x(year.at) >= MIN_LABEL_GAP ? [year, ...kept] : kept), []);

  /** Pekaren behöver inte träffa en prick – närmaste tillfälle i tiden räcker. */
  function pick(e: PointerEvent<HTMLDivElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const time = start + ((e.clientX - box.left) / box.width) * span;
    setActive(times.reduce((best, t, i) => (Math.abs(t - time) < Math.abs(times[best] - time) ? i : best), 0));
  }

  const occasion = active === null ? null : sorted[active];
  const year = occasion && years.find((v) => v.year === occasion.date.slice(0, 4));

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
        <div>
          <h2 className="display-tight text-xl">Godkända över tid</h2>
          <p className="mt-1 text-sm text-stone">
            {first.year === last.year ? first.year : `${first.year}–${last.year}`} · {sorted.length} tillfällen
          </p>
        </div>
        {years.length > 1 && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone">
            <li className="inline-flex items-center gap-2">
              <span aria-hidden className="h-0.5 w-4 rounded-full" style={{ background: LINE }} />
              Hela året
            </li>
            <li className="inline-flex items-center gap-2">
              <span aria-hidden className="size-2 rounded-full" style={{ background: DOT }} />
              Ett tillfälle
            </li>
          </ul>
        )}
      </div>

      {/* Med mus försvinner rutan när pekaren lämnar grafen. Med touch ligger den kvar tills man trycker någon annanstans. */}
      <div
        role="img"
        aria-label={`Godkända över tid, per år: ${years.map((v) => `${v.year} ${formatPercent(share(v))}`).join(", ")}.`}
        tabIndex={-1}
        onPointerDown={pick}
        onPointerMove={pick}
        onPointerLeave={(e) => e.pointerType !== "touch" && setActive(null)}
        onBlur={() => setActive(null)}
        className="relative ml-10 mr-4 mt-6 h-60 touch-pan-y outline-none"
      >
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
          {GRID.map((v) => (
            <line key={v} x1="0" x2="100" y1={100 - v} y2={100 - v} stroke="currentColor" vectorEffect="non-scaling-stroke" className="text-ink/10" />
          ))}
          {years.length > 1 && (
            <polyline
              points={years.map((v) => `${x(v.at)},${y(v)}`).join(" ")}
              fill="none"
              stroke={LINE}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
        {GRID.map((v) => (
          <span key={v} className="tabular absolute right-full mr-2.5 -translate-y-1/2 whitespace-nowrap text-xs text-stone" style={{ top: `${100 - v}%` }}>
            {v} %
          </span>
        ))}
        {occasion && <span className="absolute inset-y-0 w-px -translate-x-1/2 bg-ink/40" style={{ left: `${x(times[active!])}%` }} />}
        {sorted.map((o, i) => (
          <span
            key={o.date}
            className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white"
            style={{ left: `${x(times[i])}%`, top: `${y(o)}%`, background: i === active ? LINE : DOT }}
          />
        ))}
        {occasion && year && <TrendTooltip date={occasion.date} total={occasion.total} rate={share(occasion)} yearLabel={year.year} yearRate={share(year)} at={x(times[active!])} />}
      </div>

      <div aria-hidden className="tabular relative ml-10 mr-4 mt-2 h-5 text-xs text-stone">
        {labels.map((v) => (
          <span key={v.year} className="absolute -translate-x-1/2" style={{ left: `${x(v.at)}%` }}>
            {v.year}
          </span>
        ))}
      </div>
    </>
  );
}

/**
 * Rutan håller sig inom grafen och på motsatt sida om pricken, så att den aldrig täcker det man pekar på.
 * Den får därför vara högst knappt halva grafen hög.
 */
function TrendTooltip({ date, total, rate, yearLabel, yearRate, at }: { date: string; total: number; rate: number; yearLabel: string; yearRate: number; at: number }) {
  return (
    <div
      className="pointer-events-none absolute z-10 w-44 rounded-2xl border border-ink/10 bg-white px-3.5 py-2.5 text-sm shadow-[0_24px_50px_-24px_rgb(10_10_10/0.45)]"
      style={{ left: `clamp(0px, calc(${at}% - 5.5rem), calc(100% - 11rem))`, ...(rate > 0.5 ? { bottom: "0.25rem" } : { top: "0.25rem" }) }}
    >
      <p className="font-semibold">{formatDateShort(date)}</p>
      <p className="text-stone">{total} skrivande</p>
      <ul className="mt-1.5 space-y-0.5">
        <li className="flex items-center gap-2.5">
          <span className="h-[3px] w-3 rounded-full" style={{ background: DOT }} />
          <span className="tabular font-semibold">{formatPercent(rate)}</span>
          <span className="ml-auto text-stone">tillfället</span>
        </li>
        <li className="flex items-center gap-2.5">
          <span className="h-[3px] w-3 rounded-full" style={{ background: LINE }} />
          <span className="tabular font-semibold">{formatPercent(yearRate)}</span>
          <span className="ml-auto text-stone">hela {yearLabel}</span>
        </li>
      </ul>
    </div>
  );
}
