import type { CSSProperties } from "react";
import { formatPercent, type GradeCount } from "@/lib/exam-stats";
import { GrafIn } from "./graf-in";

/** Den högsta stapeln når inte ända upp, så att procenten får plats ovanför den. */
const TOP = 84;

/**
 * Betygen under samma period som nyckeltalen: en stående stapel per betyg, sämst till vänster och med samma färger som staplarna per
 * tillfälle. Betygen har en ordning, så stående staplar läses som en fördelning. Betyg och siffror står intill staplarna, så det behövs
 * varken teckenförklaring eller hovring. Staplarna är raka vid baslinjen och rundade i toppen.
 */
export function GradeDistribution({ grades, color, period }: { grades: GradeCount[]; color: Map<string, string>; period: string }) {
  const total = grades.reduce((n, g) => n + g.count, 0);
  const longest = Math.max(1, ...grades.map((g) => g.count));
  return (
    <>
      <h2 className="display-tight text-xl">Betyg {period}</h2>
      <p className="mt-1 text-sm text-stone">{total} skrivningar</p>
      <GrafIn className="relative mt-5 min-h-60 flex-1">
        <ul className="absolute inset-0 flex">
          {grades.map((g, i) => {
            const height = (g.count / longest) * TOP;
            return (
              <li key={g.grade} className="grid min-w-0 flex-1 grid-rows-[minmax(0,1fr)_auto] text-center">
                <span className="sr-only">
                  {g.grade}: {formatPercent(g.count / total)}, {g.count} skrivningar
                </span>
                <div aria-hidden className="relative border-b border-ink/15">
                  {g.count > 0 && (
                    <span
                      className="graf-stapel-upp absolute inset-x-1 bottom-0 mx-auto block max-w-[3.25rem] rounded-t-[4px] sm:inset-x-1.5"
                      style={{ height: `max(2px, ${height}%)`, background: color.get(g.grade), "--i": i } as CSSProperties}
                    />
                  )}
                  <span
                    className="graf-tona tabular absolute inset-x-0 whitespace-nowrap text-xs font-semibold sm:text-sm"
                    style={{ bottom: `calc(${height}% + 0.3rem)`, "--i": i } as CSSProperties}
                  >
                    {formatPercent(g.count / total)}
                  </span>
                </div>
                <p aria-hidden className="pt-2.5 text-sm font-semibold">
                  {g.grade}
                </p>
                <p aria-hidden className="tabular text-xs text-stone">
                  {g.count}
                </p>
              </li>
            );
          })}
        </ul>
      </GrafIn>
    </>
  );
}
