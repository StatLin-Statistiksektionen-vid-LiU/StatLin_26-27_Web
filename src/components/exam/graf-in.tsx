"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Så långt ner i fönstret räknas ett diagram som redan synligt när sidan öppnas. Längre ner hinner rörelsen annars spelas utan att någon ser den. */
const SYNS_REDAN = 0.8;

type Watch = (entry: IntersectionObserverEntry, viewportHeight: number) => void;
const watchers = new Map<Element, Watch>();
let shared: IntersectionObserver | null = null;

/**
 * Alla diagram delar en observer, och dess första svar säger var diagrammet ligger. Att mäta varje diagram med getBoundingClientRect när
 * sidan startar tvingade fram en ny layout per diagram, eftersom diagrammet före just hade gömts. Samma lösning som i ui/reveal.tsx.
 */
function observe(el: Element, watch: Watch) {
  shared ??= new IntersectionObserver(
    (entries) => {
      // Läses före ändringarna nedan, annars räknar webbläsaren om layouten för att svara.
      const viewportHeight = window.innerHeight;
      for (const entry of entries) watchers.get(entry.target)?.(entry, viewportHeight);
    },
    { rootMargin: "0px 0px -10% 0px" },
  );
  watchers.set(el, watch);
  shared.observe(el);
  return () => {
    watchers.delete(el);
    shared?.unobserve(el);
  };
}

/**
 * Väntar med diagrammets rörelse tills det kommer in i bild. Det som redan syns när sidan öppnas spelas direkt av CSS, och det som ligger
 * längre ner göms först här, när JavaScript är på plats, så att inget diagram kan bli stående osynligt. Se exam.css.
 */
export function GrafIn({ children, className, lista }: { children: ReactNode; className?: string; lista?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let first = true;
    const stop = observe(el, (entry, viewportHeight) => {
      if (first) {
        first = false;
        // Syns redan, eller är redan på väg in: CSS spelar rörelsen.
        if (entry.boundingClientRect.top < viewportHeight * SYNS_REDAN || entry.isIntersecting) return stop();
        el.dataset.grafVantar = "";
        return;
      }
      if (entry.isIntersecting) {
        delete el.dataset.grafVantar;
        stop();
      }
    });
    return () => {
      stop();
      delete el.dataset.grafVantar;
    };
  }, []);

  return (
    <div ref={ref} className={className} data-graf-lista={lista || undefined}>
      {children}
    </div>
  );
}
