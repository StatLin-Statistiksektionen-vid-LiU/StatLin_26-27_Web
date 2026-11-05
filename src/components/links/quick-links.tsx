import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Mail } from "@/components/icons";
import { isExternalUrl } from "@/lib/links";
import type { LinkItem } from "@/lib/types";
import { safeExternalUrl } from "@/lib/utils";
import { LinkIcon } from "./link-icon";
import { SiteLink } from "./site-link";

/** Genvägarna är länkarna som är markerade som genväg under Admin → Länkar – samma som överst på länksidan. */

function AnyLink({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  return isExternalUrl(href) ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  ) : (
    <SiteLink href={href} className={className}>
      {children}
    </SiteLink>
  );
}

const shortcuts = (links: LinkItem[]) =>
  links.flatMap((l) => {
    const href = safeExternalUrl(l.url);
    return href ? [{ ...l, href }] : [];
  });

const chipClass = "group inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] pl-1.5 pr-4 text-sm font-semibold transition-colors hover:border-white hover:bg-white/15";
const chipIconClass = "grid size-7 place-items-center rounded-full bg-white text-ink transition-colors group-hover:bg-red group-hover:text-white";

/** Raden direkt under heron, ovanför bandet. Mörk som heron, så att den hör ihop med den och bandet får stå för sig. */
export function QuickLinksRow({ links, fragelada = false }: { links: LinkItem[]; fragelada?: boolean }) {
  if (links.length === 0 && !fragelada) return null;
  return (
    <section aria-labelledby="genvagar-start" className="border-t border-white/10 bg-ink text-white">
      <div className="container-site flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:gap-8">
        <h2 id="genvagar-start" className="kicker shrink-0 text-white/60">
          Genvägar för studenter
        </h2>
        <ul className="flex flex-wrap gap-2">
          {shortcuts(links).map((l) => (
            <li key={l.id}>
              <AnyLink href={l.href} className={chipClass}>
                <span className={chipIconClass}>
                  <LinkIcon name={l.icon} size={14} />
                </span>
                {l.label}
              </AnyLink>
            </li>
          ))}
          {fragelada && (
            <li>
              <Link href="/fragelada" className={chipClass}>
                <span className={chipIconClass}>
                  <Mail size={14} />
                </span>
                Frågelådan: har du en kod?
              </Link>
            </li>
          )}
        </ul>
        <Link href="/studenter/lankar" className="group inline-flex shrink-0 items-center gap-2 text-sm font-semibold lg:ml-auto">
          <span className="link-underline">Alla länkar</span>
          <span className="grid size-8 place-items-center rounded-full bg-red text-white transition-transform duration-500 group-hover:translate-x-1">
            <ArrowRight size={14} />
          </span>
        </Link>
      </div>
    </section>
  );
}

/** Ett kort i sidokolumnen på Kandidat, Master och Nya studenter. extra = sidans egna länkar under genvägarna. */
export function QuickLinksCard({ links, extra = [] }: { links: LinkItem[]; extra?: { href: string; label: string }[] }) {
  const rowClass = "group flex items-center gap-3 px-5 py-3.5 font-semibold transition-colors hover:bg-paper/60";
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-ink/10 bg-white">
      {links.length > 0 && (
        <>
          <p className="kicker px-5 pb-1 pt-5 text-stone">Genvägar</p>
          <ul className="divide-y divide-ink/[0.07]">
            {shortcuts(links).map((l) => (
              <li key={l.id}>
                <AnyLink href={l.href} className={rowClass}>
                  <LinkIcon name={l.icon} size={18} className="shrink-0 text-stone transition-colors group-hover:text-red" />
                  <span className="flex-1">{l.label}</span>
                  {isExternalUrl(l.href) ? (
                    <ArrowUpRight size={15} className="text-stone-light transition-colors group-hover:text-red" />
                  ) : (
                    <ArrowRight size={15} className="text-stone-light transition-colors group-hover:text-red" />
                  )}
                </AnyLink>
              </li>
            ))}
          </ul>
        </>
      )}
      <ul className={links.length > 0 ? "divide-y divide-ink/10 border-t border-ink/10" : "divide-y divide-ink/10"}>
        {/* En länk som redan är genväg ska inte stå två gånger i samma kort. */}
        {[...extra.filter((e) => !links.some((l) => l.url === e.href)), { href: "/studenter/lankar", label: "Alla länkar" }].map((l) => (
          <li key={l.href}>
            <AnyLink href={l.href} className="group flex items-center justify-between px-5 py-4 font-semibold hover:bg-paper/60">
              {l.label}
              {isExternalUrl(l.href) ? (
                <ArrowUpRight size={16} className="text-red transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              ) : (
                <ArrowRight size={16} className="text-red transition-transform group-hover:translate-x-0.5" />
              )}
            </AnyLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
