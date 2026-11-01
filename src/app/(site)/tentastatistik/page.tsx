import type { Metadata } from "next";
import { Suspense } from "react";
import { CourseSearch } from "@/components/exam/course-search";
import { ArrowUpRight } from "@/components/icons";
import { PageHero } from "@/components/ui/page-hero";
import { normalizeCourseCode } from "@/lib/exam-stats";

export const metadata: Metadata = {
  title: "Tentastatistik",
  description: "Hur brukar tentan gå? Sök på kurskoden för vilken LiU-kurs som helst och se betygen på varje tentatillfälle.",
  alternates: { canonical: "/tentastatistik" },
};

/** Fler ställen med tentastatistik. */
const SOURCES = [
  { href: "https://liustats.se/", label: "liustats", text: "Samma källa som vi använder, med fler diagram." },
  {
    href: "https://liuonline.sharepoint.com/sites/Lisam/SitePages/Tentamenstatistik.aspx",
    label: "LiU, officiell",
    text: "LiU:s egen sammanställning i Lisam. Kräver inloggning.",
  },
];

export default function ExamStatsPage(props: PageProps<"/tentastatistik">) {
  return (
    <>
      <PageHero
        kicker="Studenter / Tentastatistik"
        title={
          <>
            Tenta<span className="text-red">statistik</span>
          </>
        }
        fitTitle="Tentastatistik"
        lead="Hur brukar tentan gå? Sök på kurskoden – för vilken LiU-kurs som helst – och se betygen på varje tentatillfälle."
      />
      {/* Sökfältet ligger över hörnet på sidhuvudet, så att förslagslistan inte klipps av det. */}
      <div className="container-site relative z-20 -mt-8 pb-16 md:pb-24">
        <Suspense fallback={<CourseSearch />}>
          <Search searchParams={props.searchParams} />
        </Suspense>
      </div>
      <MoreSources />
    </>
  );
}

async function Search({ searchParams }: { searchParams: PageProps<"/tentastatistik">["searchParams"] }) {
  const sp = await searchParams;
  // Giltiga koder har redan skickats vidare till kurssidan i src/proxy.ts – det som kommer hit är inte en kurskod.
  const kod = typeof sp.kod === "string" ? sp.kod.slice(0, 40) : "";
  return <CourseSearch defaultValue={kod} invalid={kod.trim() !== "" && !normalizeCourseCode(kod)} />;
}

function MoreSources() {
  return (
    <section aria-labelledby="fler-kallor" className="border-t border-ink/10 bg-paper-2/50 py-16 md:py-20">
      <div className="container-site grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="kicker text-stone">Om statistiken</p>
          <h2 id="fler-kallor" className="display-tight mt-4 text-[clamp(1.6rem,3vw,2.4rem)]">
            Fler källor
          </h2>
          <p className="mt-4 leading-relaxed text-stone">
            Statistiken kommer från LiU via det öppna API som liustats.se använder, och hämtas om en gång per dygn. Den räknar skrivningar, inte
            studenter – den som skriver om tentan räknas på varje tillfälle.
          </p>
        </div>
        <ul className="grid gap-4 self-start sm:grid-cols-2 lg:col-span-8">
          {SOURCES.map((s) => (
            <li key={s.href}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex h-full flex-col rounded-[1.25rem] border border-ink/10 bg-white p-5 transition-colors duration-300 hover:border-ink/40"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="font-semibold">{s.label}</span>
                  <ArrowUpRight size={16} className="mt-1 text-stone-light transition-colors group-hover:text-red" />
                </span>
                <span className="mt-2 text-sm leading-snug text-stone">{s.text}</span>
                <span className="sr-only"> (öppnas i en ny flik)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
