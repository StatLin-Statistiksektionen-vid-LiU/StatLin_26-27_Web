import type { Metadata } from "next";
import { Suspense } from "react";
import { Hero } from "@/components/home/hero";
import { HomeSections } from "@/components/home/home-sections";
import { MarqueeFallback, UpcomingMarquee } from "@/components/home/upcoming-marquee";
import { HomeSkeleton } from "@/components/ui/skeletons";

// alternates ersätter rotlayoutens, så kalenderflödet måste med här också.
export const metadata: Metadata = {
  alternates: { canonical: "/", languages: { sv: "/", en: "/en" }, types: { "text/calendar": "/kalender.ics" } },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Suspense fallback={<MarqueeFallback />}>
        <UpcomingMarquee />
      </Suspense>
      <Suspense fallback={<HomeSkeleton />}>
        <HomeSections />
      </Suspense>
    </>
  );
}
