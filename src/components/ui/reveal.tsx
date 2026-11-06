"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const noSubscribe = () => () => {};
const whenRenderedInBrowser = () => false;
const whenHydrating = () => true;

type Watch = (entry: IntersectionObserverEntry, viewportHeight: number) => void;
const watchers = new Map<Element, Watch>();
let shared: IntersectionObserver | null = null;

/**
 * Alla block delar en observer, och den svarar efter nästa layout. Att mäta varje block när sidan startar tvingade fram en ny layout av hela
 * sidan per block, eftersom blocket före just hade ändrats.
 */
function observe(el: Element, watch: Watch) {
  shared ??= new IntersectionObserver(
    (entries) => {
      // Läses före ändringarna nedan, annars räknar webbläsaren om layouten för att svara.
      const viewportHeight = window.innerHeight;
      for (const entry of entries) watchers.get(entry.target)?.(entry, viewportHeight);
    },
    // Med tummen kommer blocken fort, så där börjar intoningen strax innan blocket syns i stället för när det redan är en bit inne.
    window.matchMedia("(pointer: coarse)").matches ? { rootMargin: "0px 0px 6% 0px", threshold: 0 } : { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
  );
  watchers.set(el, watch);
  shared.observe(el);
  return () => {
    watchers.delete(el);
    shared?.unobserve(el);
  };
}

/**
 * Tonar in innehåll när det scrollas in i bild. Innehållet är synligt i HTML:en och göms först här, när observern är på plats, så att det
 * syns utan JavaScript och medan det laddas (SB-03).
 */
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className,
}: {
  children: ReactNode;
  as?: ElementType;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  // Sant om elementet kom som HTML från servern, falskt om det renderas här, som vid sidbyte inom sajten. Det första värdet gäller.
  const [fromHtml] = useState(useSyncExternalStore(noSubscribe, whenRenderedInBrowser, whenHydrating));

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const hide = () => {
      el.dataset.hydrated = "true";
    };
    // Renderat här, eller gömt tidigare: göms innan det hinner synas. Effekten körs om när Next visar en dold sida igen.
    if (!fromHtml || el.dataset.hydrated) hide();
    const stop = observe(el, (entry, viewportHeight) => {
      if (!el.dataset.hydrated) {
        // HTML som redan har synts, eller som man redan har scrollat förbi, ska inte försvinna och tonas in igen.
        if (entry.boundingClientRect.top < viewportHeight) return stop();
        hide();
      }
      if (entry.isIntersecting) {
        setShown(true);
        stop();
      }
    });
    return stop;
  }, [fromHtml]);

  return (
    <Tag
      ref={ref}
      data-shown={shown}
      className={cn("reveal", className)}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
