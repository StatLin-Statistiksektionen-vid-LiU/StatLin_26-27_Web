"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { isEnglishPath, NAV, type NavGroup } from "@/lib/navigation";
import { ArrowUpRight, ChevronDown, Close, Menu } from "@/components/icons";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  // usePathname() är URL-data – på dynamiska routes måste den läsas inom en Suspense-gräns.
  return (
    <Suspense fallback={<HeaderView pathname={null} />}>
      <HeaderWithPath />
    </Suspense>
  );
}

function HeaderWithPath() {
  return <HeaderView pathname={usePathname()} />;
}

function HeaderView({ pathname }: { pathname: string | null }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [dropdown, setDropdown] = useState<string | null>(null);
  // Utfällda grupper i mobilmenyn. Saknas en grupp här är den utfälld om man står på någon av dess sidor.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isHome = pathname === "/";
  // Språkväxlaren leder till de engelska sidorna – eller tillbaka till startsidan från dem.
  const language =
    pathname !== null && isEnglishPath(pathname)
      ? { href: "/", short: "SV", label: "På svenska", lang: "sv" }
      : { href: "/en", short: "EN", label: "In English", lang: "en" };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > (isHome ? window.innerHeight * 0.55 : 24));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  // Stäng menyer vid navigering.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
    setDropdown(null);
    setExpanded({});
  }

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (setOpen(false), setDropdown(null));
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const active = (href: string) =>
    pathname !== null && (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/"));
  const groupActive = (g: NavGroup) => active(g.href) || !!g.children?.some((c) => active(c.href));
  const isExpanded = (g: NavGroup) => expanded[g.label] ?? groupActive(g);

  return (
    <>
      <a
        href="#innehall"
        className="sr-only z-[60] rounded-full bg-red px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Hoppa till innehållet
      </a>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 text-white transition-[background-color,border-color,backdrop-filter] duration-500",
          scrolled || open
            ? "border-b border-white/[0.08] bg-ink/90 backdrop-blur-xl backdrop-saturate-150"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="container-site flex h-[var(--header-h)] items-center justify-between gap-6">
          <Link href="/" className="group flex items-center gap-3" aria-label="StatLin – startsida">
            <span
              className={cn(
                "relative block h-9 overflow-hidden transition-all duration-700 ease-[var(--ease-out-expo)]",
                isHome && !scrolled && !open ? "-mr-3 w-0 scale-50 opacity-0" : "w-9 scale-100 opacity-100",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/statlin-inverterad.svg"
                alt=""
                width={36}
                height={36}
                className="size-9 transition-transform duration-700 group-hover:rotate-[-12deg]"
              />
            </span>
            <span className="display-tight text-[1.05rem] tracking-tight" translate="no">
              Stat<span className="text-red">Lin</span>
            </span>
          </Link>

          <nav aria-label="Huvudmeny" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV.map((item) =>
                item.children ? (
                  <li
                    key={item.href}
                    className="relative"
                    onMouseEnter={() => {
                      clearTimeout(closeTimer.current);
                      setDropdown(item.label);
                    }}
                    onMouseLeave={() => {
                      closeTimer.current = setTimeout(() => setDropdown(null), 160);
                    }}
                  >
                    <button
                      type="button"
                      aria-expanded={dropdown === item.label}
                      onClick={() => setDropdown((d) => (d === item.label ? null : item.label))}
                      className={cn(
                        "flex items-center gap-1 rounded-full px-3.5 py-2 text-[0.92rem] font-medium transition-colors hover:text-white",
                        groupActive(item) ? "text-white" : "text-white/70",
                      )}
                    >
                      {item.label}
                      <ChevronDown size={14} className={cn("transition-transform", dropdown === item.label && "rotate-180")} />
                    </button>
                    <div
                      className={cn(
                        "absolute left-1/2 top-full -translate-x-1/2 pt-3 transition-all duration-300 ease-[var(--ease-out-expo)]",
                        item.children.length > 3 ? "w-[34rem]" : "w-[22rem]",
                        dropdown === item.label ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0",
                      )}
                    >
                      <ul
                        className={cn(
                          "grid gap-1 rounded-3xl border border-white/10 bg-ink-2/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl",
                          item.children.length > 3 ? "grid-cols-2" : "grid-cols-1",
                        )}
                      >
                        {item.children.map((c) => (
                          <li key={c.href}>
                            <Link
                              href={c.href}
                              className={cn(
                                "group/item block rounded-2xl px-4 py-3 transition-colors hover:bg-white/[0.06]",
                                active(c.href) && "bg-white/[0.06]",
                              )}
                            >
                              <span className="flex items-center justify-between text-[0.95rem] font-semibold">
                                {c.label}
                                <ArrowUpRight size={14} className="text-red opacity-0 transition-opacity group-hover/item:opacity-100" />
                              </span>
                              <span className="mt-0.5 block text-[0.8rem] text-white/50">{c.description}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ) : (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "relative rounded-full px-3.5 py-2 text-[0.92rem] font-medium transition-colors hover:text-white",
                        active(item.href) ? "text-white" : "text-white/70",
                      )}
                    >
                      {item.label}
                      {active(item.href) && (
                        <span className="absolute inset-x-3.5 -bottom-0.5 h-[2px] rounded-full bg-red" aria-hidden />
                      )}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={language.href}
              hrefLang={language.lang}
              lang={language.lang}
              aria-label={language.label}
              title={language.label}
              className="inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-white/15 px-3 text-[0.82rem] font-semibold text-white/80 transition-colors hover:border-white/40 hover:text-white lg:h-9"
            >
              {language.short}
            </Link>
            <Link
              href="/admin"
              className="hidden rounded-full border border-white/15 px-4 py-2 text-[0.82rem] font-medium text-white/80 transition-colors hover:border-white/40 hover:text-white sm:inline-flex"
            >
              Poster
            </Link>
            <button
              type="button"
              className="grid size-11 place-items-center rounded-full border border-white/15 lg:hidden"
              aria-label={open ? "Stäng meny" : "Öppna meny"}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <Close /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobilmeny */}
      <div
        className={cn(
          "fixed inset-0 z-40 overflow-y-auto bg-ink text-white transition-[opacity,visibility] duration-500 lg:hidden",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <div className="grid-paper pointer-events-none absolute inset-0 text-white" aria-hidden />
        <nav aria-label="Mobilmeny" className="container-site relative pb-16 pt-[calc(var(--header-h)+2rem)]">
          {/* Grupperna visas som ett träd som går att fälla ut, i stället för en platt lista. */}
          <ul className="space-y-1">
            {NAV.map((item, i) => {
              const number = <span className="kicker text-white/30">{String(i + 1).padStart(2, "0")}</span>;
              const rowClass = "display-tight flex w-full items-baseline justify-between border-b border-white/[0.08] py-3.5 text-left text-[1.65rem]";
              const children = item.children;
              const groupOpen = children ? isExpanded(item) : false;
              return (
                <li
                  key={item.href + item.label}
                  className={cn("transition-all duration-700 ease-[var(--ease-out-expo)]", open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0")}
                  style={{ transitionDelay: open ? `${80 + i * 45}ms` : "0ms" }}
                >
                  {children ? (
                    <>
                      <button
                        type="button"
                        aria-expanded={groupOpen}
                        aria-controls={`mobilgrupp-${i}`}
                        onClick={() => setExpanded((e) => ({ ...e, [item.label]: !groupOpen }))}
                        className={cn(rowClass, groupActive(item) ? "text-red" : "text-white")}
                      >
                        <span className="flex items-center gap-3">
                          {item.label}
                          <ChevronDown size={20} className={cn("text-white/50 transition-transform duration-300", groupOpen && "rotate-180")} />
                        </span>
                        {number}
                      </button>
                      <div
                        id={`mobilgrupp-${i}`}
                        inert={!groupOpen}
                        className={cn(
                          "grid transition-[grid-template-rows] duration-500 ease-[var(--ease-out-expo)]",
                          groupOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                        )}
                      >
                        <ul className="overflow-hidden pb-2">
                          {children.map((c, j) => {
                            const last = j === children.length - 1;
                            const here = active(c.href);
                            return (
                              <li key={c.href + c.label} className="relative pl-9">
                                {/* Trädlinjer: lodrät stam (halv på sista grenen) + kort gren till varje sida. */}
                                <span aria-hidden className={cn("absolute left-3 top-0 w-px bg-white/20", last ? "h-1/2" : "h-full")} />
                                <span aria-hidden className={cn("absolute left-3 top-1/2 h-px w-4", here ? "bg-red" : "bg-white/20")} />
                                <Link
                                  href={c.href}
                                  aria-current={pathname === c.href ? "page" : undefined}
                                  className={cn("block py-2.5 transition-colors", here ? "text-red" : "text-white/80 hover:text-white")}
                                >
                                  <span className="block text-[1.05rem] font-semibold">{c.label}</span>
                                  {c.description && <span className="block truncate text-[0.78rem] text-white/40">{c.description}</span>}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </>
                  ) : (
                    <Link href={item.href} className={cn(rowClass, active(item.href) ? "text-red" : "text-white")}>
                      {item.label}
                      {number}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
          <Link href={language.href} hrefLang={language.lang} lang={language.lang} className="btn btn-ghost-dark mt-10 w-full">
            {language.label}
          </Link>
          <Link href="/admin" className="btn btn-ghost-dark mt-3 w-full">
            Logga in som post
          </Link>
        </nav>
      </div>
    </>
  );
}
