import Link from "next/link";
import { EventCard } from "@/components/content/event-card";
import { NewsCard } from "@/components/content/news-card";
import { ArrowRight, ArrowUpRight, Calendar, Handshake } from "@/components/icons";
import { CountUp } from "@/components/ui/count-up";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { listBoard, listCommittees } from "@/lib/data/content";
import { listUpcomingEvents } from "@/lib/data/events";
import { listNews } from "@/lib/data/news";

export async function HomeSections() {
  const [events, news, committees, board] = await Promise.all([
    listUpcomingEvents(6),
    listNews(4),
    listCommittees({ visibleOnly: true }),
    listBoard(),
  ]);
  const utskott = committees.filter((c) => c.kind !== "styrelse");
  const stats = [
    { value: utskott.length, label: "Utskott & grupper", note: "från SCB till eSTIG" },
    { value: board.length, label: "Poster i styrelsen", note: "väljs varje år" },
    { value: events.length, label: "Kommande evenemang", note: "just nu i kalendern" },
    { value: 180, label: "Högskolepoäng", note: "kandidatprogrammet" },
  ];

  return (
    <>
      {/* 01 Om */}
      <section id="utforska" className="relative overflow-hidden">
        <div className="grid-paper-fine pointer-events-none absolute inset-0 text-ink [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
        <div className="container-site relative grid gap-14 py-24 md:py-32 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <p className="kicker flex items-center gap-3 text-stone">
              <span className="text-red">01</span>
              <span className="h-px w-8 bg-ink/20" aria-hidden />
              Om sektionen
            </p>
            <p className="mt-7 text-[clamp(1.75rem,3.6vw,3.15rem)] font-semibold leading-[1.12] tracking-tight [font-stretch:104%]">
              Vi är statistikstudenternas sektion i Linköping. Här möts <span className="mono-accent text-red-deep">gemenskap</span>,{" "}
              <span className="mono-accent text-red-deep">utbildning</span> och vägen ut i{" "}
              <span className="mono-accent text-red-deep">arbetslivet</span>.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/sektionen" className="btn btn-ink group">
                Om StatLin
                <ArrowRight size={18} className="transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
              <Link href="/sektionen/styrelsen" className="btn btn-ghost">
                Möt styrelsen
              </Link>
            </div>
          </Reveal>

          <Reveal delay={150} className="lg:col-span-5">
            <dl className="grid grid-cols-2 overflow-hidden rounded-[1.75rem] border border-ink/10 bg-white">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className={`relative p-6 md:p-7 ${i % 2 === 0 ? "border-r" : ""} ${i < 2 ? "border-b" : ""} border-ink/10`}
                >
                  <dt className="kicker text-stone">{s.label}</dt>
                  <dd className="display mt-4 text-[clamp(2.6rem,5vw,3.8rem)] text-ink">
                    <CountUp value={s.value} />
                  </dd>
                  <dd className="mt-2 text-sm text-stone">{s.note}</dd>
                  <span className="absolute right-5 top-5 font-mono text-[0.65rem] text-red">x̄{i + 1}</span>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      {/* 02 Evenemang */}
      <section className="relative bg-paper-2/60 py-24 md:py-32">
        <div className="container-site">
          <Reveal>
            <SectionHeading index="02" kicker="Kalender" title={<>Kommande <span className="mono-accent text-red-deep">evenemang</span></>} href="/evenemang" linkLabel="Hela kalendern" />
          </Reveal>
          {events.length > 0 ? (
            <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.slice(0, 6).map((e, i) => (
                <Reveal key={e.id} delay={(i % 3) * 90}>
                  <EventCard event={e} priority={i < 3} className="h-full" />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="mt-14 rounded-[1.75rem] border border-dashed border-ink/20 p-12 text-center text-stone">
              Inga evenemang inlagda just nu – håll utkik!
            </div>
          )}
          <Reveal className="mt-10">
            <a
              href="/kalender.ics"
              className="group flex flex-col items-start justify-between gap-4 rounded-[1.5rem] border border-ink/10 bg-white px-6 py-5 transition-colors hover:border-ink/30 sm:flex-row sm:items-center"
            >
              <span className="flex items-center gap-4">
                <span className="grid size-11 place-items-center rounded-full bg-ink text-white">
                  <Calendar size={18} />
                </span>
                <span>
                  <span className="block font-semibold">Prenumerera på kalendern</span>
                  <span className="block text-sm text-stone">Alla evenemang direkt i Google Kalender, iPhone eller Outlook.</span>
                </span>
              </span>
              <span className="kicker flex items-center gap-2 text-red-deep">
                kalender.ics <ArrowUpRight size={14} />
              </span>
            </a>
          </Reveal>
        </div>
      </section>

      {/* 03 Utskott */}
      <section className="noise relative overflow-hidden bg-ink py-24 text-white md:py-32">
        <div className="grid-paper pointer-events-none absolute inset-0 text-white [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden />
        <div className="container-site relative">
          <Reveal>
            <SectionHeading dark index="03" kicker="Utskott" title={<>Hitta ditt <span className="mono-accent text-red">sammanhang</span></>} href="/utskott" linkLabel="Alla utskott" />
          </Reveal>
          <ul className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/10 md:grid-cols-4">
            {utskott.map((c, i) => (
              <li key={c.id} className="bg-ink">
                <Reveal delay={(i % 4) * 70} className="h-full">
                  <Link href={`/utskott/${c.slug}`} className="group relative flex h-full flex-col items-center px-5 pb-8 pt-10 text-center transition-colors duration-500 hover:bg-ink-2">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                      style={{ background: `radial-gradient(circle at 50% 35%, ${c.accent}30, transparent 65%)` }}
                    />
                    {c.logo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.logo_url}
                        alt={`${c.short_name}-loggan`}
                        width={160}
                        height={160}
                        loading="lazy"
                        className="relative size-28 object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.55)] transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:-translate-y-2 group-hover:rotate-[-6deg] group-hover:scale-110 md:size-32"
                      />
                    )}
                    <span className="display-tight relative mt-6 text-xl normal-case">{c.short_name}</span>
                    <span className="relative mt-2 line-clamp-2 text-sm leading-snug text-white/55">{c.tagline}</span>
                  </Link>
                </Reveal>
              </li>
            ))}
            {/* Fyller ut rutnätet och bjuder in till engagemang. */}
            {utskott.length % 2 === 1 && (
              <li className="bg-ink">
                <Link href="/sektionen" className="group flex h-full flex-col items-center justify-center gap-4 px-5 py-10 text-center transition-colors hover:bg-red">
                  <span className="grid size-16 place-items-center rounded-full border border-white/20 text-2xl transition-transform duration-500 group-hover:rotate-90 group-hover:border-white">+</span>
                  <span className="display-tight text-xl">Engagera dig</span>
                  <span className="text-sm text-white/55 group-hover:text-white/85">Alla utskott söker folk – ingen erfarenhet krävs.</span>
                </Link>
              </li>
            )}
          </ul>
        </div>
      </section>

      {/* 04 Nyheter */}
      {news.length > 0 && (
        <section className="py-24 md:py-32">
          <div className="container-site">
            <Reveal>
              <SectionHeading index="04" kicker="Nyheter" title={<>Senaste <span className="mono-accent text-red-deep">nytt</span></>} href="/nyheter" linkLabel="Alla nyheter" />
            </Reveal>
            <Reveal className="mt-14">
              <NewsCard item={news[0]} featured />
            </Reveal>
            {news.length > 1 && (
              <div className="mt-16 grid gap-10 border-t border-ink/10 pt-12 md:grid-cols-3">
                {news.slice(1, 4).map((n, i) => (
                  <Reveal key={n.id} delay={i * 90}>
                    <NewsCard item={n} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 05 Vägar in – luften ovanför kommer annars från nyheterna, som bara visas när det finns några. */}
      <section className={news.length > 0 ? "pb-24 md:pb-32" : "py-24 md:py-32"}>
        <div className="container-site grid gap-6 lg:grid-cols-2">
          <Reveal>
            <Link href="/ny-student" className="noise group relative flex min-h-[26rem] flex-col justify-between overflow-hidden rounded-[2rem] bg-red p-8 text-white md:p-12">
              <div className="grid-paper pointer-events-none absolute inset-0 text-white" aria-hidden />
              <span className="kicker relative text-white/80">För dig som är ny</span>
              <div className="relative">
                <h2 className="display text-[clamp(2.4rem,5vw,4.4rem)]">Ny student?</h2>
                <p className="mt-4 max-w-md text-lg text-white/85">
                  Mottagningen, overallen och allt du undrar inför första dagen på Statistik och dataanalys.
                </p>
                <span className="mt-8 inline-flex items-center gap-3 font-semibold">
                  Läs mer
                  <span className="grid size-10 place-items-center rounded-full bg-white text-red transition-transform duration-500 group-hover:translate-x-1.5">
                    <ArrowRight size={18} />
                  </span>
                </span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/statlin-vit.svg"
                alt=""
                aria-hidden
                className="pointer-events-none absolute -bottom-24 -right-24 w-[26rem] max-w-none opacity-20 transition-transform duration-[1.4s] ease-[var(--ease-out-expo)] group-hover:rotate-[-10deg] group-hover:scale-105"
              />
            </Link>
          </Reveal>
          <Reveal delay={120}>
            <Link href="/foretag" className="group relative flex min-h-[26rem] flex-col justify-between overflow-hidden rounded-[2rem] bg-star-navy p-8 text-white md:p-12">
              <StarField />
              <span className="kicker relative flex items-center gap-2 text-white/70">
                <Handshake size={16} /> För företag
              </span>
              <div className="relative">
                <p className="text-[clamp(2.4rem,5vw,4.4rem)] font-light uppercase leading-none tracking-[0.18em] [font-stretch:110%]">STAR</p>
                <div className="mt-2 h-[3px] w-40 bg-[#8f1d1d]" aria-hidden />
                <p className="mt-5 max-w-md text-lg text-white/80">
                  StatLins arbetsmarknadsdag – och fler sätt att möta Linköpings statistik- och datastudenter.
                </p>
                <span className="mt-8 inline-flex items-center gap-3 font-semibold">
                  Samarbeta med oss
                  <span className="grid size-10 place-items-center rounded-full bg-white text-star-navy transition-transform duration-500 group-hover:translate-x-1.5">
                    <ArrowRight size={18} />
                  </span>
                </span>
              </div>
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}

/** Stjärnhimmel med en punkt-linje-graf, inspirerad av STAR-loggan. */
export function StarField() {
  const stars = Array.from({ length: 70 }, (_, i) => {
    const x = (i * 137.5) % 100;
    const y = (i * 61.8 + (i % 7) * 13) % 100;
    return { x, y, r: ((i * 7) % 10) / 10 + 0.3, o: 0.25 + ((i * 13) % 10) / 14 };
  });
  const constellation = [
    [12, 78],
    [26, 66],
    [38, 70],
    [52, 52],
    [66, 48],
    [78, 30],
    [90, 22],
  ];
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <defs>
        <radialGradient id="star-glow" cx="80%" cy="10%" r="80%">
          <stop offset="0" stopColor="#3d5bb8" stopOpacity="0.55" />
          <stop offset="1" stopColor="#0b1530" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill="url(#star-glow)" />
      {stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r * 0.18} fill="#fff" opacity={s.o} />
      ))}
      <polyline
        points={constellation.map((p) => p.join(",")).join(" ")}
        fill="none"
        stroke="#fff"
        strokeOpacity="0.6"
        strokeWidth="0.25"
        vectorEffect="non-scaling-stroke"
        className="transition-all duration-700"
      />
      {constellation.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="0.5" fill="#fff" />
      ))}
    </svg>
  );
}
