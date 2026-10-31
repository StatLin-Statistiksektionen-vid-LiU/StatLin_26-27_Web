import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BoardCard } from "@/components/content/board-card";
import { Markdown } from "@/components/content/markdown";
import { ArrowRight, ArrowUpRight, FileText, Image as ImageIcon, Layers } from "@/components/icons";
import { PageHero } from "@/components/ui/page-hero";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { HeroSkeleton, PageSkeleton } from "@/components/ui/skeletons";
import { getPage, listBoard, listCommittees } from "@/lib/data/content";
import { Editable } from "@/components/edit-mode/editable";
import { AccentText, stripAccent } from "@/components/ui/accent-text";

export const metadata: Metadata = {
  title: "Om StatLin",
  description: "StatLin – Statistiksektionen i Linköping. Om sektionen, styrelsen och utskotten.",
};

export default function AboutPage() {
  return (
    <Suspense
      fallback={
        <>
          <HeroSkeleton />
          <PageSkeleton />
        </>
      }
    >
      <AboutContent />
    </Suspense>
  );
}

async function AboutContent() {
  const [page, board, committees] = await Promise.all([getPage("om"), listBoard(), listCommittees({ visibleOnly: true })]);
  const utskott = committees.filter((c) => c.kind !== "styrelse");
  const title = page?.title.trim() || "Om *StatLin*";

  return (
    <>
      <Editable target={{ type: "page", slug: "om" }} label="Redigera sidan" inset penClassName="top-[calc(var(--header-h)+1rem)] right-4">
      <PageHero
        kicker="Sektionen"
        title={<AccentText text={title} accentClassName="text-red" />}
        fitTitle={stripAccent(title)}
        lead={page?.lead}
        aside={
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/brand/statlin-inverterad.svg" alt="" className="mx-auto hidden w-64 animate-float drop-shadow-[0_30px_50px_rgba(255,7,7,0.25)] md:block" />
        }
      />
      </Editable>

      <section className="container-site grid gap-14 py-16 md:py-24 lg:grid-cols-12">
        <Editable target={{ type: "page", slug: "om" }} label="Redigera texten" className="min-w-0 lg:col-span-7">
          {page && <Markdown source={page.body_md} />}
        </Editable>
        <aside className="lg:col-span-4 lg:col-start-9">
          <div className="sticky top-[calc(var(--header-h)+1.5rem)] space-y-4">
            <div className="rounded-[1.75rem] border border-ink/10 bg-white p-7">
              <p className="kicker text-stone">Snabbfakta</p>
              <dl className="mt-5 space-y-4 text-[0.95rem]">
                <Fact label="Namn">Statistiksektionen i Linköping</Fact>
                <Fact label="Förkortning">
                  <span className="font-mono">StatLin · StLn · StL · SL · S</span>
                </Fact>
                <Fact label="Program">
                  Statistik och dataanalys, 180 hp
                  <br />
                  Statistics and Machine Learning, 120 hp
                </Fact>
                <Fact label="Färger">
                  <span className="flex gap-2">
                    {["#ff0707", "#000000", "#ffffff"].map((c) => (
                      <span key={c} className="size-7 rounded-full ring-1 ring-ink/15" style={{ background: c }} title={c} />
                    ))}
                  </span>
                </Fact>
                <Fact label="Utskott">{utskott.map((c) => c.short_name).join(", ")}</Fact>
              </dl>
            </div>
            <div className="grid gap-2">
              {[
                { href: "/dokument", label: "Stadgar & dokument", Icon: FileText },
                { href: "/grafisk-profil", label: "Grafisk profil", Icon: Layers },
                { href: "/galleri", label: "Galleri", Icon: ImageIcon },
              ].map(({ href, label, Icon }) => (
                <Link key={href} href={href} className="group flex items-center gap-4 rounded-2xl border border-ink/10 bg-white px-5 py-4 transition-colors hover:border-ink/30">
                  <Icon size={18} className="text-red" />
                  <span className="flex-1 font-semibold">{label}</span>
                  <ArrowUpRight size={16} className="opacity-40 transition-opacity group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </section>

      {board.length > 0 && (
        <section className="border-t border-ink/10 bg-paper-2/50 py-20 md:py-28">
          <div className="container-site">
            <Reveal>
              <SectionHeading kicker="Styrelsen" title={<>Möt <span className="mono-accent text-red-deep">styrelsen</span></>} href="/sektionen/styrelsen" linkLabel="Hela styrelsen" />
            </Reveal>
            <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
              {board.slice(0, 4).map((m, i) => (
                <Reveal key={m.id} delay={i * 70}>
                  <BoardCard member={m} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-20 md:py-28">
        <div className="container-site">
          <Reveal>
            <SectionHeading kicker="Utskott" title={<>Våra <span className="mono-accent text-red-deep">utskott</span></>} href="/utskott" linkLabel="Alla utskott" />
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {utskott.map((c, i) => (
              <Reveal key={c.id} delay={(i % 4) * 60}>
                <Link href={`/utskott/${c.slug}`} className="group flex h-full items-center gap-4 rounded-[1.5rem] border border-ink/10 bg-white p-5 transition-all hover:-translate-y-1 hover:border-ink/25 hover:shadow-[0_20px_40px_-25px_rgba(0,0,0,0.3)]">
                  {c.logo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.logo_url} alt="" className="size-16 shrink-0 object-contain transition-transform duration-700 group-hover:rotate-[-10deg]" loading="lazy" />
                  )}
                  <span className="min-w-0">
                    <span className="display-tight block text-lg normal-case">{c.short_name}</span>
                    <span className="mt-0.5 line-clamp-2 block text-sm text-stone">{c.tagline}</span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
          <div className="mt-12">
            <Link href="/kontakt" className="btn btn-ink group">
              Kontakta oss <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-3 border-b border-ink/[0.07] pb-4 last:border-0 last:pb-0">
      <dt className="kicker pt-0.5 text-stone">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}
