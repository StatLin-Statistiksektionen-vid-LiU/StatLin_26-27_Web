import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Check } from "@/components/icons";
import { cn } from "@/lib/utils";

export function AdminHeader({
  title,
  description,
  actions,
  back,
  kicker,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
  kicker?: string;
}) {
  return (
    <header className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="kicker mb-4 inline-flex items-center gap-2 text-stone hover:text-ink">
            <ArrowLeft size={14} /> {back.label}
          </Link>
        )}
        {kicker && <p className="kicker text-red-deep">{kicker}</p>}
        <h1 className="mt-1 text-[clamp(1.8rem,3.5vw,2.5rem)] font-extrabold leading-tight tracking-tight [font-stretch:110%]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-stone">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Notice({ children, tone = "success" }: { children: ReactNode; tone?: "success" | "info" | "warning" }) {
  return (
    <div
      role="status"
      className={cn(
        "mb-6 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold",
        tone === "success" && "border-emerald-600/25 bg-emerald-600/[0.07] text-emerald-900",
        tone === "info" && "border-ink/10 bg-white text-ink",
        tone === "warning" && "border-red/30 bg-red/[0.06] text-red-dark",
      )}
    >
      {tone === "success" && <Check size={18} />}
      {children}
    </div>
  );
}

export function StatusBadge({ published, label }: { published: boolean; label?: string }) {
  return (
    <span className={cn("chip", published ? "bg-emerald-600/10 text-emerald-800" : "bg-ink/[0.07] text-ink/60")}>
      <span className={cn("size-1.5 rounded-full", published ? "bg-emerald-600" : "bg-ink/40")} aria-hidden />
      {label ?? (published ? "Publicerad" : "Utkast")}
    </span>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-ink/20 bg-white/50 px-6 py-14 text-center">
      <p className="text-lg font-bold">{title}</p>
      {children && <p className="mx-auto mt-1.5 max-w-md text-sm text-stone">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-[1.5rem] border border-ink/10 bg-white", className)}>{children}</div>;
}
