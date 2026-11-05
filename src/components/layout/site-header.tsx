"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { languageSwitch, NAV, type NavGroup } from "@/lib/navigation";
import { FOCUS_SEARCH_EVENT, fetchSearchEntries } from "@/lib/search-prefetch";
import { closeWhenWider, useFocusLayer } from "@/lib/use-focus-layer";
import { ArrowUpRight, ChevronDown, Close, Menu, Search } from "@/components/icons";
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
  const headerRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const isHome = pathname === "/";
  const onSearch = pathname === "/sok";
  const language = languageSwitch(pathname);
  const router = useRouter();

  // Snabbtangenter till sökfliken: / när man inte skriver någonstans, och Ctrl eller Cmd + K.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest?.("input, textarea, select, [contenteditable]");
      const combo = e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey) && !e.altKey;
      const slash = e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && !typing;
      if (!combo && !slash) return;
      // På sökfliken sköter sökrutan snedstrecket själv.
      if (onSearch) {
        if (combo) {
          e.preventDefault();
          window.dispatchEvent(new Event(FOCUS_SEARCH_EVENT));
        }
        return;
      }
      e.preventDefault();
      router.push("/sok");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSearch, router]);

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

  // Sidhuvudet ligger ovanpå menyn och har stängknappen, så det hör till lagret. Resten av sidan blir inert.
  useFocusLayer({
    active: open,
    layers: () => [headerRef.current, menuRef.current],
    initial: () => toggleRef.current,
    returnTo: () => toggleRef.current,
  });
  useEffect(() => {
    if (open) return closeWhenWider("(min-width: 1024px)", () => setOpen(false));
  }, [open]);

  // Med fingret finns ingen pekare som lämnar gruppen, så ett tryck utanför stänger den.
  useEffect(() => {
    if (!dropdown) return;
    const onPress = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && !(e.target as Element).closest(".meny-grupp")) setDropdown(null);
    };
    document.addEventListener("pointerdown", onPress);
    return () => document.removeEventListener("pointerdown", onPress);
  }, [dropdown]);

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
        ref={headerRef}
        className={cn(
          "fixed inset-x-0 top-0 z-50 text-white transition-[background-color,border-color,backdrop-filter] duration-500",
          scrolled || open
            ? "border-b border-white/[0.08] bg-ink/90 backdrop-blur-xl backdrop-saturate-150 pointer-coarse:bg-ink pointer-coarse:backdrop-filter-none"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="container-site flex h-[var(--header-h)] items-center justify-between gap-6">
          <Link
            href="/"
            className="sidhuvud-marke group flex items-center gap-3"
            aria-label="StatLin, startsida"
            data-storlogga={pathname === null ? "okant" : isHome && !scrolled && !open ? "ja" : "nej"}
          >
            <span className="sidhuvud-logga relative block size-9">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/statlin.svg"
                alt=""
                width={36}
                height={36}
                className="logo-kant size-9 transition-transform duration-700 [--kant:1px] group-hover:rotate-[-12deg]"
              />
            </span>
            <span className="sidhuvud-namn display-tight text-[1.05rem] tracking-tight" translate="no">
              Stat<span className="text-red">Lin</span>
            </span>
          </Link>

          <nav aria-label="Huvudmeny" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV.map((item) =>
                item.children ? (
                  <li
                    key={item.href}
                    className="meny-grupp relative"
                    // Bara en riktig mus öppnar med hovring. Ett tryck på en surfplatta skickar också hovring, och då skulle klicket direkt efteråt stänga gruppen.
                    onPointerEnter={(e) => {
                      if (e.pointerType !== "mouse") return;
                      clearTimeout(closeTimer.current);
                      setDropdown(item.label);
                    }}
                    onPointerLeave={(e) => {
                      if (e.pointerType !== "mouse") return;
                      closeTimer.current = setTimeout(() => setDropdown(null), 160);
                    }}
                    // Tabbar man vidare ska gruppen inte ligga kvar över sidan.
                    onBlur={(e) => {
                      if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) setDropdown(null);
                    }}
                  >
                    <button
                      type="button"
                      aria-expanded={dropdown === item.label}
                      onClick={(e) => {
                        // Musen har redan öppnat gruppen genom att hovra, så klicket ska inte stänga den igen.
                        const mouse = (e.nativeEvent as PointerEvent).pointerType === "mouse";
                        setDropdown((d) => (d === item.label && !mouse ? null : item.label));
                      }}
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
                        "meny-lista absolute left-1/2 top-full -translate-x-1/2 pt-3 transition-all duration-300 ease-[var(--ease-out-expo)]",
                        item.children.length > 3 ? "w-[34rem]" : "w-[22rem]",
                        dropdown === item.label ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0",
                      )}
                    >
                      <ul
                        className={cn(
                          "grid gap-1 rounded-3xl border border-white/10 bg-ink-2/95 p-2 shadow-2xl shadow-black/50 backdrop-blur-xl pointer-coarse:backdrop-filter-none",
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
              href="/sok"
              aria-label="Sök"
              title="Sök (snabbtangent /)"
              aria-current={onSearch ? "page" : undefined}
              // Indexet börjar hämtas redan när man pekar eller trycker, så att träffarna finns när sökfliken öppnas.
              onPointerEnter={() => void fetchSearchEntries()}
              onPointerDown={() => void fetchSearchEntries()}
              onFocus={() => void fetchSearchEntries()}
              onClick={(e) => {
                if (!onSearch) return;
                e.preventDefault();
                setOpen(false);
                window.dispatchEvent(new Event(FOCUS_SEARCH_EVENT));
              }}
              className={cn(
                "inline-flex size-11 items-center justify-center rounded-full border text-white/80 transition-colors hover:border-white/40 hover:text-white lg:size-9",
                onSearch ? "border-white/40 text-white" : "border-white/15",
              )}
            >
              <Search size={18} />
            </Link>
            {(pathname === null ? [language, languageSwitch("/en")] : [language]).map((l) => (
              <Link
                key={l.lang}
                href={l.href}
                hrefLang={l.lang}
                lang={l.lang}
                aria-label={`${l.short}, ${l.label}`}
                title={l.label}
                className={cn(pathname === null && `sprak-${l.lang}`, "inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-white/15 px-3 text-[0.82rem] font-semibold text-white/80 transition-colors hover:border-white/40 hover:text-white lg:h-9")}
              >
                {l.short}
              </Link>
            ))}
            <Link
              href="/admin"
              className="hidden rounded-full border border-white/15 px-4 py-2 text-[0.82rem] font-medium text-white/80 transition-colors hover:border-white/40 hover:text-white sm:inline-flex"
            >
              Poster
            </Link>
            {/* Utan JavaScript går menyn inte att öppna. Sidfoten har samma länkar. */}
            <a href="#sidfot" aria-label="Alla sidor, i sidfoten" className="meny-utan-js size-11 place-items-center rounded-full border border-white/15 lg:hidden">
              <Menu />
            </a>
            <button
              ref={toggleRef}
              type="button"
              className="meny-knapp grid size-11 place-items-center rounded-full border border-white/15 lg:hidden"
              aria-label={open ? "Stäng meny" : "Öppna meny"}
              aria-expanded={open}
              aria-controls="mobilmeny"
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <Close /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobilmeny */}
      <div
        ref={menuRef}
        id="mobilmeny"
        className={cn(
          "fixed inset-0 z-40 overflow-y-auto overscroll-contain bg-ink text-white transition-[opacity,visibility] duration-500 lg:hidden",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        {/* Rutnätet ska följa med hela vägen ner när grupperna är utfällda, så det får mäta innehållet och inte skärmen. */}
        <div className="relative min-h-full">
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
                  className={cn("transition-[opacity,translate] duration-700 ease-[var(--ease-out-expo)]", open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0")}
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
                        {/* Luften ligger inuti den klippta ytan. Låg den på ytan själv blev en hopfälld grupp 8 px hög och trädets stam stack fram. */}
                        <div className="overflow-hidden">
                        <ul className="pb-2">
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
                                  {c.description && <span className="block text-[0.78rem] text-white/40">{c.description}</span>}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                        </div>
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
      </div>
    </>
  );
}
