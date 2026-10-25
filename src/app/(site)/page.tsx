import { Suspense } from "react";
import { Hero } from "@/components/home/hero";
import { HomeSections } from "@/components/home/home-sections";
import { MarqueeFallback, UpcomingMarquee } from "@/components/home/upcoming-marquee";
import { HomeSkeleton } from "@/components/ui/skeletons";

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
