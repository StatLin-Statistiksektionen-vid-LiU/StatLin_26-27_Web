import { formatPercent, type GradeCount } from "@/lib/exam-stats";

/**
 * Betygen under samma period som nyckeltalen: en vågrät stapel per betyg, sämst överst och med samma färger
 * som staplarna per tillfälle. Betyg och siffror står som text på raden, så det behövs varken teckenförklaring
 * eller hovring. Staplarna är raka vid baslinjen och rundade i slutet.
 */
export function GradeDistribution({ grades, color, period }: { grades: GradeCount[]; color: Map<string, string>; period: string }) {
  const total = grades.reduce((n, g) => n + g.count, 0);
  const longest = Math.max(1, ...grades.map((g) => g.count));
  return (
    <>
      <h2 className="display-tight text-xl">Betyg {period}</h2>
      <p className="mt-1 text-sm text-stone">{total} skrivningar</p>
      <ul className="my-auto space-y-3 pt-6">
        {grades.map((g) => (
          <li key={g.grade} className="grid grid-cols-[2.5rem_minmax(0,1fr)_5.5rem] items-center gap-3 text-sm">
            <span className="font-semibold">{g.grade}</span>
            <span aria-hidden className="block h-5">
              {g.count > 0 && <span className="block h-full min-w-[2px] rounded-r-[4px]" style={{ width: `${(g.count / longest) * 100}%`, background: color.get(g.grade) }} />}
            </span>
            <span className="tabular whitespace-nowrap text-right">
              <span className="font-semibold">{formatPercent(g.count / total)}</span>
              <span className="text-stone"> · {g.count}</span>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
