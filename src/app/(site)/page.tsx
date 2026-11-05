import type { Metadata } from "next";
import { Suspense } from "react";
import { Hero } from "@/components/home/hero";
import { HomeSections } from "@/components/home/home-sections";
import { MarqueeFallback, UpcomingMarquee } from "@/components/home/upcoming-marquee";
import { HomeSkeleton } from "@/components/ui/skeletons";
import { SITE_ALTERNATES } from "@/lib/site-metadata";

export const metadata: Metadata = {
  alternates: { ...SITE_ALTERNATES, canonical: "/", languages: { sv: "/", en: "/en" } },
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
