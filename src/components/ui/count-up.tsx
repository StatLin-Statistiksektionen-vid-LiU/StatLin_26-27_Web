"use client";

import { useEffect, useRef, useState } from "react";

/** Modulen lever tills sidan laddas om. Har talen räknats en gång visas de direkt, också när Next har kastat den dolda sidan och byggt upp den på nytt. */
let countedOnce = false;

/** Räknar upp till ett värde när det syns, en gång. Next kör effekten igen när en dold sida visas, och då ska talen inte börja om från noll. */
export function CountUp({ value, duration = 1600 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  // Null betyder att värdet står kvar som det är, och så ser också servern det.
  const [counting, setCounting] = useState<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || countedOnce || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t: number) => {
        const k = Math.min(1, (t - start) / duration);
        if (k < 1) {
          setCounting(Math.round(value * (1 - Math.pow(1 - k, 4))));
          raf = requestAnimationFrame(tick);
        } else {
          countedOnce = true;
          setCounting(null);
        }
      };
      setCounting(0);
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      // Sidan göms mitt i uppräkningen: när den visas igen ska det slutliga värdet stå där.
      setCounting(null);
    };
  }, [value, duration]);

  return (
    <span ref={ref} className="tabular">
      {counting ?? value}
    </span>
  );
}
