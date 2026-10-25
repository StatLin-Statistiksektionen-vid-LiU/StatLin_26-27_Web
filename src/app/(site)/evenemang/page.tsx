import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { EventCard, EventRow } from "@/components/content/event-card";
import { Calendar, ChevronLeft, ChevronRight, Rss } from "@/components/icons";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { PageSkeleton } from "@/components/ui/skeletons";
import { listCommittees } from "@/lib/data/content";
import { listEventsBetween, listPastEvents, listUpcomingEvents } from "@/lib/data/events";
import { monthGrid, monthLabel, todayLocal } from "@/lib/dates";
import type { EventItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Evenemang",
  description: "Sittningar, pubar, idrott, föreläsningar och sektionsmöten – allt som händer på StatLin.",
};

export default function EventsPage(props: PageProps<"/evenemang">) {
  return (
    <>
      <PageHero
        kicker="Kalender"
        title={
          <>
            Evene<span className="text-red">mang</span>
          </>
        }
        lead="Sittningar, pubar, idrott, föreläsningar och sektionsmöten. Prenumerera på kalendern så missar du inget."
      >
        <div className="flex flex-wrap gap-3">
          <a href="/kalender.ics" className="btn btn-red">
            <Rss size={18} /> Prenumerera på kalendern
          </a>
        </div>
      </PageHero>
      <Suspense fallback={<PageSkeleton />}>
        <EventsContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function EventsContent({ searchParams }: { searchParams: PageProps<"/evenemang">["searchParams"] }) {
  const sp = await searchParams;
  await connection();
  const view = sp.vy === "kalender" ? "kalender" : "lista";
  const filter = typeof sp.utskott === "string" ? sp.utskott : undefined;
  const month = typeof sp.manad === "string" && /^\d{4}-\d{2}$/.test(sp.manad) ? sp.manad : todayLocal().slice(0, 7);

  const committees = (await listCommittees({ visibleOnly: true })).filter((c) => c.kind !== "ovrigt");
  const active = committees.find((c) => c.slug === filter);

  const href = (params: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const merged = { vy: view === "kalender" ? "kalender" : undefined, utskott: filter, manad: view === "kalender" ? month : undefined, ...params };
    for (const [k, v] of Object.entries(merged)) if (v) q.set(k, v);
    const s = q.toString();
    return `/evenemang${s ? `?${s}` : ""}`;
  };

  return (
    <section className="container-site py-14 md:py-20">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="list" aria-label="Filtrera på utskott">
          <FilterChip href={href({ utskott: undefined })} active={!active}>
            Alla
          </FilterChip>
          {committees.map((c) => (
            <FilterChip key={c.id} href={href({ utskott: c.slug })} active={active?.id === c.id} color={c.accent}>
              {c.short_name}
            </FilterChip>
          ))}
        </div>
        <div className="inline-flex shrink-0 rounded-full border border-ink/15 bg-white p-1" role="tablist" aria-label="Vy">
          <Link
            href={href({ vy: undefined, manad: undefined })}
            role="tab"
            aria-selected={view === "lista"}
            className={cn("rounded-full px-5 py-2 text-sm font-semibold transition-colors", view === "lista" ? "bg-ink text-white" : "text-ink/60 hover:text-ink")}
          >
            Lista
          </Link>
          <Link
            href={href({ vy: "kalender" })}
            role="tab"
            aria-selected={view === "kalender"}
            className={cn("inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors", view === "kalender" ? "bg-ink text-white" : "text-ink/60 hover:text-ink")}
          >
            <Calendar size={15} /> Kalender
          </Link>
        </div>
      </div>

      {view === "kalender" ? (
        <MonthView month={month} committeeId={active?.id} href={href} />
      ) : (
        <ListView committeeId={active?.id} committeeName={active?.short_name} />
      )}
    </section>
  );
}

function FilterChip({ href, active, color, children }: { href: string; active: boolean; color?: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      role="listitem"
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-all",
        active ? "border-ink bg-ink text-white" : "border-ink/15 bg-white text-ink/75 hover:border-ink/40 hover:text-ink",
      )}
    >
      {color && <span className="size-2 rounded-full" style={{ background: active ? "#fff" : color }} aria-hidden />}
      {children}
    </Link>
  );
}

async function ListView({ committeeId, committeeName }: { committeeId?: number; committeeName?: string }) {
  const [upcoming, past] = await Promise.all([listUpcomingEvents(60, committeeId), listPastEvents(18, committeeId)]);

  // Gruppera kommande per månad
  const groups = new Map<string, EventItem[]>();
  for (const e of upcoming) {
    const key = e.starts_at.slice(0, 7);
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }

  return (
    <>
      {upcoming.length === 0 ? (
        <div className="mt-12 rounded-[1.75rem] border border-dashed border-ink/20 p-14 text-center">
          <p className="display-tight text-2xl">Tomt i kalendern</p>
          <p className="mt-2 text-stone">
            {committeeName ? `${committeeName} har inga kommande evenemang just nu.` : "Inga kommande evenemang just nu – håll utkik!"}
          </p>
        </div>
      ) : (
        [...groups.entries()].map(([key, events]) => {
          const [y, m] = key.split("-").map(Number);
          return (
            <div key={key} className="mt-14">
              <div className="flex items-baseline gap-4 border-b border-ink/10 pb-4">
                <h2 className="display-tight text-[clamp(1.6rem,3vw,2.4rem)]">{monthLabel(y, m)}</h2>
                <span className="kicker text-stone">
                  {events.length} {events.length === 1 ? "evenemang" : "evenemang"}
                </span>
              </div>
              <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((e, i) => (
                  <Reveal key={e.id} delay={(i % 3) * 80}>
                    <EventCard event={e} className="h-full" />
                  </Reveal>
                ))}
              </div>
            </div>
          );
        })
      )}

      {past.length > 0 && (
        <div className="mt-24">
          <h2 className="kicker text-stone">Tidigare evenemang</h2>
          <div className="mt-4 border-t border-ink/10">
            {past.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

async function MonthView({
  month,
  committeeId,
  href,
}: {
  month: string;
  committeeId?: number;
  href: (p: Record<string, string | undefined>) => string;
}) {
  const [y, m] = month.split("-").map(Number);
  const days = monthGrid(y, m);
  const all = await listEventsBetween(`${days[0].date}T00:00`, `${days[days.length - 1].date}T23:59`);
  const events = committeeId ? all.filter((e) => e.committee_id === committeeId) : all;
  const today = todayLocal();
  const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  // Kvällsevenemang som slutar efter midnatt visas bara på startdagen; flerdagars heldagsevenemang på alla dagar.
  const byDay = (date: string) =>
    events.filter((e) => {
      const start = e.starts_at.slice(0, 10);
      if (start === date) return true;
      return !!e.all_day && !!e.ends_at && start < date && e.ends_at.slice(0, 10) >= date;
    });
  const monthEvents = events.filter((e) => e.starts_at.slice(0, 7) === month);

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between">
        <h2 className="display-tight text-[clamp(1.6rem,3vw,2.4rem)]">{monthLabel(y, m)}</h2>
        <div className="flex gap-2">
          <Link href={href({ manad: prev })} className="grid size-11 place-items-center rounded-full border border-ink/15 bg-white hover:border-ink" aria-label="Föregående månad">
            <ChevronLeft size={18} />
          </Link>
          <Link href={href({ manad: undefined })} className="hidden h-11 items-center rounded-full border border-ink/15 bg-white px-4 text-sm font-semibold hover:border-ink sm:inline-flex">
            I dag
          </Link>
          <Link href={href({ manad: next })} className="grid size-11 place-items-center rounded-full border border-ink/15 bg-white hover:border-ink" aria-label="Nästa månad">
            <ChevronRight size={18} />
          </Link>
        </div>
      </div>

      {/* Desktop: rutnät */}
      <div className="mt-6 hidden overflow-hidden rounded-[1.5rem] border border-ink/10 bg-white md:block">
        <div className="grid grid-cols-7 border-b border-ink/10 bg-paper-2/50">
          {["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"].map((d) => (
            <div key={d} className="kicker px-3 py-3 text-stone">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            const list = byDay(d.date);
            const isToday = d.date === today;
            return (
              <div
                key={d.date}
                className={cn(
                  "min-h-[8.5rem] border-ink/10 p-2",
                  i % 7 !== 6 && "border-r",
                  i < days.length - 7 && "border-b",
                  !d.inMonth && "bg-paper/60",
                )}
              >
                <span
                  className={cn(
                    "inline-grid size-7 place-items-center rounded-full font-mono text-xs tabular",
                    isToday ? "bg-red font-bold text-white" : d.inMonth ? "text-ink" : "text-stone-light",
                  )}
                >
                  {Number(d.date.slice(8))}
                </span>
                <ul className="mt-1 space-y-1">
                  {list.slice(0, 3).map((e) => (
                    <li key={e.id}>
                      <Link
                        href={`/evenemang/${e.slug}`}
                        className="group block truncate rounded-lg px-2 py-1 text-[0.78rem] font-semibold leading-tight text-white transition-transform hover:-translate-y-px"
                        style={{ background: e.committee?.accent ?? "#0a0a0a" }}
                        title={e.title}
                      >
                        <span className="font-mono font-normal opacity-80">{e.all_day ? "" : e.starts_at.slice(11, 16)} </span>
                        {e.title}
                      </Link>
                    </li>
                  ))}
                  {list.length > 3 && <li className="px-2 text-[0.72rem] text-stone">+{list.length - 3} till</li>}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobil: lista för månaden */}
      <div className="mt-6 border-t border-ink/10 md:hidden">
        {monthEvents.length === 0 ? (
          <p className="py-10 text-center text-stone">Inga evenemang den här månaden.</p>
        ) : (
          monthEvents.map((e) => <EventRow key={e.id} event={e} />)
        )}
      </div>
    </div>
  );
}
