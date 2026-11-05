import type { Metadata } from "next";
import { Suspense } from "react";
import { Hero } from "@/components/home/hero";
import { HomeSections, HomeShortcuts } from "@/components/home/home-sections";
import { TimelineFallback, UpcomingTimeline } from "@/components/home/upcoming-timeline";
import { HomeSkeleton } from "@/components/ui/skeletons";
import { SITE_ALTERNATES } from "@/lib/site-metadata";

export const metadata: Metadata = {
  alternates: { ...SITE_ALTERNATES, canonical: "/", languages: { sv: "/", en: "/en" } },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      {/* Genvägarna ligger över bandet och kommer tillsammans med det, så att inget hoppar mellan dem. */}
      <Suspense fallback={<TimelineFallback />}>
        <HomeShortcuts />
        <UpcomingTimeline />
      </Suspense>
      <Suspense fallback={<HomeSkeleton />}>
        <HomeSections />
      </Suspense>
    </>
  );
}
