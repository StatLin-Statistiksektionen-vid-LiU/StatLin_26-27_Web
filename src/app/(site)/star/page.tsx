import type { Metadata } from "next";
import { SmartImage } from "@/components/content/smart-image";
import { ArrowRight, ArrowUpRight, Calendar, ChevronDown, Mail } from "@/components/icons";
import { EmptySky, StarMap } from "@/components/star/star-map";
import "@/components/star/star.css";
import { getCommitteeBySlug, getSettings } from "@/lib/data/content";
import { getStarEvent } from "@/lib/data/events";
import { listStarCompanies } from "@/lib/data/naringsliv";
import { formatDateLong, formatTimeRange } from "@/lib/dates";
import { COMPANY_ROLE_LABELS, countdownText, mailtoWithSubject, parseProgram, parseSeeks, SEEK_KINDS, SEEK_LABELS, type ProgramStop, type StarCompany } from "@/lib/naringsliv";
import { STAR_COPY } from "@/lib/seed-content";
import { safeExternalUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "STAR – arbetsmarknadsdagen",
  description: "STAR är StatLins arbetsmarknadsdag i Linköping. Se vilka företag som kommer, vad de söker och hur dagen ser ut.",
};

// Företagen, kartan och filtret fungerar utan JavaScript, så sidan renderas hel vid varje anrop i stället för med ett skelett.
export const instant = false;

export default async function StarPage() {
  const [companies, sasu, settings] = await Promise.all([listStarCompanies({ activeOnly: true }), getCommitteeBySlug("sasu"), getSettings()]);
  const event = await getStarEvent(Number(settings.star_event_id) || null);
  const contact = sasu?.email || "sasu@statlin.se";
  const companyMail = mailtoWithSubject(contact, "Vi vill vara med på STAR");
  const program = event ? parseProgram(event.body_md) : [];
  const mainSponsors = companies.filter((c) => c.role === "huvudsponsor");
  const sponsors = companies.filter((c) => c.role === "sponsor");

  return (
    <div className="star-sky text-white">
      {/* Heron är loggan i sidans storlek: bokstäverna, den röda linjen genom dem och grafen uppför himlen. */}
      <section className="relative isolate flex min-h-svh flex-col justify-end overflow-hidden pb-12 pt-[calc(var(--header-h)+1.5rem)] md:pb-10">
        <div className="star-twinkle -z-10" aria-hidden />
        <div className="container-site">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/utskott/star.webp" alt="" width={360} height={356} className="size-14 md:size-16" />
            <p className="kicker text-white/75">{STAR_COPY.subtitle}</p>
          </div>
          <div className="relative mt-6 md:mt-8">
            <div className="absolute left-1/2 top-[56%] h-[0.065em] w-[200vw] -translate-x-1/2 bg-[#8f1d1d] text-[clamp(6.2rem,min(28vw,35svh),23rem)]" aria-hidden />
            <HeroGraph />
            <h1 className="star-type relative -mr-[0.2em] text-[clamp(6.2rem,min(28vw,35svh),23rem)] font-light uppercase leading-[1.05] tracking-[0.2em]">{STAR_COPY.title}</h1>
          </div>

          <div className="mt-8 grid gap-8 md:mt-10 md:grid-cols-12 md:items-end">
            <div className="md:col-span-7">
              {event ? <CountdownFacts event={event} /> : <p className="star-type text-[clamp(2rem,5vw,3.5rem)] font-light leading-tight">Datum kommer snart</p>}
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/80">{STAR_COPY.text}</p>
            </div>
            <div className="md:col-span-5">
              <div className="flex flex-wrap gap-3 md:justify-end">
                <a href="#vilka-kommer" className="btn btn-light">
                  Vilka kommer <ChevronDown size={18} />
                </a>
                {event && (
                  <a href={`/evenemang/${event.slug}/kalender.ics`} className="btn btn-ghost-dark">
                    <Calendar size={18} /> Lägg i kalendern
                  </a>
                )}
              </div>
              {mainSponsors.length > 0 && (
                <p className="kicker mt-6 text-white/65 md:text-right">
                  Huvudsponsor <span className="text-white">{mainSponsors.map((s) => s.name).join(", ")}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="vilka-kommer" className="star-scope relative isolate scroll-mt-[var(--header-h)] border-t border-white/10 py-20 md:py-28">
        <div className="container-site">
          <h2 className="star-type text-[clamp(2.4rem,6vw,4.5rem)] font-light uppercase leading-none tracking-[0.08em]">Vilka kommer</h2>
          {companies.length === 0 ? (
            <div className="relative mt-10">
              <EmptySky />
              <div className="mt-8 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
                <div>
                  <p className="star-type text-2xl md:text-3xl">Företagen presenteras snart</p>
                  <p className="mt-2 max-w-lg text-white/75">Stjärnorna tänds en efter en i takt med att företagen bekräftar. Titta in igen längre fram.</p>
                </div>
                <a href={companyMail} className="btn btn-ghost-dark shrink-0">
                  <Mail size={18} /> Vill ni vara med?
                </a>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-5 max-w-2xl text-lg text-white/80">Varje stjärna är ett företag. Välj vad du söker, så lyser bara de som passar. Under kartan finns alla som kort.</p>
              <SeekFilter companies={companies} />
              <div className="mt-8">
                <StarMap companies={companies} />
              </div>
              <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {companies.map((c) => (
                  <CompanyCard key={c.id} company={c} />
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      {program.length > 0 && (
        <section className="border-t border-white/10 py-20 md:py-28">
          <div className="container-site">
            <h2 className="star-type text-[clamp(2.4rem,6vw,4.5rem)] font-light uppercase leading-none tracking-[0.08em]">Dagen</h2>
            <Route stops={program} />
          </div>
        </section>
      )}

      {(mainSponsors.length > 0 || sponsors.length > 0) && (
        <section className="border-t border-white/10 py-20 md:py-28">
          <div className="container-site">
            <h2 className="star-type text-[clamp(2.4rem,6vw,4.5rem)] font-light uppercase leading-none tracking-[0.08em]">Sponsorer</h2>
            <p className="mt-5 max-w-xl text-lg text-white/80">De gör dagen möjlig.</p>
            {mainSponsors.map((s) => (
              <MainSponsor key={s.id} company={s} />
            ))}
            {sponsors.length > 0 && (
              <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                {sponsors.map((s) => (
                  <li key={s.id}>
                    <SponsorPlate company={s} className="h-28" imageClass="max-h-14" textClass="text-lg" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* Två vägar ut, under den röda linjen som bär hela sidan. */}
      <section className="pb-20 md:pb-28">
        <div className="h-1 w-full bg-[#8f1d1d]" aria-hidden />
        <div className="container-site mt-14 grid gap-10 md:mt-20 md:grid-cols-2 md:gap-16">
          <div>
            <p className="kicker text-white/65">För dig som student</p>
            <p className="star-type mt-4 text-3xl font-light leading-tight md:text-4xl">Se vart statistiken kan ta dig.</p>
            <p className="mt-4 max-w-md text-white/80">Prata med företagen, fråga om exjobb och sommarjobb och ta reda på vad en statistiker faktiskt gör om dagarna.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              {event && (
                <a href={`/evenemang/${event.slug}`} className="btn btn-light">
                  Om evenemanget <ArrowRight size={18} />
                </a>
              )}
              <a href="/lunchforelasningar" className="btn btn-ghost-dark">
                Lunchföreläsningar
              </a>
            </div>
          </div>
          <div>
            <p className="kicker text-white/65">För er som företag</p>
            <p className="star-type mt-4 text-3xl font-light leading-tight md:text-4xl">Möt framtidens statistiker.</p>
            <p className="mt-4 max-w-md text-white/80">Vill ni ställa ut eller sponsra? SASU berättar hur det går till och tar fram ett upplägg med er.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={companyMail} className="btn btn-red">
                <Mail size={18} /> {contact}
              </a>
              <a href="/foretag" className="btn btn-ghost-dark">
                Fler sätt att samarbeta
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Grafen från loggan, över ordet STAR. Den följer ordets ruta och inte heron, så att den går genom bokstäverna på alla skärmar och
 * aldrig över texten under. Linjen töjs med rutan, så punkterna är egna element: en töjd SVG-cirkel blir en ellips.
 */
function HeroGraph() {
  const points = [
    [1, 96],
    [21, 62],
    [35, 72],
    [56, 24],
    [71, 34],
    [90, -6],
    [99, 8],
  ];
  return (
    <div className="star-draw pointer-events-none absolute inset-0" aria-hidden>
      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline points={points.map((p) => p.join(",")).join(" ")} fill="none" stroke="#fff" strokeOpacity="0.8" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
      {points.map(([x, y]) => (
        <span key={x} className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white md:size-2.5" style={{ left: `${x}%`, top: `${y}%` }} />
      ))}
    </div>
  );
}

function CountdownFacts({ event }: { event: { starts_at: string; ends_at: string | null; all_day: number; location: string; price: string } }) {
  const countdown = countdownText(event.starts_at);
  return (
    <>
      <p className="star-type text-[clamp(2rem,5vw,3.5rem)] font-light leading-tight first-letter:uppercase">{countdown ?? "Pågår nu"}</p>
      <dl className="mono-accent mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/85 md:text-base">
        <div>
          <dt className="sr-only">Datum</dt>
          <dd className="first-letter:uppercase">{formatDateLong(event.starts_at)}</dd>
        </div>
        <div>
          <dt className="sr-only">Tid</dt>
          <dd>{formatTimeRange(event.starts_at, event.ends_at, !!event.all_day)}</dd>
        </div>
        {event.location && (
          <div>
            <dt className="sr-only">Plats</dt>
            <dd>{event.location}</dd>
          </div>
        )}
        {event.price && (
          <div>
            <dt className="sr-only">Pris</dt>
            <dd>{event.price}</dd>
          </div>
        )}
      </dl>
    </>
  );
}

/** Filtret är radioknappar som star.css läser med :has. Bara det någon faktiskt söker går att välja, så att urvalet aldrig blir tomt. */
function SeekFilter({ companies }: { companies: StarCompany[] }) {
  const counts = SEEK_KINDS.map((kind) => ({ kind, count: companies.filter((c) => parseSeeks(c.seeks).includes(kind)).length })).filter((k) => k.count > 0);
  if (counts.length === 0) return null;
  const chip = "flex h-10 cursor-pointer items-center gap-2 rounded-full border border-white/30 px-4 font-mono text-[0.72rem] uppercase tracking-[0.08em] transition-colors hover:border-white";
  return (
    <fieldset className="star-filter mt-7">
      <legend className="sr-only">Visa företag som söker</legend>
      <div className="flex flex-wrap gap-2">
        <label>
          <input type="radio" name="soker" value="alla" defaultChecked className="peer sr-only" />
          <span className={chip}>Alla {companies.length}</span>
        </label>
        {counts.map(({ kind, count }) => (
          <label key={kind}>
            <input type="radio" name="soker" id={`soker-${kind}`} value={kind} className="peer sr-only" />
            <span className={chip}>
              {SEEK_LABELS[kind]} {count}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function CompanyCard({ company }: { company: StarCompany }) {
  const url = safeExternalUrl(company.url);
  const seeks = parseSeeks(company.seeks);
  return (
    <li id={`foretag-${company.id}`} data-seeks={company.seeks} className="star-card flex flex-col rounded-[1.5rem] border border-white/15 bg-white/[0.04] p-6">
      <div className="flex items-center gap-4">
        <span className="grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-2 text-star-navy">
          {company.logo ? (
            <SmartImage image={company.logo} sizes="96px" className="h-full w-full !bg-transparent !object-contain" alt="" />
          ) : (
            <span className="star-type text-2xl font-light uppercase tracking-[0.1em]" aria-hidden>
              {company.name.slice(0, 2)}
            </span>
          )}
        </span>
        <div className="min-w-0">
          <h3 className="star-type text-xl leading-tight [overflow-wrap:anywhere]">{company.name}</h3>
          {company.role !== "utstallare" && <p className="kicker mt-1 text-white/70">{COMPANY_ROLE_LABELS[company.role]}</p>}
        </div>
      </div>
      {company.description && <p className="mt-4 text-[0.95rem] leading-relaxed text-white/80">{company.description}</p>}
      {seeks.length > 0 && (
        <p className="mt-4 flex flex-wrap gap-1.5">
          <span className="sr-only">Söker: </span>
          {seeks.map((k) => (
            <span key={k} className="chip border border-white/30 text-white/90">
              {SEEK_LABELS[k]}
            </span>
          ))}
        </p>
      )}
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="link-underline mt-auto inline-flex items-center gap-1.5 self-start pt-5 text-sm font-semibold">
          Till webbplatsen <ArrowUpRight size={15} />
          <span className="sr-only"> för {company.name} (öppnas i ny flik)</span>
        </a>
      )}
    </li>
  );
}

/** Programmet som en bana uppför himlen. Stegen ligger där grafen i loggan går: uppåt åt höger, med ett hack varannan punkt. */
function Route({ stops }: { stops: ProgramStop[] }) {
  // Fler än sex punkter får inte plats bredvid varandra, och då blir banan en vanlig lista även på datorn.
  const long = stops.length > 6;
  const n = stops.length;
  const points = stops.map((_, i) => {
    const x = n === 1 ? 0 : (i / n) * 100;
    const climb = n === 1 ? 0 : (i / (n - 1)) * 62;
    const notch = i % 2 === 1 ? -12 : 0;
    return { x, y: Math.max(2, 68 - climb + notch + 2) };
  });
  return (
    <ol className="star-route mt-12" data-long={long ? "" : undefined}>
      <svg className="star-route-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <polyline points={points.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      {stops.map((s, i) => (
        <li key={`${s.time}-${i}`} className="star-stop" style={{ "--x": points[i].x, "--y": points[i].y, "--w": `${100 / n}%` } as React.CSSProperties}>
          <p className="star-type text-3xl font-light tabular">{s.time}</p>
          <p className="mt-1 text-white/85">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

function SponsorPlate({ company, className, imageClass, textClass }: { company: StarCompany; className: string; imageClass: string; textClass: string }) {
  const url = safeExternalUrl(company.url);
  const inner = company.logo ? (
    <SmartImage image={company.logo} sizes="320px" className={`h-full max-w-[80%] !bg-transparent !object-contain ${imageClass}`} alt={company.name} />
  ) : (
    <span className={`star-type px-3 text-center text-star-navy [overflow-wrap:anywhere] ${textClass}`}>{company.name}</span>
  );
  const plate = `grid w-full place-items-center overflow-hidden rounded-[1.25rem] bg-white p-4 ${className}`;
  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className={`${plate} transition-transform duration-500 hover:-translate-y-1`} aria-label={`${company.name} (öppnas i ny flik)`}>
      {inner}
    </a>
  ) : (
    <div className={plate}>{inner}</div>
  );
}

function MainSponsor({ company }: { company: StarCompany }) {
  return (
    <div className="mt-10 grid items-center gap-8 md:grid-cols-12">
      <div className="md:col-span-7">
        <SponsorPlate company={company} className="h-48 md:h-64" imageClass="max-h-32 md:max-h-44" textClass="text-4xl md:text-6xl font-light uppercase tracking-[0.08em]" />
      </div>
      <div className="md:col-span-5">
        <p className="kicker text-white/65">Huvudsponsor</p>
        <p className="star-type mt-3 text-3xl leading-tight">{company.name}</p>
        {company.description && <p className="mt-3 max-w-md leading-relaxed text-white/80">{company.description}</p>}
      </div>
    </div>
  );
}
