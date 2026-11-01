import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Markdown } from "@/components/content/markdown";
import { Editable } from "@/components/edit-mode/editable";
import { LinkBoard } from "@/components/links/link-board";
import { WeekCard } from "@/components/links/week-card";
import { AccentText, stripAccent } from "@/components/ui/accent-text";
import { PageHero } from "@/components/ui/page-hero";
import { HeroSkeleton } from "@/components/ui/skeletons";
import { getPage } from "@/lib/data/content";
import { listLinks } from "@/lib/data/links";
import { todayLocal } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Länkar",
  description: "Schema, tentor, Lisam och tentastatistik för alla LiU-kurser – allt du behöver som student, samlat på ett ställe.",
};

export default function LinksPage() {
  return (
    <Suspense fallback={<HeroSkeleton />}>
      <Links />
    </Suspense>
  );
}

async function Links() {
  const [page, links] = await Promise.all([getPage("lankar"), listLinks({ activeOnly: true })]);
  if (!page) notFound();
  return (
    <>
      <Editable target={{ type: "page", slug: "lankar" }} label="Redigera sidan" inset penClassName="top-[calc(var(--header-h)+1rem)] right-4">
        <PageHero
          kicker="Studenter / Länkar"
          title={<AccentText text={page.title} accentClassName="text-red" />}
          fitTitle={stripAccent(page.title)}
          lead={page.lead}
          aside={
            <div className="flex md:justify-end">
              <WeekCard today={todayLocal()} />
            </div>
          }
        />
      </Editable>
      <LinkBoard links={links} />
      {page.body_md.trim() && (
        <section className="container-prose pb-24">
          <Editable target={{ type: "page", slug: "lankar" }} label="Redigera texten">
            <Markdown source={page.body_md} />
          </Editable>
        </section>
      )}
    </>
  );
}
