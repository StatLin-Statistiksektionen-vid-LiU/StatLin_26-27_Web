import Link from "next/link";
import { Suspense } from "react";
import { getSettings } from "@/lib/data/content";
import { NAV } from "@/lib/navigation";
import { ArrowUpRight, Facebook, Instagram, Linkedin, Mail, Rss } from "@/components/icons";

/** Normalfördelningens täthetsfunktion som dekor – med medelvärdet markerat i rött. */
function BellCurve() {
  const pts: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const x = (i / 120) * 8 - 4;
    const y = Math.exp(-(x * x) / 2);
    pts.push(`${(i / 120) * 1000},${(220 - y * 200).toFixed(1)}`);
  }
  return (
    <svg viewBox="0 0 1000 230" className="h-auto w-full" aria-hidden preserveAspectRatio="none">
      <defs>
        <linearGradient id="bell-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff0707" stopOpacity="0.22" />
          <stop offset="1" stopColor="#ff0707" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,220 ${pts.join(" ")} 1000,220`} fill="url(#bell-fill)" />
      <polyline points={pts.join(" ")} fill="none" stroke="#ff0707" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      {[-3, -2, -1, 0, 1, 2, 3].map((s) => (
        <g key={s}>
          <line x1={500 + s * 125} x2={500 + s * 125} y1={s === 0 ? 20 : 215} y2="226" stroke="white" strokeOpacity={s === 0 ? 0.5 : 0.25} strokeDasharray={s === 0 ? "4 6" : undefined} vectorEffect="non-scaling-stroke" />
        </g>
      ))}
      <line x1="0" x2="1000" y1="220" y2="220" stroke="white" strokeOpacity="0.2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

async function FooterContact() {
  const s = await getSettings();
  const socials = [
    { href: s.instagram, label: "Instagram", Icon: Instagram },
    { href: s.facebook, label: "Facebook", Icon: Facebook },
    { href: s.linkedin, label: "LinkedIn", Icon: Linkedin },
  ].filter((x) => x.href);
  return (
    <div className="space-y-5">
      <a href={`mailto:${s.contact_email}`} className="group flex items-center gap-3 text-lg font-semibold text-white">
        <Mail size={18} className="text-red" />
        <span className="link-underline">{s.contact_email}</span>
      </a>
      {s.address && <p className="max-w-xs text-sm leading-relaxed text-white/50">{s.address}</p>}
      {s.org_number && <p className="kicker text-white/40">Org.nr {s.org_number}</p>}
      {socials.length > 0 && (
        <ul className="flex gap-2">
          {socials.map(({ href, label, Icon }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="grid size-11 place-items-center rounded-full border border-white/15 text-white/80 transition-colors hover:border-red hover:bg-red hover:text-white"
              >
                <Icon size={18} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SiteFooter() {
  const links = NAV.flatMap((g) => (g.children ? g.children : [g]));
  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      <div className="grid-paper pointer-events-none absolute inset-0 text-white [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" aria-hidden />
      <div className="container-site relative pt-24">
        <div className="grid gap-14 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="kicker text-red">Statistiksektionen i Linköping</p>
            <p className="display-tight mt-5 max-w-md text-[clamp(1.8rem,3.4vw,2.8rem)]">
              Allt blir mer <span className="serif-accent text-red">signifikant</span> tillsammans.
            </p>
            <div className="mt-8">
              <Suspense fallback={<div className="h-24" />}>
                <FooterContact />
              </Suspense>
            </div>
          </div>
          <nav aria-label="Sidfot" className="md:col-span-4 md:col-start-7">
            <p className="kicker text-white/40">Utforska</p>
            <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2.5">
              {links.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="link-underline text-[0.95rem] text-white/75 hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="md:col-span-2">
            <p className="kicker text-white/40">För poster</p>
            <ul className="mt-5 space-y-2.5 text-[0.95rem]">
              <li>
                <Link href="/admin" className="group inline-flex items-center gap-1.5 text-white/75 hover:text-white">
                  Logga in <ArrowUpRight size={14} className="text-red" />
                </Link>
              </li>
              <li>
                <a href="/kalender.ics" className="group inline-flex items-center gap-1.5 text-white/75 hover:text-white">
                  Kalenderflöde <Rss size={14} className="text-red" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-20">
          <BellCurve />
          <div className="mt-2 flex justify-between font-mono text-[0.65rem] text-white/35">
            <span>−3σ</span>
            <span>−2σ</span>
            <span>−σ</span>
            <span className="text-red">μ</span>
            <span>σ</span>
            <span>2σ</span>
            <span>3σ</span>
          </div>
        </div>

        <div
          aria-hidden
          className="display pointer-events-none mt-10 select-none whitespace-nowrap text-center text-[17.5vw] leading-[0.78] text-transparent [-webkit-text-stroke:1px_rgb(255_255_255/0.14)] md:text-[16.5vw]"
        >
          StatLin
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 py-8 text-sm text-white/45 md:flex-row md:items-center md:justify-between">
          <p>© StatLin – Statistiksektionen i Linköping</p>
          <p className="font-mono text-xs">p &lt; 0,05 sedan länge</p>
        </div>
      </div>
    </footer>
  );
}
