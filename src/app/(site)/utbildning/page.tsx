import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ContentPage } from "@/components/content/content-page";
import { ArrowUpRight, Mail } from "@/components/icons";
import { HeroSkeleton } from "@/components/ui/skeletons";
import { getCommitteeBySlug } from "@/lib/data/content";

export const metadata: Metadata = {
  title: "Utbildning",
  description: "Statistik och dataanalys vid Linköpings universitet – studiebevakning, kursutvärderingar och stöd.",
};

const LINKS = [
  { href: "https://studieinfo.liu.se/program/F7KSA", label: "Programmet i Studieinfo" },
  { href: "https://liu.se/", label: "Linköpings universitet" },
];

export default function EducationPage() {
  return (
    <Suspense fallback={<HeroSkeleton />}>
      <Education />
    </Suspense>
  );
}

async function Education() {
  const ubu = await getCommitteeBySlug("ubu");
  return (
    <ContentPage
      slug="utbildning"
      kicker="Utbildning"
      heroAside={
        <div className="hidden justify-end md:flex">
          <Formula />
        </div>
      }
      aside={
        <div className="sticky top-[calc(var(--header-h)+1.5rem)] space-y-4">
          {ubu && (
            <div className="overflow-hidden rounded-[1.75rem] bg-ink p-7 text-white">
              <div className="flex items-center gap-4">
                {ubu.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ubu.logo_url} alt="" className="size-16 object-contain" />
                )}
                <div>
                  <p className="kicker text-white/50">Studiebevakning</p>
                  <p className="display-tight mt-1 text-2xl normal-case">{ubu.short_name}</p>
                </div>
              </div>
              <p className="mt-5 text-[0.95rem] leading-relaxed text-white/70">{ubu.tagline} Hör av dig om kurser, examination eller studiemiljö – anonymt om du vill.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {ubu.email && (
                  <a href={`mailto:${ubu.email}`} className="btn btn-red btn-sm">
                    <Mail size={15} /> Mejla UBU
                  </a>
                )}
                <Link href="/utskott/ubu" className="btn btn-ghost-dark btn-sm">
                  Om UBU
                </Link>
              </div>
            </div>
          )}
          <ul className="overflow-hidden rounded-[1.5rem] border border-ink/10 bg-white">
            {LINKS.map((l) => (
              <li key={l.href} className="border-b border-ink/10 last:border-0">
                <a href={l.href} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between px-5 py-4 font-semibold hover:bg-paper/60">
                  {l.label}
                  <ArrowUpRight size={16} className="text-red transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      }
    />
  );
}

/** Dekor: minsta kvadrat-skattningen som "formelkort". */
function Formula() {
  return (
    <div className="w-full max-w-sm rotate-2 rounded-[1.5rem] border border-white/15 bg-white/[0.04] p-7 backdrop-blur">
      <p className="kicker text-white/45">Minsta kvadrat</p>
      <p className="mt-4 font-serif text-[2.1rem] italic leading-tight text-white">
        β̂ = (X<sup className="text-lg">⊤</sup>X)<sup className="text-lg">−1</sup>X<sup className="text-lg">⊤</sup>y
      </p>
      <div className="mt-5 h-px bg-white/10" />
      <p className="mt-4 font-mono text-xs leading-relaxed text-white/50">
        R² = 0,94 · n = 180 hp
        <br />
        <span className="text-red">p &lt; 0,001</span>
      </p>
    </div>
  );
}
