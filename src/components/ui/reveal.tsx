"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const noSubscribe = () => () => {};
const whenRenderedInBrowser = () => false;
const whenHydrating = () => true;

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
    // HTML som redan har synts ska inte försvinna och tonas in igen. Elementet kan ha gömts tidigare: effekten körs om när Next visar en dold sida igen.
    if (fromHtml && !el.dataset.hydrated && el.getBoundingClientRect().top < window.innerHeight) return;
    el.dataset.hydrated = "true";
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      // Med tummen kommer blocken fort, så där börjar intoningen strax innan blocket syns i stället för när det redan är en bit inne.
      window.matchMedia("(pointer: coarse)").matches ? { rootMargin: "0px 0px 6% 0px", threshold: 0 } : { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
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
