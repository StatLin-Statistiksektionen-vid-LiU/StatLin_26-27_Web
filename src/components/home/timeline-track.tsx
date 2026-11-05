"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "@/components/icons";

const INTRO_SEEN = "statlin-tidsaxel-intro";

/** Spåret på tidslinjen. Utan JavaScript går det att svepa och tabba i det ändå: den här lägger bara till pilar, tonade kanter och introt. */
export function TimelineTrack({ children }: { children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ overflow: false, atStart: true, atEnd: false });

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const max = track.scrollWidth - track.clientWidth;
      const next = { overflow: max > 4, atStart: track.scrollLeft <= 4, atEnd: track.scrollLeft >= max - 4 };
      setEdges((now) => (now.overflow === next.overflow && now.atStart === next.atStart && now.atEnd === next.atEnd ? now : next));
    };
    measure();
    track.addEventListener("scroll", measure, { passive: true });
    const resize = new ResizeObserver(measure);
    resize.observe(track);
    return () => {
      track.removeEventListener("scroll", measure);
      resize.disconnect();
    };
  }, []);

  // Bandet ligger under heron, så introt väntar tills det syns. En gång per besök: Next visar sidan igen vid bakåtnavigering, och då ska linjen inte ritas om.
  useEffect(() => {
    const track = trackRef.current;
    const section = track?.parentElement;
    if (!track || !section || !window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
    try {
      if (sessionStorage.getItem(INTRO_SEEN)) return;
      const seen = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          section.dataset.intro = "";
          sessionStorage.setItem(INTRO_SEEN, "1");
          seen.disconnect();
        },
        { threshold: 0.01 },
      );
      seen.observe(section);
      return () => seen.disconnect();
    } catch {
      // Utan sessionStorage blir det inget intro, och linjen står där från början.
    }
  }, []);

  const motion = () => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");

  function step(direction: 1 | -1) {
    trackRef.current?.scrollBy({ left: direction * Math.round(trackRef.current.clientWidth * 0.7), behavior: motion() });
  }

  return (
    <>
      <div
        ref={trackRef}
        className="tidsaxel-spara"
        data-start={edges.atStart}
        data-end={edges.atEnd}
        // Webbläsaren låter en länk som syns till hälften stå kvar. Med Tab ska hela länken fram.
        onFocus={(e) => {
          if (e.target.matches(":focus-visible")) e.target.scrollIntoView({ inline: "nearest", block: "nearest", behavior: motion() });
        }}
      >
        {children}
      </div>
      {edges.overflow && (
        <div className="tidsaxel-pilar">
          <button type="button" aria-label="Tidigare evenemang" disabled={edges.atStart} onClick={() => step(-1)}>
            <ChevronLeft size={18} />
          </button>
          <button type="button" aria-label="Senare evenemang" disabled={edges.atEnd} onClick={() => step(1)}>
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </>
  );
}
