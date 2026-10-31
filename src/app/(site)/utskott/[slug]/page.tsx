import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BoardCard } from "@/components/content/board-card";
import { EventCard, EventRow } from "@/components/content/event-card";
import { Markdown } from "@/components/content/markdown";
import { NewsCard } from "@/components/content/news-card";
import { ArrowLeft, Instagram, Mail } from "@/components/icons";
import { HeroSkeleton } from "@/components/ui/skeletons";
import { getCommitteeBySlug, listBoard } from "@/lib/data/content";
import { listPastEvents, listUpcomingEvents } from "@/lib/data/events";
import { listNewsForCommittee } from "@/lib/data/news";
import { safeExternalUrl } from "@/lib/utils";
import { EditModeLink, Editable } from "@/components/edit-mode/editable";

export async function generateMetadata({ params }: PageProps<"/utskott/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCommitteeBySlug(slug);
  if (!c) return { title: "Utskottet hittades inte" };
  return { title: `${c.short_name} – ${c.name}`, description: c.tagline };
}

export default function CommitteePage(props: PageProps<"/utskott/[slug]">) {
  return (
    <Suspense fallback={<HeroSkeleton />}>
      <Committee params={props.params} />
    </Suspense>
  );
}

async function Committee({ params }: { params: PageProps<"/utskott/[slug]">["params"] }) {
  const { slug } = await params;
  const c = await getCommitteeBySlug(slug);
  if (!c || !c.visible) notFound();

  const [upcoming, past, news, board] = await Promise.all([
    listUpcomingEvents(6, c.id),
    listPastEvents(6, c.id),
    listNewsForCommittee(c.id, 3),
    listBoard(),
  ]);
  const members = board.filter((b) => b.committee_id === c.id);
  const instagram = safeExternalUrl(c.instagram);

  return (
    <>
      <Editable target={{ type: "committee", id: c.id }} label="Redigera utskottet" inset penClassName="top-[calc(var(--header-h)+1rem)] right-4">
      <header className="noise relative overflow-hidden bg-ink text-white">
        <div className="grid-paper pointer-events-none absolute inset-0 text-white [mask-image:radial-gradient(ellipse_at_70%_30%,black,transparent_75%)]" aria-hidden />
        <div aria-hidden className="pointer-events-none absolute right-[-10%] top-[-20%] size-[42rem] rounded-full opacity-50 blur-3xl" style={{ background: `radial-gradient(closest-side, ${c.accent}, transparent)` }} />
        <div className="container-site relative grid items-center gap-10 pb-16 pt-[calc(var(--header-h)+3rem)] md:grid-cols-12 md:pb-24 md:pt-[calc(var(--header-h)+5rem)]">
          <div className="md:col-span-7">
            <Link href="/utskott" className="kicker inline-flex items-center gap-2 text-white/60 hover:text-white">
              <ArrowLeft size={14} /> Alla utskott
            </Link>
            <h1 className="display mt-8 text-[clamp(3rem,10vw,8rem)] normal-case">{c.short_name}</h1>
            <p className="mt-3 text-xl text-white/60">{c.name}</p>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">{c.tagline}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {c.email && (
                <a href={`mailto:${c.email}`} className="btn btn-red">
                  <Mail size={18} /> {c.email}
                </a>
              )}
              {instagram && (
                <a href={instagram} target="_blank" rel="noopener noreferrer" className="btn btn-ghost-dark">
                  <Instagram size={18} /> Instagram
                </a>
              )}
            </div>
          </div>
          {c.logo_url && (
            <div className="flex justify-center md:col-span-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.logo_url}
                alt={`${c.short_name}-loggan`}
                className="w-[min(70vw,24rem)] animate-float drop-shadow-[0_40px_60px_rgba(0,0,0,0.6)]"
              />
            </div>
          )}
        </div>
      </header>
      </Editable>

      <section className="container-site grid gap-14 py-16 md:py-24 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Markdown source={c.description_md} />
        </div>
        {members.length > 0 && (
          <aside className="lg:col-span-4 lg:col-start-9">
            <p className="kicker text-stone">Kontaktpersoner</p>
            <div className="mt-5 grid grid-cols-2 gap-5 lg:grid-cols-1">
              {members.map((m) => (
                <BoardCard key={m.id} member={m} />
              ))}
            </div>
          </aside>
        )}
      </section>

      <section className="border-t border-ink/10 bg-paper-2/50 py-16 md:py-24">
        <div className="container-site">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="display-tight text-[clamp(1.8rem,3.5vw,2.8rem)]">
              Kommande med <span className="mono-accent normal-case text-red-deep">{c.short_name}</span>
            </h2>
            <EditModeLink target={{ type: "committee", id: c.id }} href="/admin/evenemang/ny">
              Nytt evenemang
            </EditModeLink>
          </div>
          {upcoming.length > 0 ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((e) => (
                <EventCard key={e.id} event={e} className="h-full" />
              ))}
            </div>
          ) : (
            <p className="mt-6 text-stone">Inga kommande evenemang just nu.</p>
          )}
          {past.length > 0 && (
            <div className="mt-16">
              <h3 className="kicker text-stone">Tidigare</h3>
              <div className="mt-3 border-t border-ink/10">
                {past.map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {news.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="container-site">
            <h2 className="display-tight text-[clamp(1.8rem,3.5vw,2.8rem)]">Nyheter</h2>
            <div className="mt-10 grid gap-10 md:grid-cols-3">
              {news.map((n) => (
                <NewsCard key={n.id} item={n} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
