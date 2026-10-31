import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CourseSearch } from "@/components/exam/course-search";
import { GradeLegend, PassRate } from "@/components/exam/grade-bar";
import { ArrowUpRight } from "@/components/icons";
import { PageHero } from "@/components/ui/page-hero";
import { PageSkeleton } from "@/components/ui/skeletons";
import { getCourseSummaries } from "@/lib/data/exam-stats";
import { listCourses } from "@/lib/data/links";
import { normalizeCourseCode } from "@/lib/exam-stats";
import { PROGRAMS } from "@/lib/links";

export const metadata: Metadata = {
  title: "Tentastatistik",
  description: "Hur brukar tentan gå? Sök på kurskoden för vilken LiU-kurs som helst och se betygen på varje tentatillfälle.",
  alternates: { canonical: "/tentastatistik" },
};

/** Fler ställen med tentastatistik – samma som Tenuil tipsar om. */
const SOURCES = [
  { href: "https://ysektionen.se/student/tentastatistik/", label: "Y-sektionen", text: "Betygsfördelning för alla LiU-kurser." },
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
      <div className="container-site relative z-20 -mt-8">
        <Suspense fallback={<CourseSearch />}>
          <Search searchParams={props.searchParams} />
        </Suspense>
      </div>
      <Suspense fallback={<PageSkeleton />}>
        <OurCourses />
      </Suspense>
      <MoreSources />
    </>
  );
}

async function Search({ searchParams }: { searchParams: PageProps<"/tentastatistik">["searchParams"] }) {
  const [sp, courses] = await Promise.all([searchParams, listCourses({ activeOnly: true })]);
  // Giltiga koder har redan skickats vidare till kurssidan i src/proxy.ts – det som kommer hit är inte en kurskod.
  const kod = typeof sp.kod === "string" ? sp.kod.slice(0, 40) : "";
  return <CourseSearch known={courses.map((c) => ({ code: c.code, name: c.name }))} defaultValue={kod} invalid={kod.trim() !== "" && !normalizeCourseCode(kod)} />;
}

async function OurCourses() {
  const courses = await listCourses({ activeOnly: true });
  if (courses.length === 0) return null;
  const summaries = await getCourseSummaries(courses.map((c) => c.code));
  return (
    <section aria-labelledby="vara-kurser" className="container-site py-16 md:py-24">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="kicker flex items-center gap-3 text-stone">
            <span className="h-px w-8 bg-ink/20" aria-hidden />
            Snabbval
          </p>
          <h2 id="vara-kurser" className="display mt-5 text-[clamp(2.1rem,5vw,3.6rem)]">
            Våra <span className="mono-accent text-red-deep">kurser</span>
          </h2>
          <p className="mt-4 max-w-2xl text-stone">Kurserna på kandidat- och masterprogrammet, med andel godkända tentaskrivningar de senaste tre åren.</p>
        </div>
        <GradeLegend />
      </div>
      <div className="mt-10 grid items-start gap-6 lg:grid-cols-2">
        {PROGRAMS.map((p) => {
          const list = courses.filter((c) => c.program === p.value);
          if (list.length === 0) return null;
          return (
            <section key={p.value} aria-labelledby={`program-${p.value}`} className="overflow-hidden rounded-[1.5rem] border border-ink/10 bg-white">
              <h3 id={`program-${p.value}`} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-ink/10 px-5 py-4">
                <span className="display-tight text-lg">{p.label}</span>
                <span className="kicker text-stone-light">{p.name}</span>
              </h3>
              <ul className="divide-y divide-ink/[0.07]">
                {list.map((c) => (
                  <li key={c.code}>
                    <Link
                      href={`/tentastatistik/${c.code}`}
                      className="group flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 transition-colors hover:bg-paper/60"
                    >
                      <span className="min-w-0 flex-[1_1_14rem]">
                        <span className="block font-mono text-[0.8rem] font-semibold tracking-tight text-red-deep">{c.code}</span>
                        <span className="block font-semibold leading-snug group-hover:underline group-hover:decoration-1 group-hover:underline-offset-2">
                          {c.name}
                        </span>
                      </span>
                      <PassRate summary={summaries[c.code] ?? null} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </section>
  );
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
        <ul className="grid gap-4 sm:grid-cols-3 lg:col-span-8">
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
