import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ContentPage } from "@/components/content/content-page";
import { EventRow } from "@/components/content/event-card";
import { TranslateTip } from "@/components/content/translate-tip";
import { ArrowRight, Mail } from "@/components/icons";
import { HeroSkeleton } from "@/components/ui/skeletons";
import { getCommitteeBySlug } from "@/lib/data/content";
import { listUpcomingEvents } from "@/lib/data/events";

export const metadata: Metadata = {
  title: "Master's students",
  description: "For students on the master's programme Statistics and Machine Learning at Linköping University: events, contacts and how to get involved in StatLin.",
  alternates: { canonical: "/en/masters" },
};

export default function MastersPage() {
  return (
    <div lang="en">
      <Suspense fallback={<HeroSkeleton />}>
        <Masters />
      </Suspense>
    </div>
  );
}

async function Masters() {
  const [ubu, events] = await Promise.all([getCommitteeBySlug("ubu"), listUpcomingEvents(4)]);
  return (
    <ContentPage
      slug="en-masters"
      kicker="In English / Master's students"
      aside={
        <div className="sticky top-[calc(var(--header-h)+1.5rem)] space-y-4">
          <div className="rounded-[1.75rem] border border-ink/10 bg-white p-6">
            <p className="kicker text-stone">Next up</p>
            <div className="mt-2">
              {events.length > 0 ? events.map((e) => <EventRow key={e.id} event={e} />) : <p className="py-6 text-stone">New events are coming soon.</p>}
            </div>
            <Link href="/evenemang" className="btn btn-ink mt-5 w-full">
              Full calendar <ArrowRight size={18} />
            </Link>
          </div>
          {ubu && (
            <div className="overflow-hidden rounded-[1.75rem] bg-ink p-7 text-white">
              <div className="flex items-center gap-4">
                {ubu.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ubu.logo_url} alt="" className="size-16 object-contain" />
                )}
                <div>
                  <p className="kicker text-white/50">Your education</p>
                  <p className="display-tight mt-1 text-2xl normal-case" translate="no">
                    {ubu.short_name}
                  </p>
                </div>
              </div>
              <p className="mt-5 text-[0.95rem] leading-relaxed text-white/70">Questions about courses, exams or your study environment? Contact UBU – anonymously if you prefer.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {ubu.email && (
                  <a href={`mailto:${ubu.email}`} className="btn btn-red btn-sm">
                    <Mail size={15} /> Email UBU
                  </a>
                )}
                <Link href={`/utskott/${ubu.slug}`} className="btn btn-ghost-dark btn-sm">
                  About UBU
                </Link>
              </div>
            </div>
          )}
          <TranslateTip />
        </div>
      }
    />
  );
}
