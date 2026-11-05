import type { ReactNode } from "react";
import { formatDateLong, formatTimeRange } from "@/lib/dates";
import { STAR_COPY } from "@/lib/seed-content";
import { cn } from "@/lib/utils";

/** Ordet STAR och den röda linjen har samma storlek. Telefonens bredd styr, så att ordet aldrig går utanför sidans marginal. */
const WORD_SIZE = "text-[clamp(4.5rem,min(28vw,35svh),23rem)]";

/** Heron på STAR-sidan och inbjudan: loggan i sidans storlek, med bokstäverna, den röda linjen genom dem och grafen uppför himlen. */
export function StarHero({ subtitle, withBar, children }: { subtitle: string; withBar: boolean; children: ReactNode }) {
  return (
    <section className={cn("relative isolate flex flex-col justify-end overflow-hidden pb-12 md:pb-10", withBar ? "min-h-[calc(100svh-var(--header-h))] pt-8" : "min-h-svh pt-[calc(var(--header-h)+1.5rem)]")}>
      <div className="container-site">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/utskott/star.webp" alt="" width={360} height={356} className="size-14 md:size-16" />
          <p className="kicker text-white/85">{subtitle}</p>
        </div>
        <div className="relative mt-6 md:mt-8">
          <div className={cn("star-linje absolute left-1/2 top-[56%] h-[max(2px,0.016em)] w-screen -translate-x-1/2", WORD_SIZE)} aria-hidden />
          <HeroGraph />
          <h1 className={cn("star-type star-ord relative -mr-[0.2em] font-light uppercase leading-[1.05] tracking-[0.2em]", WORD_SIZE)}>{STAR_COPY.title}</h1>
        </div>
        <div className="star-upp mt-8 grid gap-8 md:mt-10 md:grid-cols-12 md:items-end">{children}</div>
      </div>
    </section>
  );
}

function HeroGraph() {
  const points = [
    [1, 96],
    [21, 62],
    [35, 72],
    [56, 24],
    [71, 34],
    [90, -6],
    [99, 8],
  ];
  return (
    <div className="star-draw" aria-hidden>
      <div className="star-draw-inre">
        <div className="star-draw-graf">
          <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline points={points.map((p) => p.join(",")).join(" ")} fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          </svg>
          {points.map(([x, y]) => (
            <span key={x} className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white md:size-2.5" style={{ left: `${x}%`, top: `${y}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export type EventFactsData = { starts_at: string; ends_at: string | null; all_day: boolean; location: string; price: string };

export function EventFacts({ event, stacked, className }: { event: EventFactsData; stacked?: boolean; className?: string }) {
  return (
    <dl className={cn("mono-accent flex gap-x-6 gap-y-1 text-sm text-white/85 md:text-base", stacked ? "flex-col" : "flex-wrap", className)}>
        <div>
          <dt className="sr-only">Datum</dt>
          <dd className="first-letter:uppercase">{formatDateLong(event.starts_at)}</dd>
        </div>
        <div>
          <dt className="sr-only">Tid</dt>
          <dd>{formatTimeRange(event.starts_at, event.ends_at, event.all_day)}</dd>
        </div>
        {event.location && (
          <div>
            <dt className="sr-only">Plats</dt>
            <dd>{event.location}</dd>
          </div>
        )}
        {event.price && (
          <div>
            <dt className="sr-only">Pris</dt>
            <dd>{event.price}</dd>
          </div>
        )}
    </dl>
  );
}
