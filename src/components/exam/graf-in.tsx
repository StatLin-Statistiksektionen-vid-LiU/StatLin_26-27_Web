"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Så långt ner i fönstret räknas ett diagram som redan synligt när sidan öppnas. Längre ner hinner rörelsen annars spelas utan att någon ser den. */
const SYNS_REDAN = 0.8;

/**
 * Väntar med diagrammets rörelse tills det kommer in i bild. Det som redan syns när sidan öppnas spelas direkt av CSS, och det som ligger
 * längre ner göms först här, när JavaScript är på plats, så att inget diagram kan bli stående osynligt. Se exam.css.
 */
export function GrafIn({ children, className, lista }: { children: ReactNode; className?: string; lista?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * SYNS_REDAN) return;
    el.dataset.grafVantar = "";
    const syns = new IntersectionObserver(
      ([post]) => {
        if (!post.isIntersecting) return;
        delete el.dataset.grafVantar;
        syns.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    syns.observe(el);
    return () => {
      syns.disconnect();
      delete el.dataset.grafVantar;
    };
  }, []);

  return (
    <div ref={ref} className={className} data-graf-lista={lista || undefined}>
      {children}
    </div>
  );
}
