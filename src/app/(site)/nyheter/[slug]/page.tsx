import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Markdown } from "@/components/content/markdown";
import { NewsCard, newsDate } from "@/components/content/news-card";
import { SmartImage } from "@/components/content/smart-image";
import { ArrowLeft } from "@/components/icons";
import { HeroSkeleton } from "@/components/ui/skeletons";
import { getNewsBySlug, listNews } from "@/lib/data/news";
import { fitHeading, stripMarkdown } from "@/lib/utils";
import { EditModeButton, Editable } from "@/components/edit-mode/editable";

export async function generateMetadata({ params }: PageProps<"/nyheter/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const item = await getNewsBySlug(slug);
  if (!item) return { title: "Nyheten hittades inte" };
  return {
    title: item.title,
    description: item.excerpt || stripMarkdown(item.body_md),
    openGraph: { type: "article", publishedTime: item.published_at, images: item.cover ? [{ url: item.cover.src }] : undefined },
  };
}

export default function NewsArticlePage(props: PageProps<"/nyheter/[slug]">) {
  return (
    <Suspense fallback={<HeroSkeleton />}>
      <Article params={props.params} />
    </Suspense>
  );
}

async function Article({ params }: { params: PageProps<"/nyheter/[slug]">["params"] }) {
  const { slug } = await params;
  const item = await getNewsBySlug(slug);
  if (!item) notFound();
  const more = (await listNews(4)).filter((n) => n.id !== item.id).slice(0, 3);

  return (
    <article>
      <Editable target={{ type: "news", id: item.id, committeeId: item.committee_id }} label="Redigera nyheten" inset penClassName="top-[calc(var(--header-h)+1rem)] right-4">
      <header className="noise relative overflow-hidden bg-ink text-white">
        <div className="grid-paper pointer-events-none absolute inset-0 text-white [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]" aria-hidden />
        <div className="container-prose relative pb-14 pt-[calc(var(--header-h)+3rem)] md:pt-[calc(var(--header-h)+5rem)]">
          <Link href="/nyheter" className="kicker inline-flex items-center gap-2 text-white/60 hover:text-white">
            <ArrowLeft size={14} /> Alla nyheter
          </Link>
          <p className="kicker mt-8 flex flex-wrap items-center gap-3 text-white/60">
            <time dateTime={item.published_at}>{newsDate(item)}</time>
            {item.committee && (
              <>
                <span className="h-px w-5 bg-white/30" aria-hidden />
                <Link href={`/utskott/${item.committee.slug}`} className="hover:text-white">
                  {item.committee.short_name}
                </Link>
              </>
            )}
          </p>
          <h1 className="mt-5 font-extrabold leading-[1.02] tracking-tight [font-stretch:112%] [overflow-wrap:break-word]" style={fitHeading(item.title, { maxRem: 4, maxVw: 5.2, charWidth: 0.68 })}>
            {item.title}
          </h1>
          {item.excerpt && <p className="mt-6 text-xl leading-relaxed text-white/70">{item.excerpt}</p>}
          {item.author_name && (
            <p className="mt-8 text-sm text-white/50">
              Av <span className="text-white/80">{item.author_name}</span>
              {item.author_post && <>, {item.author_post}</>}
            </p>
          )}
        </div>
        <EditModeButton target={{ type: "news-cover", id: item.id, committeeId: item.committee_id }} className="absolute bottom-5 right-5 z-30">
          Byt omslag
        </EditModeButton>
      </header>
      </Editable>
      {item.cover && (
        <div className="container-site -mt-2 pt-10">
          <SmartImage image={item.cover} priority sizes="(min-width: 1400px) 1400px, 100vw" className="aspect-[21/9] w-full rounded-[2rem]" alt="" />
        </div>
      )}
      <div className="container-prose py-14 md:py-20">
        <Markdown source={item.body_md} />
      </div>
      {more.length > 0 && (
        <section className="border-t border-ink/10 bg-paper-2/50 py-16 md:py-20">
          <div className="container-site">
            <h2 className="kicker text-stone">Fler nyheter</h2>
            <div className="mt-8 grid gap-10 md:grid-cols-3">
              {more.map((n) => (
                <NewsCard key={n.id} item={n} />
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
