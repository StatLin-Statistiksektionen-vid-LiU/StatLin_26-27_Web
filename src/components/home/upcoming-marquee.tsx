import Link from "next/link";
import { listUpcomingEvents } from "@/lib/data/events";
import { parts } from "@/lib/dates";

/** Rött löpband med de närmaste evenemangen. */
export async function UpcomingMarquee() {
  const events = await listUpcomingEvents(8);
  if (events.length === 0) return <MarqueeShell items={[{ key: "x", label: "Håll utkik – nya evenemang kommer snart", href: "/evenemang" }]} />;
  const items = events.map((e) => {
    const p = parts(e.starts_at);
    return { key: e.slug, label: `${e.title}`, meta: `${p.day} ${p.monthShort} · ${e.committee?.short_name ?? "StatLin"}`, href: `/evenemang/${e.slug}` };
  });
  return <MarqueeShell items={items} />;
}

function MarqueeShell({ items }: { items: { key: string; label: string; meta?: string; href: string }[] }) {
  // Upprepa så att bandet alltid fyller skärmen, och dubblera för sömlös loop.
  const filled = Array.from({ length: Math.max(1, Math.ceil(6 / items.length)) }, () => items).flat();
  return (
    <div className="relative overflow-hidden border-y border-red-dark bg-red py-3.5 text-white" aria-label="Kommande evenemang">
      <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
            {filled.map((it, i) => (
              <li key={`${it.key}-${i}`} className="flex items-center">
                <Link href={it.href} tabIndex={copy === 1 ? -1 : undefined} className="group flex items-center gap-3 px-7">
                  <span className="display-tight text-[1.05rem] group-hover:underline">{it.label}</span>
                  {it.meta && <span className="kicker text-white/75">{it.meta}</span>}
                </Link>
                <span aria-hidden className="text-white/60">
                  ✦
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

export function MarqueeFallback() {
  return <div className="h-[3.4rem] border-y border-red-dark bg-red" />;
}
