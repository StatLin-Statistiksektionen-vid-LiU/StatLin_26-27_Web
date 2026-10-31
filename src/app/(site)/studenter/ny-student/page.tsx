import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ContentPage } from "@/components/content/content-page";
import { EventRow } from "@/components/content/event-card";
import { Overall } from "@/components/content/overall";
import { ArrowRight } from "@/components/icons";
import { HeroSkeleton } from "@/components/ui/skeletons";
import { listUpcomingEvents } from "@/lib/data/events";

export const metadata: Metadata = {
  title: "Nya studenter",
  description: "Välkommen till StatLin – oavsett om du börjar på kandidaten eller mastern. Mottagningen, overallen och vanliga frågor.",
};

export default function NewStudentPage() {
  return (
    <Suspense fallback={<HeroSkeleton />}>
      <NewStudent />
    </Suspense>
  );
}

async function NewStudent() {
  const events = await listUpcomingEvents(4);
  return (
    <ContentPage
      slug="ny-student"
      kicker="Studenter / Nya studenter"
      heroAside={
        <div className="hidden grid-cols-2 gap-4 md:grid">
          <div className="-rotate-3 transition-transform duration-700 hover:rotate-0">
            <Overall side="fram" />
          </div>
          <div className="rotate-3 transition-transform duration-700 hover:rotate-0">
            <Overall side="bak" />
          </div>
        </div>
      }
      aside={
        <div className="sticky top-[calc(var(--header-h)+1.5rem)] space-y-4">
          <div className="rounded-[1.75rem] border border-ink/10 bg-white p-6">
            <p className="kicker text-stone">Nästa på schemat</p>
            <div className="mt-2">
              {events.length > 0 ? (
                events.map((e) => <EventRow key={e.id} event={e} />)
              ) : (
                <p className="py-6 text-stone">Schemat publiceras snart.</p>
              )}
            </div>
            <Link href="/evenemang" className="btn btn-ink mt-5 w-full">
              Hela kalendern <ArrowRight size={18} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 rounded-[1.75rem] bg-ink p-6 md:hidden">
            <Overall side="fram" />
            <Overall side="bak" />
          </div>
        </div>
      }
    />
  );
}
