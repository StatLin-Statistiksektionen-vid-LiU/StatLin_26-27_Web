import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CourseSearch } from "@/components/exam/course-search";
import { ExamChart } from "@/components/exam/exam-chart";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "@/components/icons";
import { PageHero } from "@/components/ui/page-hero";
import { HeroSkeleton } from "@/components/ui/skeletons";
import { getExamStats } from "@/lib/data/exam-stats";
import { getCourseByCode, listCourses } from "@/lib/data/links";
import { formatTimestamp, todayLocal } from "@/lib/dates";
import { normalizeCourseCode, visibleOccasions } from "@/lib/exam-stats";
import { PROGRAMS, formatCredits } from "@/lib/links";
import type { Course } from "@/lib/types";
import { safeExternalUrl } from "@/lib/utils";

type Params = PageProps<"/tentastatistik/[kod]">["params"];

/** Gemener och mellanslag rättas redan i src/proxy.ts, så hit kommer koden med versaler – eller något som inte är en kurskod. */
async function load(params: Params) {
  const { kod } = await params;
  const code = normalizeCourseCode(kod);
  if (!code) return null;
  const [result, course] = await Promise.all([getExamStats(code), getCourseByCode(code)]);
  return { code, course, ...result };
}

export async function generateMetadata({ params }: PageProps<"/tentastatistik/[kod]">): Promise<Metadata> {
  const data = await load(params);
  if (!data?.stats) {
    const title = data?.course ? `Tentastatistik ${data.code} ${data.course.name}` : "Hittade ingen tentastatistik";
    return { title, robots: { index: false } };
  }
  const name = data.stats.title.sv || data.stats.title.en || data.course?.name || "";
  const course = `${data.code}${name ? ` ${name}` : ""}`;
  return {
    title: `Tentastatistik ${course}`,
    description: `Betyg och andel godkända på varje tentatillfälle i ${course} vid Linköpings universitet.`,
    alternates: { canonical: `/tentastatistik/${data.code}` },
  };
}

export default function CourseStatsPage(props: PageProps<"/tentastatistik/[kod]">) {
  return (
    <Suspense fallback={<HeroSkeleton />}>
      <CourseStats params={props.params} />
    </Suspense>
  );
}

async function CourseStats({ params }: { params: Params }) {
  const data = await load(params);
  if (!data?.stats) return <Missing code={data?.code ?? null} course={data?.course ?? null} unavailable={data?.unavailable ?? false} />;
  const { code, course, stats, fetchedAt } = data;
  const name = stats.title.sv || course?.name || stats.title.en;
  const hasResults = stats.modules.some((m) => visibleOccasions(m).length > 0);
  const known = await listCourses({ activeOnly: true });

  return (
    <>
      <PageHero
        kicker="Studenter / Tentastatistik"
        title={code}
        lead={
          name && (
            <>
              <span className="block text-white">{name}</span>
              {stats.title.en && stats.title.en !== name && (
                <span lang="en" className="mt-1 block text-base text-white/50">
                  {stats.title.en}
                </span>
              )}
            </>
          )
        }
        aside={course ? <CourseFacts course={course} /> : undefined}
      >
        <CourseLinks code={code} course={course} />
      </PageHero>

      <section className="container-site py-12 md:py-16">
        {hasResults ? (
          <ExamChart stats={stats} today={todayLocal()} />
        ) : (
          <p className="max-w-2xl text-lg text-stone">
            Det finns statistik för kursen, men inget tentatillfälle har minst fem resultat. Så små grupper visar vi inte – titta hos Y-sektionen
            eller liustats om du vill se mer.
          </p>
        )}
        <p className="mt-12 max-w-3xl border-t border-ink/10 pt-6 text-sm leading-relaxed text-stone">
          Statistiken kommer från LiU via det öppna API som{" "}
          <a href="https://liustats.se/" target="_blank" rel="noopener noreferrer" className="link-underline text-ink">
            liustats.se
          </a>{" "}
          använder, och hämtas om en gång per dygn{fetchedAt ? ` – senast ${formatTimestamp(fetchedAt)}` : ""}. Den räknar skrivningar, inte
          studenter: den som skriver om tentan räknas på varje tillfälle.
        </p>
      </section>

      <section aria-labelledby="sok-igen" className="border-t border-ink/10 bg-paper-2/50 py-14 md:py-20">
        <div className="container-site">
          <h2 id="sok-igen" className="display-tight text-[clamp(1.6rem,3vw,2.4rem)]">
            Sök en annan kurs
          </h2>
          <div className="mt-6">
            <CourseSearch known={known.map((c) => ({ code: c.code, name: c.name }))} />
          </div>
        </div>
      </section>
    </>
  );
}

/** Ingen statistik: okänd kod, en kod som inte ser ut som en kurskod, eller en källa som inte svarar. */
async function Missing({ code, course, unavailable }: { code: string | null; course: Course | null; unavailable: boolean }) {
  const known = await listCourses({ activeOnly: true });
  const lead = unavailable
    ? "Källan för tentastatistiken svarar inte just nu. Försök igen om en stund, eller titta hos Y-sektionen och liustats så länge."
    : course
      ? `${course.name} finns på vårt program, men LiU har ingen tentastatistik för kursen än – den kan vara ny eller sakna tentamen.`
      : code
        ? `Hittade ingen tentastatistik för ${code}. Kontrollera kurskoden, eller sök på en annan kurs.`
        : "Det där ser inte ut som en kurskod. LiU:s kurskoder har sex tecken, till exempel 732G33 eller TATA24.";
  return (
    <>
      <PageHero
        kicker="Studenter / Tentastatistik"
        title={code ?? "Tentastatistik"}
        fitTitle={code ? undefined : "Tentastatistik"}
        lead={lead}
        aside={course ? <CourseFacts course={course} /> : undefined}
      />
      <div className="container-site relative z-20 -mt-8 pb-20">
        <CourseSearch known={known.map((c) => ({ code: c.code, name: c.name }))} />
        {code && (
          <div className="mt-10">
            <p className="kicker text-stone">Leta vidare</p>
            <CourseLinks code={code} course={course} light />
          </div>
        )}
        <Link href="/tentastatistik" className="mt-10 inline-flex items-center gap-2 font-semibold">
          <ArrowLeft size={16} />
          <span className="link-underline">Till tentastatistiken</span>
        </Link>
      </div>
    </>
  );
}

/** Kursen hos LiU och hos andra som samlar tentor och statistik. */
function CourseLinks({ code, course, light }: { code: string; course: Course | null; light?: boolean }) {
  const links = [
    { href: `https://studieinfo.liu.se/kurs/${code}`, label: "Kursplan" },
    { href: `https://liutentor.se/search/${code}`, label: "Gamla tentor" },
    { href: `https://ysektionen.se/student/tentastatistik/${code.toLowerCase()}/`, label: "Y-sektionen" },
    { href: `https://liustats.se/${code}`, label: "liustats" },
  ];
  const extra = course && safeExternalUrl(course.url);
  if (extra) links.splice(1, 0, { href: extra, label: "Kurssidan" });
  return (
    <ul className="mt-4 flex flex-wrap gap-3">
      {links.map((l) => (
        <li key={l.label}>
          <a href={l.href} target="_blank" rel="noopener noreferrer" className={light ? "btn btn-ghost btn-sm" : "btn btn-ghost-dark btn-sm"}>
            {l.label}
            <ArrowUpRight size={14} />
            <span className="sr-only"> (öppnas i en ny flik)</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

/** För kurser på våra program: var i programmet kursen ligger. */
function CourseFacts({ course }: { course: Course }) {
  const program = PROGRAMS.find((p) => p.value === course.program);
  const facts = [
    ["Program", program ? `${program.label}, ${program.name}` : course.program],
    ["Termin", course.period ? `${course.term}, period ${course.period}` : String(course.term)],
    ["Omfattning", course.elective ? `${formatCredits(course.credits)}, valbar` : formatCredits(course.credits)],
  ];
  return (
    <div className="rounded-[1.5rem] border border-white/15 bg-white/[0.04] p-6">
      <p className="kicker text-white/60">På StatLins program</p>
      <dl className="mt-4 divide-y divide-white/10 text-sm">
        {facts.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <dt className="text-white/60">{label}</dt>
            <dd className="text-right font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <Link
        href={`/studenter/lankar${course.program === "master" ? "?program=master" : ""}#kurser`}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white"
      >
        <span className="link-underline">Alla kurser på programmet</span>
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
