import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ContentPage } from "@/components/content/content-page";
import { EventRow } from "@/components/content/event-card";
import { UbuCard } from "@/components/content/ubu-card";
import { ArrowRight } from "@/components/icons";
import { QuickLinksCard } from "@/components/links/quick-links";
import { HeroSkeleton } from "@/components/ui/skeletons";
import { getCommitteeBySlug } from "@/lib/data/content";
import { listUpcomingEvents } from "@/lib/data/events";
import { listFeaturedLinks } from "@/lib/data/links";

export const metadata: Metadata = {
  title: "Masterprogrammet",
  description: "Statistics and Machine Learning, 120 hp, vid Linköpings universitet – StatLin är sektionen för masterstudenterna också.",
  alternates: { languages: { sv: "/studenter/master", en: "/en/masters" } },
};

const LINKS = [
  { href: "/tentastatistik", label: "Tentastatistik" },
  { href: "https://studieinfo.liu.se/program/F7MML", label: "Programmet i Studieinfo" },
];

export default function MasterPage() {
  return (
    <Suspense fallback={<HeroSkeleton />}>
      <Master />
    </Suspense>
  );
}

async function Master() {
  const [ubu, events, shortcuts] = await Promise.all([getCommitteeBySlug("ubu"), listUpcomingEvents(3), listFeaturedLinks()]);
  return (
    <ContentPage
      slug="master"
      kicker="Studenter / Master"
      heroAside={
        <div className="hidden justify-end md:flex">
          <Gradient />
        </div>
      }
      aside={
        <div className="sticky top-[calc(var(--header-h)+1.5rem)] space-y-4">
          <Link href="/en/masters" hrefLang="en" lang="en" className="noise group relative block overflow-hidden rounded-[1.75rem] bg-red p-7 text-white">
            <div className="grid-paper pointer-events-none absolute inset-0 text-white" aria-hidden />
            <p className="kicker relative text-white/80">The programme is taught in English</p>
            <p className="display-tight relative mt-3 text-2xl">Read this page in English</p>
            <span className="relative mt-5 inline-flex items-center gap-2 font-semibold">
              For master&apos;s students <ArrowRight size={18} className="transition-transform duration-500 group-hover:translate-x-1" />
            </span>
          </Link>
          <div className="rounded-[1.75rem] border border-ink/10 bg-white p-6">
            <p className="kicker text-stone">Nästa på schemat</p>
            <div className="mt-2">
              {events.length > 0 ? events.map((e) => <EventRow key={e.id} event={e} />) : <p className="py-6 text-stone">Nya evenemang kommer snart.</p>}
            </div>
            <Link href="/evenemang" className="btn btn-ink mt-5 w-full">
              Hela kalendern <ArrowRight size={18} />
            </Link>
          </div>
          {ubu && <UbuCard ubu={ubu} />}
          <QuickLinksCard links={shortcuts} extra={LINKS} />
        </div>
      }
    />
  );
}

/** Dekor: ett steg i gradientnedstigning som "formelkort", syskon till kandidatens minsta kvadrat. */
function Gradient() {
  return (
    <div className="w-full max-w-sm -rotate-2 rounded-[1.5rem] border border-white/15 bg-white/[0.04] p-7 backdrop-blur">
      <p className="kicker text-white/45">Gradientnedstigning</p>
      <p className="mt-4 font-serif text-[2.1rem] italic leading-tight text-white">
        θ<sub className="text-lg">t+1</sub> = θ<sub className="text-lg">t</sub> − η∇L(θ<sub className="text-lg">t</sub>)
      </p>
      <div className="mt-5 h-px bg-white/10" />
      <p className="mt-4 font-mono text-xs leading-relaxed text-white/50">
        epoker = 2 år · n = 120 hp
        <br />
        <span className="text-red">η = 0,01</span>
      </p>
    </div>
  );
}
