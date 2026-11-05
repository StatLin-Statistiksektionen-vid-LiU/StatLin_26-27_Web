import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { fillWheelSuggestions } from "@/app/admin/_actions/arshjul";
import { AdminHeader, EmptyState, Notice } from "@/components/admin/ui";
import { FillSuggestionsButton } from "@/components/admin/wheel-buttons";
import { WheelDial, WheelLegend } from "@/components/admin/wheel-dial";
import { WheelItemRow } from "@/components/admin/wheel-item";
import { ScrollChipIntoView, ScrollToListOnFilter } from "@/components/admin/wheel-scroll";
import { ChevronLeft, ChevronRight, Plus } from "@/components/icons";
import { effectiveStatus, itemTerm, MONTHS, MONTHS_SHORT, monthParam, TERM_NAMES, termOfMonth, yearInRange, type Term, type WheelItem } from "@/lib/arshjul";
import { WHEEL_SUGGESTIONS } from "@/lib/arshjul-forslag";
import { canChangeWheelItem } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { listWheelItems, wheelStates } from "@/lib/data/arshjul";
import { todayLocal } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const metadata = { title: "Årshjul" };

export default function WheelPage(props: PageProps<"/admin/arshjul">) {
  return (
    <Suspense>
      <Wheel searchParams={props.searchParams} />
    </Suspense>
  );
}

const countLabel = (n: number) => (n === 1 ? "1 punkt" : `${n} punkter`);

async function Wheel({ searchParams }: { searchParams: PageProps<"/admin/arshjul">["searchParams"] }) {
  const user = await requireUser();
  const sp = await searchParams;
  const today = todayLocal();
  const thisYear = Number(today.slice(0, 4));
  const requested = typeof sp.ar === "string" && /^\d{4}$/.test(sp.ar) ? Number(sp.ar) : thisYear;
  const year = yearInRange(requested, today) ? requested : thisYear;
  const month = monthParam(sp.manad);
  const [items, stateOf] = await Promise.all([listWheelItems(), wheelStates([year])]);

  const query = (y: number, m: number | null) => {
    const q = new URLSearchParams();
    if (y !== thisYear) q.set("ar", String(y));
    if (m !== null) q.set("manad", String(m));
    const s = q.toString();
    return s ? `/admin/arshjul?${s}` : "/admin/arshjul";
  };
  const href = (m: number | null) => query(year, m);
  const currentMonth = year === thisYear ? Number(today.slice(5, 7)) : null;

  const row = (item: WheelItem) => {
    const state = stateOf(item.id, year);
    return (
      <li key={item.id}>
        <WheelItemRow item={item} year={year} state={state} status={effectiveStatus(state)} canChange={canChangeWheelItem(user, item)} />
      </li>
    );
  };
  const group = (key: string, heading: ReactNode, list: WheelItem[], now = false) =>
    list.length > 0 && (
      <section key={key} aria-labelledby={`grupp-${key}`} className="mt-6 first:mt-0">
        <h2 id={`grupp-${key}`} className="kicker flex items-center gap-2 text-ink">
          {now && <span className="size-2 rounded-full bg-red" aria-hidden />}
          {heading}
          {now && <span className="text-stone">· Nu</span>}
          <span className="ml-auto text-stone tabular">{list.length}</span>
        </h2>
        <ul className="mt-2.5 space-y-2.5">{list.map(row)}</ul>
      </section>
    );
  const monthGroup = (m: number) => group(`m${m}`, MONTHS[m - 1], items.filter((i) => i.month === m), m === currentMonth);
  const termGroup = (term: Term) => group(term, `${TERM_NAMES[term]}, ingen bestämd månad`, items.filter((i) => i.month === null && itemTerm(i) === term));

  const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
  // Det som redan varit i år fälls ihop, så att det aktuella står först. Det är där telefonen börjar.
  const pastMonths = currentMonth ? allMonths.filter((m) => m < currentMonth) : [];
  const comingMonths = allMonths.filter((m) => !pastMonths.includes(m));
  const vtIsPast = currentMonth !== null && termOfMonth(currentMonth) === "ht";
  const pastCount = items.filter((i) => (i.month !== null ? pastMonths.includes(i.month) : vtIsPast && itemTerm(i) === "vt")).length;
  const missingSuggestions = WHEEL_SUGGESTIONS.some((s) => !items.some((i) => i.seed_key === s.seed_key));
  const filtered = month !== null ? items.filter((i) => i.month === month) : items;

  return (
    <>
      {typeof sp.fylld === "string" && /^\d+$/.test(sp.fylld) && <Notice>{sp.fylld} förslag är inlagda. Allt går att ändra, och det som inte passar tar du bort.</Notice>}
      {sp.sparad && <Notice>Punkten ligger i hjulet.</Notice>}
      {sp.raderad && <Notice>Punkten är borttagen.</Notice>}
      <AdminHeader
        kicker="Alla poster"
        title="Årshjul"
        description="Det som brukar hända under ett år, så att nästa års post ser vad som väntar och när. Lägg det som är aktuellt på tavlan eller gör en projektplan av det. Nästa år börjar hjulet om."
        actions={
          <>
            {items.length > 0 && missingSuggestions && <FillSuggestionsButton action={fillWheelSuggestions} className="btn btn-ghost bg-white" />}
            <Link href={month ? `/admin/arshjul/ny?manad=${month}` : "/admin/arshjul/ny"} className="btn btn-red">
              <Plus size={18} /> Ny punkt
            </Link>
          </>
        }
      />
      <ScrollToListOnFilter month={month} target="punkter" />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,30rem)_minmax(0,1fr)]">
        {/* Hjulet: på telefon under listan och mindre, på datorn bredvid den och kvar när listan scrollas. */}
        <div className="order-2 lg:sticky lg:top-6 lg:order-1">
          <div className="mx-auto max-w-[23rem] rounded-[2rem] bg-ink p-4 text-paper sm:p-5 lg:max-w-none">
            <nav aria-label="Välj år" className="mb-3 flex items-center justify-between">
              <YearLink year={year - 1} href={query(year - 1, month)} show={yearInRange(year - 1, today)} label="Föregående år" Icon={ChevronLeft} />
              <p className="font-mono text-sm font-medium tracking-[0.2em] tabular">{year}</p>
              <YearLink year={year + 1} href={query(year + 1, month)} show={yearInRange(year + 1, today)} label="Nästa år" Icon={ChevronRight} />
            </nav>
            <WheelDial items={items} stateOf={stateOf} year={year} today={today} selected={month} href={href} />
            <WheelLegend />
          </div>
        </div>

        <div id="punkter" className="order-1 min-w-0 scroll-mt-20 lg:order-2">
          {items.length > 0 && (
            <nav id="manadsval" aria-label="Välj månad" className="relative -mx-1 mb-4 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:hidden">
              <MonthChip href={href(null)} active={month === null} all>
                Alla
              </MonthChip>
              {MONTHS_SHORT.map((m, i) => (
                <MonthChip key={m} href={href(i + 1)} active={month === i + 1} now={currentMonth === i + 1}>
                  {m}
                </MonthChip>
              ))}
            </nav>
          )}
          <ScrollChipIntoView target="manadsval" />
          <p role="status" className="mb-4 flex flex-wrap items-center gap-x-3 text-sm text-stone">
            <span>
              {countLabel(filtered.length)}
              {month !== null ? ` i ${MONTHS[month - 1].toLowerCase()} ${year}` : ` under ${year}`}
            </span>
            {month !== null && (
              <Link href={href(null)} scroll={false} className="font-semibold text-ink underline">
                Visa hela året
              </Link>
            )}
          </p>

          {items.length === 0 ? (
            <EmptyState
              title="Hjulet är tomt"
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <FillSuggestionsButton action={fillWheelSuggestions} className="btn btn-ink" />
                  <Link href="/admin/arshjul/ny" className="btn btn-ghost bg-white">
                    <Plus size={18} /> Egen punkt
                  </Link>
                </div>
              }
            >
              Förslagen är det en studentsektion brukar göra under ett år: mottagning, sektionsmöten, val, överlämning, budget, STAR, sittningar och gästföreläsningar. Allt går att ändra efteråt.
            </EmptyState>
          ) : month !== null ? (
            filtered.length === 0 ? (
              <EmptyState
                title={`Inget i ${MONTHS[month - 1].toLowerCase()}`}
                action={
                  <Link href={`/admin/arshjul/ny?manad=${month}`} className="btn btn-ink">
                    <Plus size={18} /> Lägg till en punkt
                  </Link>
                }
              >
                Brukar något hända då? Lägg in det, så ser nästa års post det också.
              </EmptyState>
            ) : (
              <ul className="space-y-2.5">{filtered.map(row)}</ul>
            )
          ) : (
            <>
              {comingMonths.map(monthGroup)}
              {!vtIsPast && termGroup("vt")}
              {termGroup("ht")}
              {pastCount > 0 && (
                <details className="mt-6 rounded-2xl border border-ink/10 bg-white/50 p-4">
                  <summary className="kicker flex cursor-pointer items-center justify-between gap-3 text-ink">
                    Tidigare i år
                    <span className="text-stone tabular">{pastCount}</span>
                  </summary>
                  <div className="mt-4">
                    {pastMonths.map(monthGroup)}
                    {vtIsPast && termGroup("vt")}
                  </div>
                </details>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function YearLink({ year, href, show, label, Icon }: { year: number; href: string; show: boolean; label: string; Icon: typeof ChevronLeft }) {
  if (!show) return <span className="size-9" aria-hidden />;
  return (
    <Link href={href} scroll={false} aria-label={`${label}, ${year}`} className="grid size-9 place-items-center rounded-full border border-white/15 hover:bg-white/10">
      <Icon size={16} />
    </Link>
  );
}

function MonthChip({ href, active, now, all, children }: { href: string; active: boolean; now?: boolean; all?: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      data-alla={all ? "" : undefined}
      data-nu={now ? "" : undefined}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 font-mono text-[0.72rem] uppercase tracking-wider",
        active ? "border-ink bg-ink text-white" : "border-ink/15 bg-white text-ink/70",
      )}
    >
      {now && <span className="size-1.5 rounded-full bg-red" aria-hidden />}
      {children}
    </Link>
  );
}
