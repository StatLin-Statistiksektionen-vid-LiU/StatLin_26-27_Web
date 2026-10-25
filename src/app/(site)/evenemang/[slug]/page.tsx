import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CoverArt } from "@/components/content/cover-art";
import { EventRow } from "@/components/content/event-card";
import { Gallery } from "@/components/content/gallery";
import { Markdown } from "@/components/content/markdown";
import { SmartImage } from "@/components/content/smart-image";
import { ArrowLeft, ArrowUpRight, Calendar, Clock, Image as ImageIcon, MapPin, Ticket } from "@/components/icons";
import { HeroSkeleton } from "@/components/ui/skeletons";
import { getEventBySlug, listEventImages, listUpcomingEvents } from "@/lib/data/events";
import { formatDateLong, formatTimeRange, nowLocal, relativeDay } from "@/lib/dates";
import { googleCalendarUrl } from "@/lib/ics";
import { siteUrl } from "@/lib/site-url";
import { fitHeading, safeExternalUrl, stripMarkdown } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/evenemang/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Evenemanget hittades inte" };
  return {
    title: event.title,
    description: event.summary || stripMarkdown(event.body_md),
    openGraph: event.cover ? { images: [{ url: event.cover.src, width: event.cover.width, height: event.cover.height }] } : undefined,
  };
}

export default function EventPage(props: PageProps<"/evenemang/[slug]">) {
  return (
    <Suspense fallback={<HeroSkeleton />}>
      <EventDetail params={props.params} />
    </Suspense>
  );
}

async function EventDetail({ params }: { params: PageProps<"/evenemang/[slug]">["params"] }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const [images, more, base] = await Promise.all([
    listEventImages(event.id),
    listUpcomingEvents(4, event.committee_id ?? undefined),
    siteUrl(),
  ]);
  const others = more.filter((e) => e.id !== event.id).slice(0, 3);
  const isPast = (event.ends_at ?? `${event.starts_at.slice(0, 10)}T23:59`) < nowLocal();
  const signup = safeExternalUrl(event.signup_url);
  const mapUrl = safeExternalUrl(event.location_url) ?? (event.location ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location + ", Linköping")}` : null);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: `${event.starts_at}:00`,
    endDate: event.ends_at ? `${event.ends_at}:00` : undefined,
    eventStatus: "https://schema.org/EventScheduled",
    location: event.location ? { "@type": "Place", name: event.location, address: event.location } : undefined,
    description: event.summary,
    organizer: { "@type": "Organization", name: event.committee?.name ?? "StatLin", url: base },
    image: event.cover ? [`${base}${event.cover.src}`] : undefined,
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="noise relative overflow-hidden bg-ink text-white">
        <div className="absolute inset-0">
          {event.cover ? (
            <SmartImage image={event.cover} priority sizes="100vw" className="h-full w-full opacity-45" alt="" />
          ) : (
            <CoverArt seed={event.slug} accent={event.committee?.accent} className="h-full w-full opacity-70" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
        </div>
        <div className="container-site relative pb-14 pt-[calc(var(--header-h)+3rem)] md:pb-20 md:pt-[calc(var(--header-h)+5rem)]">
          <Link href="/evenemang" className="kicker inline-flex items-center gap-2 text-white/60 hover:text-white">
            <ArrowLeft size={14} /> Alla evenemang
          </Link>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className={`chip ${isPast ? "bg-white/15 text-white" : "bg-red text-white"}`}>{isPast ? "Har varit" : relativeDay(event.starts_at)}</span>
            {event.committee && (
              <Link href={`/utskott/${event.committee.slug}`} className="chip border border-white/20 text-white/85 hover:border-white/60">
                {event.committee.short_name}
              </Link>
            )}
          </div>
          <h1 className="display mt-6 max-w-5xl [overflow-wrap:break-word]" style={fitHeading(event.title, { maxRem: 5.6, maxVw: 6.5 })}>
            {event.title}
          </h1>
          {event.summary && <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75 md:text-xl">{event.summary}</p>}
        </div>
      </header>

      <div className="container-site grid gap-12 py-14 md:py-20 lg:grid-cols-12">
        <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:self-start">
          <div className="overflow-hidden rounded-[1.75rem] border border-ink/10 bg-white">
            <dl className="divide-y divide-ink/10">
              <InfoRow icon={<Calendar size={18} />} label="Datum">
                {formatDateLong(event.starts_at)}
              </InfoRow>
              <InfoRow icon={<Clock size={18} />} label="Tid">
                {formatTimeRange(event.starts_at, event.ends_at, !!event.all_day)}
              </InfoRow>
              {event.location && (
                <InfoRow icon={<MapPin size={18} />} label="Plats">
                  {mapUrl ? (
                    <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="link-underline inline-flex items-center gap-1">
                      {event.location} <ArrowUpRight size={14} className="text-red" />
                    </a>
                  ) : (
                    event.location
                  )}
                </InfoRow>
              )}
              {event.price && (
                <InfoRow icon={<Ticket size={18} />} label="Pris">
                  {event.price}
                </InfoRow>
              )}
            </dl>
            <div className="space-y-2.5 border-t border-ink/10 bg-paper/60 p-5">
              {signup && !isPast && (
                <a href={signup} target="_blank" rel="noopener noreferrer" className="btn btn-red w-full">
                  Anmäl dig <ArrowUpRight size={18} />
                </a>
              )}
              <div className="grid grid-cols-2 gap-2.5">
                <a href={`/evenemang/${event.slug}/kalender.ics`} className="btn btn-ghost btn-sm bg-white">
                  <Calendar size={15} /> iCal
                </a>
                <a href={googleCalendarUrl(event, base)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm bg-white">
                  Google
                </a>
              </div>
            </div>
          </div>
          {event.committee && (
            <Link
              href={`/utskott/${event.committee.slug}`}
              className="group mt-4 flex items-center gap-4 rounded-[1.5rem] border border-ink/10 bg-white p-4 transition-colors hover:border-ink/30"
            >
              {event.committee.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={event.committee.logo_url} alt="" className="size-14 object-contain transition-transform duration-500 group-hover:rotate-[-8deg]" />
              )}
              <span className="min-w-0 flex-1">
                <span className="kicker block text-stone">Arrangör</span>
                <span className="block truncate font-semibold">{event.committee.name}</span>
              </span>
              <ArrowUpRight size={18} className="text-red" />
            </Link>
          )}
        </aside>

        <div className="lg:col-span-7 lg:row-start-1">
          {event.body_md ? <Markdown source={event.body_md} /> : <p className="text-stone">Mer information kommer.</p>}

          {images.length > 0 && (
            <section id="galleri" className="mt-16 scroll-mt-28">
              <div className="mb-6 flex items-baseline justify-between border-b border-ink/10 pb-4">
                <h2 className="display-tight flex items-center gap-3 text-2xl">
                  <ImageIcon size={22} className="text-red" /> Bilder
                </h2>
                <span className="kicker text-stone">{images.length} st</span>
              </div>
              <Gallery title={event.title} items={images.map((i) => ({ id: i.id, caption: i.caption, image: i.image }))} />
            </section>
          )}
        </div>
      </div>

      {others.length > 0 && (
        <section className="border-t border-ink/10 bg-paper-2/50 py-16">
          <div className="container-site">
            <h2 className="kicker text-stone">Fler evenemang {event.committee ? `med ${event.committee.short_name}` : ""}</h2>
            <div className="mt-4 border-t border-ink/10">
              {others.map((e) => (
                <EventRow key={e.id} event={e} />
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 px-5 py-4">
      <span className="mt-0.5 text-red">{icon}</span>
      <div className="min-w-0">
        <dt className="kicker text-stone">{label}</dt>
        <dd className="mt-1 font-semibold">{children}</dd>
      </div>
    </div>
  );
}
