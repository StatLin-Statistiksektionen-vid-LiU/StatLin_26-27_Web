import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NewsCard } from "@/components/content/news-card";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { PageSkeleton } from "@/components/ui/skeletons";
import { countNews, listNews } from "@/lib/data/news";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Nyheter",
  description: "Nyheter från styrelsen och utskotten på StatLin.",
};

const PER_PAGE = 9;

export default function NewsPage(props: PageProps<"/nyheter">) {
  return (
    <>
      <PageHero kicker="Nyheter" title={<>Senaste <span className="mono-accent text-red">nytt</span></>} lead="Information från styrelsen och utskotten – från sittningsanmälningar till beslut på sektionsmötet." />
      <Suspense fallback={<PageSkeleton />}>
        <NewsList searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function NewsList({ searchParams }: { searchParams: PageProps<"/nyheter">["searchParams"] }) {
  const sp = await searchParams;
  // Bara heltal: SQLite vägrar OFFSET med decimaler (t.ex. ?sida=1.5 eller ?sida=Infinity).
  const requested = Number(sp.sida);
  const page = Number.isSafeInteger(requested) && requested > 1 ? requested : 1;
  const [items, total] = await Promise.all([listNews(PER_PAGE, (page - 1) * PER_PAGE), countNews()]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  if (items.length === 0) {
    return <p className="container-site py-24 text-center text-stone">Inga nyheter ännu.</p>;
  }
  const [first, ...rest] = items;
  return (
    <section className="container-site py-14 md:py-20">
      {page === 1 ? (
        <Reveal>
          <NewsCard item={first} featured />
        </Reveal>
      ) : null}
      <div className={cn("grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3", page === 1 && "mt-16 border-t border-ink/10 pt-14")}>
        {(page === 1 ? rest : items).map((n, i) => (
          <Reveal key={n.id} delay={(i % 3) * 80}>
            <NewsCard item={n} />
          </Reveal>
        ))}
      </div>
      {pages > 1 && (
        <nav aria-label="Sidor" className="mt-16 flex justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={p === 1 ? "/nyheter" : `/nyheter?sida=${p}`}
              aria-current={p === page ? "page" : undefined}
              className={cn("grid size-11 place-items-center rounded-full border font-mono text-sm", p === page ? "border-ink bg-ink text-white" : "border-ink/15 bg-white hover:border-ink")}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </section>
  );
}
