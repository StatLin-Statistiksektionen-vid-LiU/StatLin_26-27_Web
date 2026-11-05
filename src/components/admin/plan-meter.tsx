import { cn } from "@/lib/utils";

/** Framsteg som en skala: ett streck per steg, fyllt när steget är klart. */
export function PlanMeter({ done, total, className }: { done: number; total: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div role="img" aria-label={`${done} av ${total} steg klara`} className="flex h-3 min-w-0 flex-1 items-stretch gap-[3px] [print-color-adjust:exact]">
        {total === 0 ? (
          <span className="flex-1 rounded-[1px] bg-ink/10" />
        ) : (
          Array.from({ length: total }, (_, i) => <span key={i} className={cn("flex-1 rounded-[1px]", i < done ? "bg-ink" : "bg-ink/15")} />)
        )}
      </div>
      <span className="shrink-0 font-mono text-sm font-semibold tabular" aria-hidden>
        {done}/{total}
      </span>
    </div>
  );
}
