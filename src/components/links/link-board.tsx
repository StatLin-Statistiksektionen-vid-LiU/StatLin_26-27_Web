"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, BarChart, Close, Search, Star } from "@/components/icons";
import { looksLikeCourseCode, type CourseStatSummary } from "@/lib/exam-stats";
import { LINK_CATEGORIES, PROGRAMS, categoryLabel, formatCredits, isExternalUrl, normalizeSearch } from "@/lib/links";
import type { Course, LinkItem, Program } from "@/lib/types";
import { cn, safeExternalUrl } from "@/lib/utils";
import { EditModeLink } from "@/components/edit-mode/editable";
import { GradeLegend, PassRate } from "@/components/exam/grade-bar";
import { LinkIcon } from "./link-icon";
import { pinStore, usePins } from "./pins";

type Summaries = Record<string, CourseStatSummary | null>;

const programLabel = (p: Program) => PROGRAMS.find((x) => x.value === p)?.label ?? p;

/**
 * Länksidan: sök, fästa favoriter, genvägar, alla länkar per grupp och programmens kurser med
 * tentastatistik. Allt filtreras i webbläsaren – listorna är små, och sökningen ska kännas omedelbar.
 */
export function LinkBoard({
  links,
  courses,
  summaries,
  initialProgram = "kandidat",
}: {
  links: LinkItem[];
  courses: Course[];
  summaries: Summaries;
  initialProgram?: Program;
}) {
  const [query, setQuery] = useState("");
  const [program, setProgram] = useState<Program>(initialProgram);
  const deferred = useDeferredValue(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const pins = usePins();

  // "/" hoppar till sökrutan, som på många sajter man söker mycket på.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const index = useMemo(
    () => ({
      links: links.map((l) => ({ item: l, hay: normalizeSearch(`${l.label} ${l.description} ${l.keywords} ${categoryLabel(l.category)}`) })),
      courses: courses.map((c) => ({
        item: c,
        hay: normalizeSearch(`${c.code} ${c.name} ${programLabel(c.program)} termin ${c.term} ${c.elective ? "valbar" : ""}`),
      })),
    }),
    [links, courses],
  );

  const tokens = normalizeSearch(deferred.trim()).split(/\s+/).filter(Boolean);
  const searching = tokens.length > 0;
  const hit = (hay: string) => tokens.every((t) => hay.includes(t));
  const shownLinks = searching ? index.links.filter((x) => hit(x.hay)).map((x) => x.item) : links;
  const shownCourses = searching ? index.courses.filter((x) => hit(x.hay)).map((x) => x.item) : courses;
  const code = looksLikeCourseCode(deferred);

  const featured = shownLinks.filter((l) => l.featured);
  const groups = LINK_CATEGORIES.map((c) => ({ ...c, links: shownLinks.filter((l) => l.category === c.value) })).filter((g) => g.links.length > 0);
  const pinned = pins
    .map((id) =>
      id.startsWith("k")
        ? { id, course: shownCourses.find((c) => c.code === id.slice(1)) }
        : { id, link: shownLinks.find((l) => `l${l.id}` === id) },
    )
    .filter((p) => p.course || p.link);
  const nothing = searching && shownLinks.length === 0 && shownCourses.length === 0;

  function chooseProgram(p: Program) {
    setProgram(p);
    // Fliken hamnar i adressen, så att länken till Master-fliken går att dela och överlever en omladdning.
    const url = new URL(window.location.href);
    if (p === "master") url.searchParams.set("program", "master");
    else url.searchParams.delete("program");
    window.history.replaceState(null, "", url);
  }

  return (
    <div className="container-site pb-24 md:pb-32">
      {/* Sök – fastnar under sidhuvudet, så att man kan söka igen var man än är på sidan. */}
      <div className="sticky top-[calc(var(--header-h)+0.75rem)] z-20 -mt-8">
        <label className="flex h-16 items-center gap-3 rounded-full border border-ink/10 bg-white pl-6 pr-3 shadow-[0_24px_60px_-30px_rgb(10_10_10/0.45)] transition-[border-color,box-shadow] focus-within:border-ink focus-within:shadow-[0_0_0_4px_rgb(255_7_7/0.12),0_24px_60px_-30px_rgb(10_10_10/0.45)]">
          <Search size={20} className="shrink-0 text-stone" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setQuery("");
            }}
            aria-label="Sök bland länkar och kurser"
            placeholder="Sök, t.ex. schema eller 732G33"
            autoComplete="off"
            enterKeyHint="search"
            className="h-full min-w-0 flex-1 bg-transparent text-[1.05rem] outline-none placeholder:text-stone-light focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="grid size-10 shrink-0 place-items-center rounded-full text-stone hover:bg-paper hover:text-ink"
            >
              <Close size={18} />
              <span className="sr-only">Töm sökrutan</span>
            </button>
          ) : (
            <kbd className="mr-2 hidden rounded-md border border-ink/15 px-2 py-0.5 font-mono text-xs text-stone sm:block" title="Tryck / för att söka">
              /
            </kbd>
          )}
        </label>
      </div>
      <p aria-live="polite" className="sr-only">
        {searching ? `${shownLinks.length + shownCourses.length} träffar` : ""}
      </p>

      {code && (
        <Link
          href={`/tentastatistik/${code}`}
          className="group mt-6 flex items-center justify-between gap-4 rounded-[1.5rem] bg-ink px-5 py-4 text-white transition-colors hover:bg-ink-3 md:px-6"
        >
          <span className="flex min-w-0 items-center gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-red">
              <BarChart size={20} />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold">
                Visa tentastatistik för <span className="font-mono">{code}</span>
              </span>
              <span className="block text-sm text-white/60">Betyg per tentatillfälle, för vilken LiU-kurs som helst</span>
            </span>
          </span>
          <ArrowRight size={20} className="shrink-0 transition-transform duration-500 group-hover:translate-x-1" />
        </Link>
      )}

      {nothing && !code && (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-ink/20 bg-white/50 p-8 text-center md:p-12">
          <p className="font-semibold">Inga träffar på ”{deferred.trim()}”</p>
          <p className="mx-auto mt-2 max-w-md text-stone">
            Söker du en kurs? Skriv kurskoden, till exempel 732G33. Och hittar du inte länken här finns ännu fler hos{" "}
            <a href="https://tenuil.com/" target="_blank" rel="noopener noreferrer" className="font-semibold text-red-deep underline underline-offset-2">
              Tenuil
            </a>
            .
          </p>
        </div>
      )}

      {/* Fästa */}
      {pinned.length > 0 && (
        <section aria-labelledby="fasta" className="mt-10">
          <h2 id="fasta" className="kicker flex items-center gap-2 text-stone">
            <Star size={14} fill="currentColor" className="text-red" /> Fästa
          </h2>
          {/* -mb-px gömmer sista radens linje under kortets kant. */}
          <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-ink/10 bg-white">
            <ul className="-mb-px grid md:grid-cols-2 [&>li]:border-b [&>li]:border-ink/[0.07] md:[&>li:nth-child(odd)]:border-r">
              {pinned.map((p) =>
                p.link ? (
                  <LinkRow key={p.id} link={p.link} pinned />
                ) : (
                  <CourseRow key={p.id} course={p.course!} summary={summaries[p.course!.code] ?? null} pinned showProgram />
                ),
              )}
            </ul>
          </div>
        </section>
      )}

      {/* Genvägar */}
      {featured.length > 0 && (
        <section aria-labelledby="genvagar" className="mt-10">
          <div className="flex min-h-9 flex-wrap items-center justify-between gap-3">
            <h2 id="genvagar" className="kicker text-stone">
              Genvägar
            </h2>
            <EditModeLink target={{ type: "page", slug: "lankar" }} href="/admin/lankar" icon="edit">
              Hantera länkar
            </EditModeLink>
          </div>
          <ul className="mt-4 flex flex-wrap gap-3">
            {featured.map((l) => (
              <li key={l.id} className="grow basis-[9.5rem]">
                <LinkTile link={l} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Alla länkar per grupp. Spalterna balanseras av webbläsaren, så korten blir olika långa utan glapp. */}
      {groups.length > 0 && (
        <div className="mt-12 gap-6 md:columns-2 xl:columns-3">
          {groups.map((g) => (
            <section key={g.value} aria-labelledby={`grupp-${g.value}`} className="mb-6 break-inside-avoid overflow-hidden rounded-[1.5rem] border border-ink/10 bg-white">
              <h2 id={`grupp-${g.value}`} className="flex items-baseline justify-between gap-4 px-5 pb-2 pt-5">
                <span className="display-tight text-lg">{g.label}</span>
                <span className="kicker text-stone-light">{g.links.length}</span>
              </h2>
              <ul className="divide-y divide-ink/[0.07]">
                {g.links.map((l) => (
                  <LinkRow key={l.id} link={l} pinned={pins.includes(`l${l.id}`)} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {/* Kurser */}
      {(!searching || shownCourses.length > 0) && courses.length > 0 && (
        <section id="kurser" aria-labelledby="kurser-rubrik" className="mt-16 scroll-mt-24 md:mt-24">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="kicker flex items-center gap-3 text-stone">
                <span className="h-px w-8 bg-ink/20" aria-hidden />
                Våra program
              </p>
              <h2 id="kurser-rubrik" className="display mt-5 text-[clamp(2.1rem,5vw,3.6rem)]">
                Kurser och <span className="mono-accent text-red-deep">tentastatistik</span>
              </h2>
            </div>
            {!searching && (
              <div role="tablist" aria-label="Program" className="inline-flex shrink-0 self-start rounded-full border border-ink/10 bg-white p-1 md:self-auto">
                {PROGRAMS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    role="tab"
                    id={`flik-${p.value}`}
                    aria-selected={program === p.value}
                    aria-controls="kurslista"
                    tabIndex={program === p.value ? 0 : -1}
                    onClick={() => chooseProgram(p.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
                      const next = PROGRAMS[(PROGRAMS.indexOf(p) + 1) % PROGRAMS.length];
                      chooseProgram(next.value);
                      document.getElementById(`flik-${next.value}`)?.focus();
                    }}
                    className={cn(
                      "h-10 rounded-full px-5 text-sm font-semibold transition-colors",
                      program === p.value ? "bg-ink text-white" : "text-stone hover:text-ink",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="max-w-2xl text-stone">
              {searching
                ? "Kurser som matchar sökningen."
                : `${PROGRAMS.find((p) => p.value === program)?.name}. Andel godkända tentaskrivningar de senaste tre åren – klicka på en kurs för varje tillfälle.`}
            </p>
            <GradeLegend />
          </div>

          {searching ? (
            <ul className="mt-8 divide-y divide-ink/[0.07] overflow-hidden rounded-[1.5rem] border border-ink/10 bg-white">
              {shownCourses.map((c) => (
                <CourseRow key={c.code} course={c} summary={summaries[c.code] ?? null} pinned={pins.includes(`k${c.code}`)} showProgram />
              ))}
            </ul>
          ) : (
            <div id="kurslista" role="tabpanel" aria-labelledby={`flik-${program}`} className="mt-8 grid items-start gap-6 lg:grid-cols-2">
              {terms(courses.filter((c) => c.program === program)).map(([term, list]) => (
                <section key={term} aria-labelledby={`termin-${program}-${term}`} className="overflow-hidden rounded-[1.5rem] border border-ink/10 bg-white">
                  <h3 id={`termin-${program}-${term}`} className="flex items-baseline justify-between gap-4 border-b border-ink/10 px-5 py-4">
                    <span className="display-tight text-lg">Termin {term}</span>
                    <span className="kicker text-stone-light">{term % 2 === 1 ? "Hösttermin" : "Vårtermin"}</span>
                  </h3>
                  <ul className="divide-y divide-ink/[0.07]">
                    {list.map((c) => (
                      <CourseRow key={c.code} course={c} summary={summaries[c.code] ?? null} pinned={pins.includes(`k${c.code}`)} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
            <Link href="/tentastatistik" className="group inline-flex items-center gap-2 font-semibold">
              <span className="link-underline">Tentastatistik för andra kurser</span>
              <span className="grid size-9 place-items-center rounded-full bg-red text-white transition-transform duration-500 group-hover:translate-x-1">
                <ArrowRight size={16} />
              </span>
            </Link>
            <EditModeLink target={{ type: "courses" }} href="/admin/kurser" icon="edit">
              Hantera kurser
            </EditModeLink>
          </div>
        </section>
      )}
    </div>
  );
}

/** Kurserna grupperade per termin, i terminsordning. */
function terms(list: Course[]): [number, Course[]][] {
  const map = new Map<number, Course[]>();
  for (const c of list) map.set(c.term, [...(map.get(c.term) ?? []), c]);
  return [...map.entries()].sort((a, b) => a[0] - b[0]);
}

function LinkTile({ link }: { link: LinkItem }) {
  const href = safeExternalUrl(link.url);
  if (!href) return null;
  const external = isExternalUrl(href);
  const Arrow = external ? ArrowUpRight : ArrowRight;
  const body = (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-full bg-ink text-white transition-colors duration-300 group-hover:bg-red">
          <LinkIcon name={link.icon} size={20} />
        </span>
        <Arrow size={16} className="text-stone-light transition-[color,transform] duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-red" />
      </span>
      <span className="mt-5 block font-semibold leading-tight">{link.label}</span>
      {link.description && <span className="mt-1 line-clamp-2 block text-sm leading-snug text-stone">{link.description}</span>}
      {external && <span className="sr-only"> (öppnas i en ny flik)</span>}
    </>
  );
  const className = "group flex h-full flex-col rounded-[1.25rem] border border-ink/10 bg-white p-4 transition-colors duration-300 hover:border-ink/40";
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {body}
    </a>
  ) : (
    <Link href={href} className={className}>
      {body}
    </Link>
  );
}

function LinkRow({ link, pinned }: { link: LinkItem; pinned: boolean }) {
  const href = safeExternalUrl(link.url);
  if (!href) return null;
  const external = isExternalUrl(href);
  const Arrow = external ? ArrowUpRight : ArrowRight;
  const body = (
    <>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-snug">{link.label}</span>
        {link.description && <span className="mt-0.5 block text-sm leading-snug text-stone">{link.description}</span>}
      </span>
      <Arrow size={15} className="mt-1 shrink-0 text-stone-light transition-colors group-hover:text-red" />
      {external && <span className="sr-only"> (öppnas i en ny flik)</span>}
    </>
  );
  const linkClass = "group flex min-w-0 flex-1 items-start gap-3 py-3 pl-5";
  return (
    <li className="flex items-stretch transition-colors hover:bg-paper/60">
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {body}
        </a>
      ) : (
        <Link href={href} className={linkClass}>
          {body}
        </Link>
      )}
      <PinButton id={`l${link.id}`} label={link.label} pinned={pinned} />
    </li>
  );
}

function CourseRow({
  course,
  summary,
  pinned,
  showProgram,
}: {
  course: Course;
  summary: CourseStatSummary | null;
  pinned: boolean;
  showProgram?: boolean;
}) {
  const meta = [
    formatCredits(course.credits),
    course.period && `period ${course.period}`,
    showProgram && `${programLabel(course.program)}, termin ${course.term}`,
  ].filter(Boolean);
  return (
    <li className="flex items-stretch transition-colors hover:bg-paper/60">
      <Link href={`/tentastatistik/${course.code}`} className="group flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2 py-3.5 pl-5">
        <span className="min-w-0 flex-[1_1_14rem]">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-mono text-[0.8rem] font-semibold tracking-tight text-red-deep">{course.code}</span>
            {course.elective ? <span className="chip h-5 bg-paper-2 px-2 text-[0.6rem] text-stone">Valbar</span> : null}
          </span>
          <span className="mt-0.5 block font-semibold leading-snug group-hover:underline group-hover:decoration-1 group-hover:underline-offset-2">{course.name}</span>
          <span className="mt-0.5 block text-sm text-stone">{meta.join(" · ")}</span>
        </span>
        <PassRate summary={summary} />
      </Link>
      <PinButton id={`k${course.code}`} label={`${course.code} ${course.name}`} pinned={pinned} />
    </li>
  );
}

function PinButton({ id, label, pinned }: { id: string; label: string; pinned: boolean }) {
  return (
    <button
      type="button"
      onClick={() => pinStore.toggle(id)}
      aria-pressed={pinned}
      title={pinned ? "Ta bort från Fästa" : "Fäst överst på sidan"}
      className={cn("grid w-12 shrink-0 place-items-center transition-colors", pinned ? "text-red" : "text-stone-light hover:text-ink")}
    >
      <Star size={18} fill={pinned ? "currentColor" : "none"} />
      <span className="sr-only">Fäst {label}</span>
    </button>
  );
}
