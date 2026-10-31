import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { setCommitteeLogo } from "@/app/admin/_actions/content";
import { setEventCover } from "@/app/admin/_actions/events";
import { setNewsCover } from "@/app/admin/_actions/news";
import { CoverSlot } from "@/components/admin/cover-slot";
import { AdminHeader } from "@/components/admin/ui";
import { ArrowRight } from "@/components/icons";
import { canManageImages } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { listCommittees } from "@/lib/data/content";
import { listEventsForAdmin } from "@/lib/data/events";
import { listNewsForAdmin } from "@/lib/data/news";
import { formatDate, formatTimestamp, todayLocal } from "@/lib/dates";
import type { EventItem, ImageRef } from "@/lib/types";

export const metadata = { title: "Bilder" };

const PAST_EVENTS = 6;
const NEWS = 9;

/** Utskottens loggor sparas som adresser – fältet behöver bara något att visa. */
const logoRef = (url: string | null): ImageRef | null =>
  url ? { id: 0, src: url, srcSet: `${url} 400w`, thumb: url, width: 400, height: 400, color: "transparent", alt: "" } : null;

export default function ImagesPage(props: PageProps<"/admin/bilder">) {
  return (
    <Suspense>
      <Images searchParams={props.searchParams} />
    </Suspense>
  );
}

/** Alla omslag och loggor på ett ställe, för redaktörerna och grafiskt ansvarig. En bild sparas så fort den laddats upp. */
async function Images({ searchParams }: { searchParams: PageProps<"/admin/bilder">["searchParams"] }) {
  const user = await requireUser();
  if (!canManageImages(user)) redirect("/admin?nekad=1");
  const [sp, events, news, committees] = await Promise.all([searchParams, listEventsForAdmin(null), listNewsForAdmin(null), listCommittees()]);
  const all = sp.visa === "alla";
  const today = todayLocal();
  const isUpcoming = (e: EventItem) => (e.ends_at ?? e.starts_at).slice(0, 10) >= today;
  const upcoming = events.filter(isUpcoming).reverse();
  const past = events.filter((e) => !isUpcoming(e));
  const missing = upcoming.filter((e) => !e.cover).length;

  return (
    <>
      <AdminHeader
        title="Bilder"
        description="Omslag, galleribilder och utskottens loggor på hela sajten. En bild sparas så fort den har laddats upp."
      />

      <Section
        id="kommande"
        title="Kommande evenemang"
        description={upcoming.length === 0 ? "Inga kommande evenemang." : missing > 0 ? `${missing} av ${upcoming.length} saknar omslag.` : "Alla har omslag."}
      >
        <CardGrid>
          {upcoming.map((e) => (
            <EventCard key={e.id} event={e} flagMissing />
          ))}
        </CardGrid>
      </Section>

      {past.length > 0 && (
        <Section id="har-varit" title="Har varit" description="Ladda upp bilderna från evenemanget, så hamnar de i galleriet.">
          <CardGrid>
            {(all ? past : past.slice(0, PAST_EVENTS)).map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </CardGrid>
          {!all && past.length > PAST_EVENTS && <ShowAll href="/admin/bilder?visa=alla#har-varit">Visa alla {past.length} evenemang</ShowAll>}
        </Section>
      )}

      {news.length > 0 && (
        <Section id="nyheter" title="Nyheter" description="Omslaget visas överst i nyheten och i nyhetslistan.">
          <CardGrid>
            {(all ? news : news.slice(0, NEWS)).map((n) => (
              <ImageCard key={n.id} label={n.title} meta={[formatTimestamp(n.published_at), n.committee?.short_name ?? "Hela sektionen", !n.published && "Utkast"]}>
                <CoverSlot label={n.title} image={n.cover} save={setNewsCover.bind(null, n.id)} />
              </ImageCard>
            ))}
          </CardGrid>
          {!all && news.length > NEWS && <ShowAll href="/admin/bilder?visa=alla#nyheter">Visa alla {news.length} nyheter</ShowAll>}
        </Section>
      )}

      <Section id="loggor" title="Utskottsloggor" description="Visas på utskottens sidor och vid deras evenemang. PNG eller WebP med genomskinlig bakgrund blir bäst.">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {committees.map((c) => (
            <ImageCard key={c.id} label={c.short_name} meta={[c.name]}>
              <CoverSlot label={c.short_name} image={logoRef(c.logo_url)} save={setCommitteeLogo.bind(null, c.id)} aspect="aspect-square" fit="contain" />
            </ImageCard>
          ))}
        </ul>
      </Section>
    </>
  );
}

function Section({ id, title, description, children }: { id: string; title: string; description: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`${id}-rubrik`} id={id} className="mb-12 scroll-mt-24">
      <h2 id={`${id}-rubrik`} className="text-lg font-bold">
        {title}
      </h2>
      <p className="mt-1 text-sm text-stone">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const CardGrid = ({ children }: { children: ReactNode }) => <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</ul>;

function EventCard({ event: e, flagMissing }: { event: EventItem; flagMissing?: boolean }) {
  return (
    <ImageCard
      label={e.title}
      meta={[formatDate(e.starts_at), e.committee?.short_name ?? "Hela sektionen", !e.published && "Utkast"]}
      flag={flagMissing && !e.cover ? "Saknar omslag" : undefined}
      link={{ href: `/admin/bilder/evenemang/${e.id}`, label: e.image_count > 0 ? `Galleri (${e.image_count})` : "Galleri" }}
    >
      <CoverSlot label={e.title} image={e.cover} save={setEventCover.bind(null, e.id)} />
    </ImageCard>
  );
}

/** Ett kort per bild. Gruppen bär namnet, så att knapparna i fältet (Byt, Ta bort) går att skilja åt med skärmläsare. */
function ImageCard({
  label,
  meta,
  flag,
  link,
  children,
}: {
  label: string;
  meta: (string | false)[];
  flag?: string;
  link?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <li>
      <div role="group" aria-label={label} className="flex h-full flex-col rounded-[1.5rem] border border-ink/10 bg-white p-4">
        {children}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-xs text-stone">
          <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
            {flag && <span className="chip bg-red/10 text-red-deep">{flag}</span>}
            {meta.filter(Boolean).join(" · ")}
          </span>
          {link && (
            <Link href={link.href} className="inline-flex items-center gap-1 font-semibold text-red-deep hover:underline">
              {link.label} <ArrowRight size={13} />
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}

function ShowAll({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-red-deep hover:underline">
      {children} <ArrowRight size={14} />
    </Link>
  );
}
