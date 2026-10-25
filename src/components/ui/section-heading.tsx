import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "@/components/icons";
import { cn } from "@/lib/utils";

export function SectionHeading({
  index,
  kicker,
  title,
  href,
  linkLabel,
  dark,
  className,
}: {
  index?: string;
  kicker: string;
  title: ReactNode;
  href?: string;
  linkLabel?: string;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-6 md:flex-row md:items-end md:justify-between", className)}>
      <div>
        <p className={cn("kicker flex items-center gap-3", dark ? "text-white/55" : "text-stone")}>
          {index && <span className="text-red">{index}</span>}
          <span className={cn("h-px w-8", dark ? "bg-white/25" : "bg-ink/20")} aria-hidden />
          {kicker}
        </p>
        <h2 className="display mt-5 text-[clamp(2.1rem,5vw,4.2rem)]">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className={cn(
            "group inline-flex shrink-0 items-center gap-2 text-[0.95rem] font-semibold",
            dark ? "text-white" : "text-ink",
          )}
        >
          <span className="link-underline">{linkLabel ?? "Visa alla"}</span>
          <span className="grid size-9 place-items-center rounded-full bg-red text-white transition-transform duration-500 group-hover:translate-x-1">
            <ArrowRight size={16} />
          </span>
        </Link>
      )}
    </div>
  );
}
