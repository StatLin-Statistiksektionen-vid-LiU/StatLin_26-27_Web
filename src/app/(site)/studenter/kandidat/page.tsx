import type { Metadata } from "next";
import { Suspense } from "react";
import { ContentPage } from "@/components/content/content-page";
import { UbuCard } from "@/components/content/ubu-card";
import { QuickLinksCard } from "@/components/links/quick-links";
import { HeroSkeleton } from "@/components/ui/skeletons";
import { getCommitteeBySlug } from "@/lib/data/content";
import { listFeaturedLinks } from "@/lib/data/links";

export const metadata: Metadata = {
  title: "Kandidatprogrammet",
  description: "Statistik och dataanalys, 180 hp, vid Linköpings universitet – programmet, studiebevakning och stöd.",
};

const LINKS = [
  { href: "/studenter/lankar#kurser", label: "Kurser och tentastatistik" },
  { href: "https://studieinfo.liu.se/program/F7KSA", label: "Programmet i Studieinfo" },
];

export default function BachelorPage() {
  return (
    <Suspense fallback={<HeroSkeleton />}>
      <Bachelor />
    </Suspense>
  );
}

async function Bachelor() {
  const [ubu, shortcuts] = await Promise.all([getCommitteeBySlug("ubu"), listFeaturedLinks()]);
  return (
    <ContentPage
      slug="utbildning"
      kicker="Studenter / Kandidat"
      heroAside={
        <div className="hidden justify-end md:flex">
          <Formula />
        </div>
      }
      aside={
        <div className="sticky top-[calc(var(--header-h)+1.5rem)] space-y-4">
          {ubu && <UbuCard ubu={ubu} />}
          <QuickLinksCard links={shortcuts} extra={LINKS} />
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
