import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowUpRight } from "@/components/icons";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { PageSkeleton } from "@/components/ui/skeletons";
import { listCommittees } from "@/lib/data/content";

export const metadata: Metadata = {
  title: "Utskott",
  description: "SCB, UBU, SASU, StatPub, STIG, eSTIG och fler – hitta ditt sammanhang på StatLin.",
};

export default function CommitteesPage() {
  return (
    <>
      <PageHero
        kicker="Sektionen / Utskott"
        title={
          <>
            Utsk<span className="text-red">ott</span>
          </>
        }
        lead="Utskotten är hjärtat i sektionen. Varje utskott har sin egen logga – alla byggda på samma baslogotyp, men med sin egen bakgrundsgrafik."
      />
      <Suspense fallback={<PageSkeleton />}>
        <Committees />
      </Suspense>
    </>
  );
}

async function Committees() {
  const committees = (await listCommittees({ visibleOnly: true })).filter((c) => c.kind !== "styrelse");
  return (
    <section className="container-site py-16 md:py-24">
      <div className="grid gap-5 md:grid-cols-2">
        {committees.map((c, i) => (
          <Reveal key={c.id} delay={(i % 2) * 90}>
            <Link
              href={`/utskott/${c.slug}`}
              className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-ink p-8 text-white sm:flex-row sm:items-center sm:gap-8 md:p-10"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -left-20 -top-20 size-80 rounded-full opacity-40 blur-3xl transition-opacity duration-700 group-hover:opacity-80"
                style={{ background: c.accent }}
              />
              <div className="grid-paper pointer-events-none absolute inset-0 text-white opacity-60" aria-hidden />
              {c.logo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.logo_url}
                  alt={`${c.short_name}-loggan`}
                  className="relative size-32 shrink-0 object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.6)] transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:-translate-y-1 group-hover:rotate-[-8deg] group-hover:scale-110 md:size-40"
                  loading="lazy"
                />
              )}
              <div className="relative mt-6 sm:mt-0">
                <p className="kicker text-white/50">{c.kind === "ovrigt" ? "Förtroendepost" : "Utskott"}</p>
                <h2 className="display-tight mt-2 text-3xl normal-case">{c.short_name}</h2>
                <p className="mt-1 text-sm text-white/60">{c.name}</p>
                <p className="mt-4 text-[0.98rem] leading-relaxed text-white/75">{c.tagline}</p>
              </div>
              <span className="absolute right-6 top-6 grid size-11 place-items-center rounded-full border border-white/15 transition-all duration-500 group-hover:border-red group-hover:bg-red">
                <ArrowUpRight size={18} />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
