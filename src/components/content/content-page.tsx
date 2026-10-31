import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Markdown } from "./markdown";
import { Editable } from "@/components/edit-mode/editable";
import { AccentText, stripAccent } from "@/components/ui/accent-text";
import { PageHero } from "@/components/ui/page-hero";
import { getPage } from "@/lib/data/content";

/** Redigerbar sida: titel, ingress och brödtext kommer från adminpanelen (Sidor). */
export async function ContentPage({
  slug,
  kicker,
  aside,
  heroAside,
  children,
}: {
  slug: string;
  kicker: string;
  aside?: ReactNode;
  heroAside?: ReactNode;
  children?: ReactNode;
}) {
  const page = await getPage(slug);
  if (!page) notFound();
  return (
    <>
      <Editable target={{ type: "page", slug }} label="Redigera sidan" inset penClassName="top-[calc(var(--header-h)+1rem)] right-4">
        <PageHero
          kicker={kicker}
          title={<AccentText text={page.title} accentClassName="text-red" />}
          fitTitle={stripAccent(page.title)}
          lead={page.lead}
          aside={heroAside}
        />
      </Editable>
      <section className="container-site grid gap-14 py-16 md:py-24 lg:grid-cols-12">
        {/* min-w-0: förkortade rader i sidokolumnen (t.ex. evenemangstitlar) får annars kolumnen att växa på mobil. */}
        <Editable target={{ type: "page", slug }} label="Redigera texten" className={aside ? "min-w-0 lg:col-span-7" : "min-w-0 lg:col-span-8"}>
          <Markdown source={page.body_md} />
        </Editable>
        {aside && <aside className="min-w-0 lg:col-span-4 lg:col-start-9">{aside}</aside>}
      </section>
      {children}
    </>
  );
}
