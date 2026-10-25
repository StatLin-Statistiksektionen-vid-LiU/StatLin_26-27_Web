"use client";

import { useEffect, useId, useRef } from "react";
import { LOGO_GEOMETRY as G, LOGO_GRID, LOGO_SIGNATURE, LOGO_TEXT, LOGO_VIEWBOX } from "@/lib/brand/logo-paths";
import { cn } from "@/lib/utils";

/**
 * Sektionsloggan som svävar i 3D och följer pekaren.
 * Loggan visas i sin inverterade form (styrdokumentet kap. 3.1: alternativ form på svart bakgrund).
 * Introt bygger upp loggan lager för lager; slutläget är alltid den exakta loggan.
 */
export function FloatingLogo({ className, intro = true }: { className?: string; intro?: boolean }) {
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const tiltRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = tiltRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let raf = 0;
    let running = true;
    let idle = 0;

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
      idle = 0;
    };
    const onLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    const loop = (t: number) => {
      // Utan pekare (mobil) gungar loggan själv i en långsam Lissajous-bana.
      idle++;
      const auto = idle > 120;
      const ax = auto ? Math.sin(t / 2600) * 0.35 : targetX;
      const ay = auto ? Math.cos(t / 3400) * 0.25 : targetY;
      x += (ax - x) * 0.055;
      y += (ay - y) * 0.055;
      el.style.setProperty("--rx", `${(-y * 10).toFixed(3)}deg`);
      el.style.setProperty("--ry", `${(x * 14).toFixed(3)}deg`);
      el.style.setProperty("--sx", `${(50 - x * 28).toFixed(2)}%`);
      el.style.setProperty("--sy", `${(38 - y * 24).toFixed(2)}%`);
      if (running) raf = requestAnimationFrame(loop);
    };

    const io = new IntersectionObserver(([entry]) => {
      const visible = entry.isIntersecting;
      if (visible && !running) {
        running = true;
        raf = requestAnimationFrame(loop);
      } else if (!visible) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(el);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div className={cn("floating-logo relative aspect-square select-none", intro && "is-intro", className)}>
      {/* Röd glöd bakom loggan */}
      <div
        aria-hidden
        className="logo-glow pointer-events-none absolute inset-[6%] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgb(255 7 7 / 0.38), rgb(255 7 7 / 0.12) 55%, transparent 75%)",
        }}
      />
      <div className="relative h-full w-full animate-float [perspective:1400px]">
        <div
          ref={tiltRef}
          className="logo-tilt relative h-full w-full"
          style={{
            transform: "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))",
            transformStyle: "preserve-3d",
            willChange: "transform",
          }}
        >
          <svg
            viewBox={LOGO_VIEWBOX}
            className="h-full w-full overflow-visible drop-shadow-[0_40px_60px_rgba(0,0,0,0.6)]"
            role="img"
            aria-label="StatLins sektionslogga – Statistiksektionen, Linköpings universitet"
          >
            <defs>
              <clipPath id={`${id}-disc`}>
                <circle cx={G.cx} cy={G.cy} r={G.ringR} />
              </clipPath>
              <radialGradient id={`${id}-depth`} cx="50%" cy="35%" r="70%">
                <stop offset="0%" stopColor="#1d1d1d" />
                <stop offset="100%" stopColor="#000" />
              </radialGradient>
              {/* Mjuk diagonal "wipe" som avslöjar signaturen nerifrån vänster – som en stigande graf. */}
              <linearGradient id={`${id}-wipe`} x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stopColor="#fff" />
                <stop offset="0.46" stopColor="#fff" />
                <stop offset="0.54" stopColor="#000" />
                <stop offset="1" stopColor="#000" />
              </linearGradient>
              <mask id={`${id}-sig`} maskUnits="userSpaceOnUse" x="-200" y="-200" width="1442" height="1442">
                <rect className="sig-wipe" x="-2000" y="-2000" width="4000" height="4000" fill={`url(#${id}-wipe)`} />
              </mask>
              <mask id={`${id}-grid`} maskUnits="userSpaceOnUse" x="0" y="0" width="1042" height="1042">
                <rect className="grid-wipe" x="0" y="0" width="1042" height="1042" fill="#fff" />
              </mask>
            </defs>

            <g className="logo-ring-group">
              <circle cx={G.cx} cy={G.cy} r={G.discR} fill={`url(#${id}-depth)`} />
              <g clipPath={`url(#${id}-disc)`} mask={`url(#${id}-grid)`}>
                <path d={LOGO_GRID} fill="#fff" fillRule="evenodd" />
              </g>
              <circle cx={G.cx} cy={G.cy} r={G.ringR} fill="none" stroke="#fff" strokeWidth={G.ringW} />
              <path className="logo-text" d={LOGO_TEXT} fill="#000" fillRule="evenodd" />
            </g>
            <g mask={`url(#${id}-sig)`}>
              <path
                className="logo-signature"
                d={LOGO_SIGNATURE}
                fill="#ff0707"
                fillRule="evenodd"
                stroke="#fff"
                strokeWidth={7}
                strokeLinejoin="round"
                paintOrder="stroke"
              />
            </g>
          </svg>

          {/* Spekulär highlight som följer lutningen */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-[9.5%] rounded-full mix-blend-soft-light"
            style={{
              background:
                "radial-gradient(circle at var(--sx, 50%) var(--sy, 38%), rgb(255 255 255 / 0.55), transparent 55%)",
            }}
          />
        </div>
      </div>

      {/* Reflex under loggan */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[9%] left-1/2 h-[7%] w-[62%] -translate-x-1/2 animate-float-shadow rounded-[50%]"
        style={{ background: "radial-gradient(closest-side, rgb(255 7 7 / 0.45), transparent)", filter: "blur(14px)" }}
      />
    </div>
  );
}
