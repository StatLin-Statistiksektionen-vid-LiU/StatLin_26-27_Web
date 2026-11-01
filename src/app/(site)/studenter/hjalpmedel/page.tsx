import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Markdown } from "@/components/content/markdown";
import { Editable } from "@/components/edit-mode/editable";
import { ResourceBoard } from "@/components/resources/resource-board";
import { AccentText, stripAccent } from "@/components/ui/accent-text";
import { PageHero } from "@/components/ui/page-hero";
import { HeroSkeleton } from "@/components/ui/skeletons";
import { getPage } from "@/lib/data/content";
import { listResources } from "@/lib/data/resources";

export const metadata: Metadata = {
  title: "Hjälpmedel",
  description: "Fusklappar, GitHub-länkar och guider till kandidat- och masterprogrammet i statistik, sorterade på årskurs och termin.",
};

export default function ResourcesPage(props: PageProps<"/studenter/hjalpmedel">) {
  return (
    <Suspense fallback={<HeroSkeleton />}>
      <Resources searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Resources({ searchParams }: { searchParams: PageProps<"/studenter/hjalpmedel">["searchParams"] }) {
  const [page, resources, sp] = await Promise.all([getPage("hjalpmedel"), listResources(), searchParams]);
  if (!page) notFound();
  const program = sp.program === "master" ? "master" : "kandidat";
  return (
    <>
      <Editable target={{ type: "page", slug: "hjalpmedel" }} label="Redigera sidan" inset penClassName="top-[calc(var(--header-h)+1rem)] right-4">
        <PageHero kicker="Studenter / Hjälpmedel" title={<AccentText text={page.title} accentClassName="text-red" />} fitTitle={stripAccent(page.title)} lead={page.lead} />
      </Editable>
      {/* Sidan kan ligga kvar dold från ett tidigare besök med en annan flik. Nyckeln gör att en länk till ?program=master alltid öppnar rätt flik. */}
      <ResourceBoard key={program} resources={resources} initialProgram={program} />
      {page.body_md.trim() && (
        <section className="container-prose pb-24">
          <Editable target={{ type: "page", slug: "hjalpmedel" }} label="Redigera texten">
            <Markdown source={page.body_md} />
          </Editable>
        </section>
      )}
    </>
  );
}
