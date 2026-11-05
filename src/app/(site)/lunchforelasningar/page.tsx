import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Mail, MapPin, Star } from "@/components/icons";
import "@/components/star/star.css";
import { getCommitteeBySlug } from "@/lib/data/content";
import { listLunchEvents } from "@/lib/data/events";
import { listPublicWishes } from "@/lib/data/naringsliv";
import { formatDateLong, formatTimeRange, parts, relativeDay } from "@/lib/dates";
import { canVoteOnWish, mailtoWithSubject, wishErrorText, WISH_STATUS_LABELS, type LectureWish } from "@/lib/naringsliv";
import type { EventItem } from "@/lib/types";
import { cn, mulberry32 } from "@/lib/utils";
import { WishForm } from "./wish-form";
import { WishStar } from "./wish-star";

export const metadata: Metadata = {
  title: "Lunchföreläsningar",
  description: "Lunchföreläsningar på StatLin: se nästa föreläsning, önska vad du vill höra och ge stjärnor till det du vill att SASU bokar.",
};

const MONTHS = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

// Önskelistan ska gå att använda utan JavaScript, så sidan renderas hel vid varje anrop i stället för med ett skelett.
export const instant = false;

export default async function LunchPage({ searchParams }: PageProps<"/lunchforelasningar">) {
  const [events, wishes, sasu, sp] = await Promise.all([listLunchEvents(5), listPublicWishes(), getCommitteeBySlug("sasu"), searchParams]);
  const contact = sasu?.email || "sasu@statlin.se";
  const [next, ...others] = events;
  const open = wishes.filter((w) => w.status !== "genomford");
  const done = wishes.filter((w) => w.status === "genomford");
  const totalVotes = wishes.reduce((sum, w) => sum + w.votes, 0);
  const litByServer = Number(sp.stjarna) || null;
  const wishError = wishErrorText(sp.fel);

  return (
    <>
      <section className="star-sky relative isolate overflow-hidden pb-40 pt-[calc(var(--header-h)+3rem)] text-white md:pb-44 md:pt-[calc(var(--header-h)+5rem)]">
        <VoteSky votes={totalVotes} />
        <div className="container-site">
          <p className="kicker text-white/70">SASU / Näringsliv</p>
          <h1 className="display mt-5 text-[clamp(1.5rem,8.1vw,6.5rem)]">
            Lunch&shy;föreläsningar
          </h1>
          <div className="mt-3 h-1 w-[min(100%,26rem)] bg-[#8f1d1d]" aria-hidden />
          <div className="mt-7 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <p className="max-w-xl text-lg leading-relaxed text-white/85">Mat, en bra föreläsning och en titt på vad du kan bli. Önska vad du vill höra och ge stjärnor, så vet SASU vem de ska ringa.</p>
            {totalVotes > 0 && (
              <p className="kicker shrink-0 text-white/75">
                <span className="mono-accent text-2xl font-semibold text-white">{totalVotes}</span> {totalVotes === 1 ? "stjärna" : "stjärnor"} på himlen, en per röst
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="relative z-10 bg-paper">
        <div className="container-site">
          <div className="-translate-y-28 md:-translate-y-32">{next ? <NextLecture event={next} others={others} /> : <NoLecture />}</div>
        </div>

        <div className="container-site -mt-14 grid gap-10 pb-20 md:-mt-16 md:pb-28 lg:grid-cols-12 lg:gap-14">
          <section id="onskelistan" className="scroll-mt-[calc(var(--header-h)+1rem)] lg:col-span-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="display-tight text-3xl md:text-4xl">Önskelistan</h2>
              <a href="#onska" className="btn btn-ghost btn-sm lg:hidden">
                Önska något
              </a>
            </div>
            {sp.sparrad && (
              <p role="status" className="mt-4 rounded-xl border border-red/30 bg-red/[0.06] px-4 py-3 text-sm font-semibold text-red-dark">
                Det gick lite för fort, så den här stjärnan räknades inte. Försök igen om en stund.
              </p>
            )}
            {open.length > 0 ? (
              <>
                <p className="mt-3 max-w-lg text-stone">Flest stjärnor överst. En stjärna per önskemål, och vi sparar inget om vem som gav den.</p>
                <ol className="mt-7 divide-y divide-ink/10 overflow-hidden rounded-[1.75rem] border border-ink/10 bg-white">
                  {open.map((w) => (
                    <WishRow key={w.id} wish={w} litByServer={litByServer === w.id} />
                  ))}
                </ol>
              </>
            ) : (
              <div className="mt-7 rounded-[1.75rem] border border-dashed border-ink/25 p-10">
                <p className="display-tight text-2xl">Himlen är tom än så länge</p>
                <p className="mt-2 max-w-md text-stone">Ingen har önskat något ännu. Vad vill du höra om? Bli först, så tänder du den första stjärnan.</p>
              </div>
            )}

            {done.length > 0 && (
              <div className="mt-12">
                <h3 className="kicker text-stone">Det här har redan blivit av</h3>
                <ul className="mt-4 space-y-2">
                  {done.map((w) => (
                    <li key={w.id} className="flex flex-wrap items-baseline gap-x-3">
                      <Star size={14} className="translate-y-0.5 fill-ink/30 text-ink/30" />
                      {w.event_slug ? (
                        <Link href={`/evenemang/${w.event_slug}`} className="link-underline font-semibold">
                          {w.title}
                        </Link>
                      ) : (
                        <span className="font-semibold">{w.title}</span>
                      )}
                      <span className="mono-accent text-sm text-stone">{w.votes} ★</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <aside id="onska" className="scroll-mt-[calc(var(--header-h)+1rem)] lg:col-span-5">
            <div className="star-sky rounded-[1.75rem] p-7 text-white md:p-9 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
              <h2 className="display-tight text-3xl">Önska</h2>
              {sp.tack ? (
                <div role="status" className="mt-5 rounded-xl bg-white px-4 py-3 font-semibold text-ink">
                  Tack! SASU läser ditt önskemål, och sedan hamnar det på listan.
                </div>
              ) : (
                <p className="mt-3 text-white/85">Ett ämne, ett företag eller en person. Du är anonym. SASU läser först, så önskemålet syns inte på listan direkt.</p>
              )}
              {wishError && (
                <p role="alert" className="mt-5 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-red-dark">
                  {wishError}
                </p>
              )}
              <WishForm />
            </div>
          </aside>
        </div>

        <CompanyBand contact={contact} />
      </div>
    </>
  );
}

/** En extra stjärna för varje röst: himlen över sidan fylls av önskemålen. Tak på 400, så att sidan förblir lätt. */
function VoteSky({ votes }: { votes: number }) {
  const random = mulberry32(20261105);
  const count = Math.min(votes, 400);
  const dots = Array.from({ length: count }, () => `M${Math.round(random() * 1600)} ${Math.round(random() * 600)}h0`);
  // Var femte lyser lite starkare, som på en riktig himmel.
  const bright = dots.filter((_, i) => i % 5 === 0).join("");
  const faint = dots.filter((_, i) => i % 5 !== 0).join("");
  return (
    <svg className="pointer-events-none absolute inset-0 -z-10 h-full w-full" viewBox="0 0 1600 600" preserveAspectRatio="xMidYMid slice" aria-hidden>
      {faint && <path d={faint} stroke="#fff" strokeOpacity="0.75" strokeWidth="1.8" strokeLinecap="round" />}
      {bright && <path d={bright} stroke="#fff" strokeWidth="3" strokeLinecap="round" />}
    </svg>
  );
}

function NextLecture({ event, others }: { event: EventItem; others: EventItem[] }) {
  const { day, month } = parts(event.starts_at);
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <Link href={`/evenemang/${event.slug}`} className="group grid overflow-hidden rounded-[1.75rem] bg-white shadow-[0_30px_60px_-30px_rgba(11,21,48,0.5)] sm:grid-cols-[11rem_minmax(0,1fr)] lg:col-span-8">
        <div className="flex items-center gap-3 bg-red p-6 text-white sm:flex-col sm:items-start sm:justify-center sm:gap-0">
          <span className="display text-6xl sm:text-7xl">{day}</span>
          <span className="mono-accent text-xl font-semibold uppercase sm:mt-1">{MONTHS[month - 1]}</span>
        </div>
        <div className="flex flex-col p-6 md:p-8">
          <p className="kicker text-stone">
            Nästa föreläsning · <span className="first-letter:uppercase">{relativeDay(event.starts_at, event.ends_at, !!event.all_day)}</span>
          </p>
          <p className="display-tight mt-3 text-2xl md:text-3xl">{event.title.replace(/^Lunchföreläsning:\s*/i, "")}</p>
          {event.summary && <p className="mt-3 text-stone">{event.summary}</p>}
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold">
            <span>{formatTimeRange(event.starts_at, event.ends_at, !!event.all_day)}</span>
            {event.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={15} className="text-red" /> {event.location}
              </span>
            )}
            <span className="ml-auto inline-flex items-center gap-1.5 text-red-deep transition-transform duration-500 group-hover:translate-x-1">
              Läs mer <ArrowRight size={16} />
            </span>
          </p>
        </div>
      </Link>
      {others.length > 0 ? (
        <div className="rounded-[1.75rem] border border-ink/10 bg-white p-6 lg:col-span-4">
          <p className="kicker text-stone">Sedan</p>
          <ul className="mt-3 divide-y divide-ink/10">
            {others.map((e) => (
              <li key={e.id}>
                <Link href={`/evenemang/${e.slug}`} className="group flex items-baseline justify-between gap-3 py-3">
                  <span className="min-w-0 font-semibold">{e.title.replace(/^Lunchföreläsning:\s*/i, "")}</span>
                  <span className="mono-accent shrink-0 text-sm text-stone">{formatDateLong(e.starts_at).replace(/^\S+\s/, "")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <a href="#onska" className="group flex flex-col justify-between rounded-[1.75rem] border border-ink/10 bg-white p-6 transition-colors hover:border-ink/30 lg:col-span-4">
          <p className="kicker text-stone">Sedan då?</p>
          <p className="display-tight mt-3 text-2xl">Det bestämmer du</p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-red-deep">
            Önska nästa föreläsning <ArrowRight size={16} />
          </span>
        </a>
      )}
    </div>
  );
}

function NoLecture() {
  return (
    <div className="flex flex-col items-start justify-between gap-5 rounded-[1.75rem] bg-white p-7 shadow-[0_30px_60px_-30px_rgba(11,21,48,0.5)] md:flex-row md:items-center md:p-9">
      <div>
        <p className="kicker text-stone">Nästa föreläsning</p>
        <p className="display-tight mt-3 text-2xl md:text-3xl">Ingen är bokad just nu</p>
        <p className="mt-2 max-w-lg text-stone">Så det är fritt fram. Berätta vad du vill höra, så har SASU något att gå på.</p>
      </div>
      <a href="#onska" className="btn btn-red shrink-0">
        <Star size={18} /> Önska något
      </a>
    </div>
  );
}

function WishRow({ wish, litByServer }: { wish: LectureWish; litByServer: boolean }) {
  const chipClass: Record<string, string> = {
    onskad: "bg-paper-2 text-ink",
    pa_gang: "bg-star-navy text-white",
    bokad: "bg-red text-white",
  };
  return (
    <li id={`onskemal-${wish.id}`} className="flex scroll-mt-[calc(var(--header-h)+1rem)] items-start gap-4 p-5 md:gap-6 md:p-6">
      {canVoteOnWish(wish.status) ? (
        <WishStar id={wish.id} title={wish.title} votes={wish.votes} litByServer={litByServer} />
      ) : (
        <span className="flex flex-col items-center">
          <span className="grid size-14 place-items-center rounded-full border border-ink/10 bg-paper">
            <Star size={24} className="fill-red text-red" />
          </span>
          <span className="mono-accent mt-1.5 text-sm font-semibold tabular">
            {wish.votes}
            <span className="sr-only"> {wish.votes === 1 ? "stjärna" : "stjärnor"}</span>
          </span>
        </span>
      )}
      <div className="min-w-0 flex-1 pt-1">
        <p className="text-lg font-semibold leading-snug [overflow-wrap:anywhere]">{wish.title}</p>
        {wish.comment && <p className="mt-1 text-[0.95rem] text-stone [overflow-wrap:anywhere]">{wish.comment}</p>}
        <p className="mt-3 flex flex-wrap items-center gap-2">
          <span className={cn("chip", chipClass[wish.status])}>{WISH_STATUS_LABELS[wish.status]}</span>
          {wish.event_slug && (
            <Link href={`/evenemang/${wish.event_slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-red-deep underline-offset-4 hover:underline">
              Till föreläsningen <ArrowUpRight size={14} />
            </Link>
          )}
        </p>
      </div>
    </li>
  );
}

function CompanyBand({ contact }: { contact: string }) {
  const rows = [
    "Ni väljer ämne: ert arbete, ett case eller hur vardagen ser ut hos er.",
    "SASU hjälper till med tid och plats och sprider inbjudan till studenterna.",
    "Upplägget bestämmer vi tillsammans. Berätta vad ni vill uppnå så återkommer vi.",
  ];
  return (
    <section className="star-sky text-white">
      <div className="h-1 w-full bg-[#8f1d1d]" aria-hidden />
      <div className="container-site grid gap-10 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-5">
          <p className="kicker text-white/70">För företag</p>
          <h2 className="display-tight mt-4 text-3xl md:text-4xl">Vill ni hålla en lunch&shy;föreläsning?</h2>
          <a href={mailtoWithSubject(contact, "Vi vill hålla en lunchföreläsning")} className="btn btn-red mt-7">
            <Mail size={18} /> {contact}
          </a>
        </div>
        <ol className="space-y-5 md:col-span-6 md:col-start-7">
          {rows.map((row, i) => (
            <li key={row} className="flex gap-4">
              <span className="mono-accent text-lg font-semibold text-white/60" aria-hidden>
                {i + 1}
              </span>
              <span className="text-lg leading-snug text-white/90">{row}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
