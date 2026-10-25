"use client";

import { useEffect, useRef } from "react";

/**
 * Bakgrund för heron: en tidsserie som ritas fram och scrollar med ett
 * konfidensband, samt ett glest spridningsdiagram som reagerar på pekaren.
 */
export function DataField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;
    let pointer = { x: -9999, y: -9999 };

    // Slumpvandring med positiv drift – "StatLin-grafiken" pekar alltid uppåt höger.
    const STEP = 14;
    let series: number[] = [];
    let drift = 0;
    let offset = 0;

    type Dot = { x: number; y: number; vx: number; vy: number; r: number; a: number; red: boolean };
    let dots: Dot[] = [];

    const nextValue = (prev: number) => {
      drift += (Math.random() - 0.5) * 0.9;
      drift *= 0.92;
      return prev + drift + (Math.random() - 0.48) * 3.2;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const n = Math.ceil(w / STEP) + 3;
      series = [0];
      for (let i = 1; i < n; i++) series.push(nextValue(series[i - 1]));

      const count = Math.round(Math.min(90, (w * h) / 16000));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: 0.8 + Math.random() * 1.8,
        a: 0.12 + Math.random() * 0.35,
        red: Math.random() < 0.08,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Spridningsdiagram + svaga kopplingar mellan närliggande punkter
      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        const dx = d.x - pointer.x;
        const dy = d.y - pointer.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < 140 * 140) {
          const f = (1 - Math.sqrt(dist2) / 140) * 0.6;
          d.x += (dx / Math.sqrt(dist2 + 0.01)) * f;
          d.y += (dy / Math.sqrt(dist2 + 0.01)) * f;
        }
        if (d.x < -20) d.x = w + 20;
        if (d.x > w + 20) d.x = -20;
        if (d.y < -20) d.y = h + 20;
        if (d.y > h + 20) d.y = -20;
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const a = dots[i];
          const b = dots[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 110 * 110) {
            ctx.strokeStyle = `rgba(255,255,255,${(0.07 * (1 - Math.sqrt(d2) / 110)).toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      for (const d of dots) {
        ctx.fillStyle = d.red ? `rgba(255,7,7,${Math.min(1, d.a * 2)})` : `rgba(255,255,255,${d.a})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tidsserie: normalisera så att den stiger diagonalt genom bilden
      const min = Math.min(...series);
      const max = Math.max(...series);
      const span = Math.max(40, max - min);
      const baseY = (i: number) => h * 0.86 - (i / series.length) * h * 0.38;
      const y = (i: number) => baseY(i) - ((series[i] - min) / span - 0.5) * h * 0.22;
      const x = (i: number) => i * STEP - offset;

      // Konfidensband
      const band = ctx.createLinearGradient(0, h * 0.4, 0, h);
      band.addColorStop(0, "rgba(255,7,7,0.10)");
      band.addColorStop(1, "rgba(255,7,7,0)");
      ctx.fillStyle = band;
      ctx.beginPath();
      for (let i = 0; i < series.length; i++) ctx.lineTo(x(i), y(i) - 26 - Math.sin(i / 7) * 6);
      for (let i = series.length - 1; i >= 0; i--) ctx.lineTo(x(i), y(i) + 34 + Math.cos(i / 9) * 6);
      ctx.closePath();
      ctx.fill();

      // Linjen
      ctx.save();
      ctx.shadowColor = "rgba(255,7,7,0.8)";
      ctx.shadowBlur = 18;
      ctx.strokeStyle = "rgba(255,7,7,0.85)";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (let i = 0; i < series.length; i++) {
        if (i === 0) ctx.moveTo(x(i), y(i));
        else ctx.lineTo(x(i), y(i));
      }
      ctx.stroke();
      ctx.restore();

      // Senaste mätpunkt
      const li = series.length - 3;
      const lx = x(li);
      const ly = y(li);
      if (lx < w) {
        ctx.fillStyle = "#ff0707";
        ctx.beginPath();
        ctx.arc(lx, ly, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduced) {
        offset += 0.35;
        if (offset >= STEP) {
          offset -= STEP;
          series.shift();
          series.push(nextValue(series[series.length - 1]));
        }
      }
    };

    const loop = () => {
      draw();
      if (running && !reduced) raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true;
        raf = requestAnimationFrame(loop);
      } else if (!entry.isIntersecting) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });

    resize();
    loop();
    io.observe(canvas);
    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) draw();
    });
    ro.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={className} />;
}
