import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Facebook, Instagram, Linkedin, Mail, MapPin } from "@/components/icons";
import { PageHero } from "@/components/ui/page-hero";
import { PageSkeleton } from "@/components/ui/skeletons";
import { getPage, getSettings, listBoard, listCommittees } from "@/lib/data/content";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Kontakta StatLins styrelse och utskott.",
};

export default function ContactPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Contact />
    </Suspense>
  );
}

async function Contact() {
  const [page, settings, board, committees] = await Promise.all([getPage("kontakt"), getSettings(), listBoard(), listCommittees({ visibleOnly: true })]);
  const socials = [
    { href: settings.instagram, label: "Instagram", Icon: Instagram },
    { href: settings.facebook, label: "Facebook", Icon: Facebook },
    { href: settings.linkedin, label: "LinkedIn", Icon: Linkedin },
  ].filter((s) => s.href);

  return (
    <>
      <PageHero
        kicker="Kontakt"
        title={page?.title ?? "Kontakt"}
        lead={page?.lead}
      >
        <a href={`mailto:${settings.contact_email}`} className="group inline-flex items-center gap-4 text-[clamp(1.3rem,3vw,2.2rem)] font-semibold">
          <span className="grid size-12 place-items-center rounded-full bg-red text-white transition-transform group-hover:rotate-[-12deg]">
            <Mail size={22} />
          </span>
          <span className="link-underline">{settings.contact_email}</span>
        </a>
      </PageHero>

      <section className="container-site grid gap-16 py-16 md:py-24 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h2 className="kicker text-stone">Styrelsen</h2>
          <ul className="mt-4 border-t border-ink/10">
            {board.map((m) => (
              <li key={m.id} className="grid gap-1 border-b border-ink/10 py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6">
                <div>
                  <p className="font-bold">{m.post}</p>
                  <p className="text-sm text-stone">{m.name || "Vakant"}</p>
                </div>
                {m.email && (
                  <a href={`mailto:${m.email}`} className="inline-flex items-center gap-2 font-mono text-sm text-red-deep">
                    <Mail size={14} />
                    <span className="link-underline">{m.email}</span>
                  </a>
                )}
              </li>
            ))}
          </ul>

          <h2 className="kicker mt-14 text-stone">Utskott</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {committees
              .filter((c) => c.kind !== "styrelse" && c.email)
              .map((c) => (
                <li key={c.id}>
                  <a href={`mailto:${c.email}`} className="group flex items-center gap-4 rounded-2xl border border-ink/10 bg-white p-4 transition-colors hover:border-ink/30">
                    {c.logo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.logo_url} alt="" className="size-11 object-contain" loading="lazy" />
                    )}
                    <span className="min-w-0">
                      <span className="block font-bold">{c.short_name}</span>
                      <span className="block truncate font-mono text-xs text-stone group-hover:text-red-deep">{c.email}</span>
                    </span>
                  </a>
                </li>
              ))}
          </ul>
        </div>

        <aside className="space-y-4 lg:col-span-4 lg:col-start-9">
          <div className="rounded-[1.75rem] bg-ink p-7 text-white">
            <MapPin size={22} className="text-red" />
            <p className="kicker mt-5 text-white/50">Adress</p>
            <p className="mt-2 text-lg leading-relaxed">{settings.address}</p>
            {settings.sektionsrum && (
              <>
                <p className="kicker mt-6 text-white/50">Sektionsrum</p>
                <p className="mt-2">{settings.sektionsrum}</p>
              </>
            )}
            {settings.org_number && <p className="kicker mt-6 text-white/40">Org.nr {settings.org_number}</p>}
          </div>
          {socials.length > 0 && (
            <div className="rounded-[1.75rem] border border-ink/10 bg-white p-7">
              <p className="kicker text-stone">Följ oss</p>
              <ul className="mt-4 space-y-2">
                {socials.map(({ href, label, Icon }) => (
                  <li key={label}>
                    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 font-semibold hover:text-red-deep">
                      <Icon size={18} /> {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Link href="/foretag" className="block rounded-[1.75rem] border border-ink/10 bg-white p-7 transition-colors hover:border-ink/30">
            <p className="kicker text-stone">Företag?</p>
            <p className="mt-2 font-semibold">Läs om samarbeten och STAR →</p>
          </Link>
        </aside>
      </section>
    </>
  );
}
