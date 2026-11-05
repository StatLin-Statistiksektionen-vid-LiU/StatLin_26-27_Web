import { Children, isValidElement, type CSSProperties, type ReactNode } from "react";
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
   * Titeln som ren text, när den inte går att läsa ut ur title. Storleken räknas ut efter längsta ordet så att
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
        className="pointer-events-none absolute -right-40 -top-40 size-[38rem] rounded-full opacity-60 blur-3xl pointer-coarse:filter-none"
        style={{ background: `radial-gradient(closest-side, ${accent ?? "#ff0707"}33, transparent)` }}
      />
      <div className="container-site relative grid items-end gap-10 pb-14 pt-[calc(var(--header-h)+4rem)] md:grid-cols-12 md:pb-20 md:pt-[calc(var(--header-h)+6rem)]">
        <div className={cn(aside ? "md:col-span-8" : "md:col-span-10")}>
          <p className="kicker flex items-center gap-3 text-white/60">
            <span className="h-px w-8 bg-red" aria-hidden />
            {kicker}
          </p>
          <div className="@container mt-6">
            <h1 className="display text-[length:var(--title-sm)] [overflow-wrap:anywhere] md:text-[length:var(--title-md)]" style={titleSizes(fitTitle ?? textOf(title))}>
              {title}
            </h1>
          </div>
          {lead && <div className="mt-7 max-w-2xl text-lg leading-relaxed text-white/70 md:text-xl">{lead}</div>}
          {children && <div className="mt-9">{children}</div>}
        </div>
        {aside && <div className="md:col-span-4">{aside}</div>}
      </div>
    </section>
  );
}

function titleSizes(text: string): CSSProperties {
  return {
    "--title-sm": fitHeading(text, { maxRem: 6.5, maxVw: 11 }).fontSize,
    "--title-md": fitHeading(text, { maxRem: 6.5, maxVw: 7.5 }).fontSize,
  } as CSSProperties;
}

/** Titelns text, även när en del av den ligger i en färgad span. En radbrytning skiljer två ord åt. */
function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") return String(child);
      if (!isValidElement(child)) return "";
      return child.type === "br" ? " " : textOf((child.props as { children?: ReactNode }).children);
    })
    .join("");
}
