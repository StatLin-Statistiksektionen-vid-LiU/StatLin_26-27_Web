import type { Metadata } from "next";
import { Suspense } from "react";
import { ContentPage } from "@/components/content/content-page";
import { SmartImage } from "@/components/content/smart-image";
import { StarField } from "@/components/home/home-sections";
import { ArrowUpRight, Mail } from "@/components/icons";
import { Reveal } from "@/components/ui/reveal";
import { HeroSkeleton } from "@/components/ui/skeletons";
import { getCommitteeBySlug, listPartners } from "@/lib/data/content";
import { listUpcomingEvents } from "@/lib/data/events";
import { STAR_COPY } from "@/lib/seed-content";
import { formatDateLong } from "@/lib/dates";
import { safeExternalUrl } from "@/lib/utils";
import { EditModeLink } from "@/components/edit-mode/editable";

export const metadata: Metadata = {
  title: "För företag",
  description: "Samarbeta med StatLin och nå Linköpings statistik- och datastudenter. STAR – StatLins arbetsmarknadsdag.",
};

export default function CompaniesPage() {
  return (
    <Suspense fallback={<HeroSkeleton />}>
      <Companies />
    </Suspense>
  );
}

async function Companies() {
  const [partners, sasu, upcoming] = await Promise.all([listPartners({ activeOnly: true }), getCommitteeBySlug("sasu"), listUpcomingEvents(20)]);
  const star = upcoming.find((e) => /star/i.test(e.slug));
  const contact = sasu?.email || "sasu@statlin.se";

  return (
    <ContentPage
      slug="foretag"
      kicker="Näringsliv"
      aside={
        <div className="sticky top-[calc(var(--header-h)+1.5rem)] rounded-[1.75rem] bg-ink p-7 text-white">
          <p className="kicker text-white/50">Kontakt</p>
          <p className="display-tight mt-3 text-2xl">Näringslivsansvarig</p>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-white/70">
            SASU tar fram upplägg för lunchföreläsningar, case, annonser och STAR. Berätta vad ni vill uppnå så återkommer vi.
          </p>
          <a href={`mailto:${contact}?subject=${encodeURIComponent("Samarbete med StatLin")}`} className="btn btn-red mt-6 w-full">
            <Mail size={18} /> {contact}
          </a>
        </div>
      }
    >
      {/* STAR */}
      <section className="relative overflow-hidden bg-star-navy py-24 text-white md:py-32">
        <StarField />
        <div className="container-site relative grid items-center gap-12 md:grid-cols-12">
          <Reveal className="md:col-span-7">
            <p className="kicker text-white/60">{STAR_COPY.subtitle}</p>
            <p className="mt-6 text-[clamp(4rem,12vw,9rem)] font-light uppercase leading-none tracking-[0.2em] [font-stretch:110%]">
              {STAR_COPY.title}
            </p>
            <div className="mt-3 h-1 w-[min(100%,26rem)] bg-[#8f1d1d]" aria-hidden />
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/80">{STAR_COPY.text}</p>
            {star && (
              <a href={`/evenemang/${star.slug}`} className="btn btn-light mt-8">
                {formatDateLong(star.starts_at)} <ArrowUpRight size={18} />
              </a>
            )}
          </Reveal>
          <Reveal delay={150} className="flex justify-center md:col-span-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/utskott/star.webp" alt="STAR-loggan" className="w-[min(70vw,22rem)] animate-float drop-shadow-[0_40px_60px_rgba(0,0,0,0.5)]" />
          </Reveal>
        </div>
      </section>

      {/* Partners */}
      <section className="py-20 md:py-28">
        <div className="container-site">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="kicker text-stone">Samarbetspartners</p>
            <EditModeLink target={{ type: "page", slug: "foretag" }} href="/admin/partners" icon="edit">
              Hantera partners
            </EditModeLink>
          </div>
          {partners.length > 0 ? (
            <ul className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[1.75rem] border border-ink/10 bg-ink/10 md:grid-cols-4">
              {partners.map((p) => {
                const url = safeExternalUrl(p.url);
                const inner = (
                  <>
                    {p.logo ? (
                      <SmartImage image={p.logo} sizes="200px" className="h-16 w-auto max-w-[80%] object-contain grayscale transition-all duration-500 group-hover:grayscale-0" alt={p.name} />
                    ) : (
                      <span className="display-tight text-xl">{p.name}</span>
                    )}
                    {p.tier === "huvudpartner" && <span className="chip absolute left-3 top-3 bg-red text-white">Huvudpartner</span>}
                  </>
                );
                return (
                  <li key={p.id} className="bg-white">
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="group relative flex h-40 items-center justify-center p-6">
                        {inner}
                      </a>
                    ) : (
                      <div className="group relative flex h-40 items-center justify-center p-6">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-8 flex flex-col items-start justify-between gap-6 rounded-[1.75rem] border border-dashed border-ink/25 p-10 md:flex-row md:items-center">
              <div>
                <p className="display-tight text-2xl">Er logga här?</p>
                <p className="mt-2 max-w-lg text-stone">Vi söker partners som vill möta framtidens statistiker och data scientists. Hör av er så berättar vi mer.</p>
              </div>
              <a href={`mailto:${contact}`} className="btn btn-ink shrink-0">
                Kontakta SASU
              </a>
            </div>
          )}
        </div>
      </section>
    </ContentPage>
  );
}
