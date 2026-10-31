import { formatPercent, gradeColors, type CourseStatSummary, type GradeCount } from "@/lib/exam-stats";
import { cn } from "@/lib/utils";

/**
 * Liten staplad stapel med betygsfördelningen, sämsta betyget längst till vänster.
 * Ren dekor för skärmläsare: siffrorna står bredvid och på kurssidan.
 */
export function GradeBar({ grades, className }: { grades: GradeCount[]; className?: string }) {
  const colors = gradeColors(grades.map((g) => g.grade));
  return (
    <span aria-hidden className={cn("flex h-2.5 w-24 shrink-0 gap-[2px] overflow-hidden rounded-r-[4px]", className)}>
      {grades.map((g, i) =>
        g.count > 0 ? <span key={g.grade} className="min-w-[2px] basis-0" style={{ flexGrow: g.count, background: colors[i] }} /> : null,
      )}
    </span>
  );
}

/** Andel godkända med betygsstapel, för kurslistorna. Kurser som inte getts på tre år visar i stället åren statistiken kommer från. */
export function PassRate({ summary }: { summary: CourseStatSummary | null }) {
  if (!summary) return <span className="text-sm text-stone-light">Ingen statistik ännu</span>;
  const [from, to] = [summary.from.slice(0, 4), summary.to.slice(0, 4)];
  const years = from === to ? from : `${from}–${to}`;
  const period = summary.recent ? "de senaste tre åren" : years;
  const detail = summary.grades.map((g) => `${g.grade}: ${g.count}`).join(", ");
  return (
    <span className="flex items-center gap-3" title={`${summary.module}, ${period} – ${detail}`}>
      <GradeBar grades={summary.grades} />
      <span className="tabular w-12 text-right font-semibold">{formatPercent(summary.passRate)}</span>
      {!summary.recent && <span className="tabular -ml-1 text-xs text-stone">{years}</span>}
      <span className="sr-only">
        godkända {period}, av {summary.total} skrivningar
      </span>
    </span>
  );
}

/** Teckenförklaringen till GradeBar: rött är underkänt, de gråa godkända betyg. */
export function GradeLegend({ className }: { className?: string }) {
  return (
    <span className={cn("flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-stone", className)}>
      <span className="inline-flex items-center gap-2">
        <span aria-hidden className="h-2.5 w-4 rounded-r-[3px] bg-[#d40000]" />
        Underkänt
      </span>
      <span className="inline-flex items-center gap-2">
        <span aria-hidden className="flex h-2.5 gap-[2px] overflow-hidden rounded-r-[3px]">
          <span className="w-3 bg-[#a19d95]" />
          <span className="w-3 bg-[#6a665f]" />
          <span className="w-3 bg-[#0a0a0a]" />
        </span>
        Godkänt, mörkare är högre betyg
      </span>
    </span>
  );
}
