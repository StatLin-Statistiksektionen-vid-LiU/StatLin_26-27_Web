import type { CSSProperties, ReactNode } from "react";
import { cn, fitHeading } from "@/lib/utils";

/** Mörk sidhuvudyta med rutnät – gemensam för alla undersidor. */
export function PageHero({
  kicker,
  title,
  accent,
  lead,
  children,
  aside,
  className,
  fitTitle,
}: {
  kicker: string;
  title: ReactNode;
  /**
   * Titeln som ren text, för redigerbara titlar: storleken räknas då ut efter längsta ordet så att
   * långa sammansättningar krymper i stället för att brytas mitt i ordet. Mobil och desktop var för sig.
   */
  fitTitle?: string;
  accent?: string;
  lead?: ReactNode;
  children?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("noise relative overflow-hidden bg-ink text-white", className)}>
      <div
        className="grid-paper pointer-events-none absolute inset-0 text-white [mask-image:radial-gradient(ellipse_at_70%_20%,black,transparent_75%)]"
        aria-hidden
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 size-[38rem] rounded-full opacity-60 blur-3xl"
        style={{ background: `radial-gradient(closest-side, ${accent ?? "#ff0707"}33, transparent)` }}
      />
      <div className="container-site relative grid items-end gap-10 pb-14 pt-[calc(var(--header-h)+4rem)] md:grid-cols-12 md:pb-20 md:pt-[calc(var(--header-h)+6rem)]">
        <div className={cn(aside ? "md:col-span-8" : "md:col-span-10")}>
          <p className="kicker flex items-center gap-3 text-white/60">
            <span className="h-px w-8 bg-red" aria-hidden />
            {kicker}
          </p>
          <h1
            className={cn(
              "display mt-6 [overflow-wrap:anywhere]",
              fitTitle ? "text-[length:var(--title-sm)] md:text-[length:var(--title-md)]" : "text-[clamp(2.6rem,7.5vw,6.5rem)]",
            )}
            style={fitTitle ? titleSizes(fitTitle, !!aside) : undefined}
          >
            {title}
          </h1>
          {lead && <div className="mt-7 max-w-2xl text-lg leading-relaxed text-white/70 md:text-xl">{lead}</div>}
          {children && <div className="mt-9">{children}</div>}
        </div>
        {aside && <div className="md:col-span-4">{aside}</div>}
      </div>
    </section>
  );
}

/** "display" har ungefär 0,93 em per versal – 0,96 ger lite marginal. */
function titleSizes(text: string, hasAside: boolean): CSSProperties {
  const opts = { maxRem: 6.5, charWidth: 0.96 };
  return {
    "--title-sm": fitHeading(text, { ...opts, maxVw: 11, usableVw: 88 }).fontSize,
    "--title-md": fitHeading(text, { ...opts, maxVw: 7.5, usableVw: hasAside ? 56 : 80 }).fontSize,
  } as CSSProperties;
}
