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
    let last = 0;
    let pointer = { x: -9999, y: -9999 };

    // Tidsserie runt en stigande diagonal – "StatLin-grafiken" pekar alltid uppåt höger.
    // Avvikelsen från diagonalen dras tillbaka mot noll av sig själv, så linjen behöver
    // aldrig skalas om och kan glida mjukt. Avstånd anges i px vid 800 px höjd.
    const STEP = 14;
    const SPEED = 21; // px per sekund
    const LIMIT = 140; // mjukt tak för avvikelsen
    type Point = { dev: number; vol: number };
    const series: Point[] = [];
    let offset = 0;
    let level = 0;
    let velocity = 0;
    let logVol = 0;
    let shock = 0;
    let volSmooth = 1;

    type Dot = { x: number; y: number; vx: number; vy: number; r: number; a: number; red: boolean };
    let dots: Dot[] = [];

    const gauss = () => {
      let u = 0;
      let v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };

    // Volatiliteten vandrar långsamt (lugna och oroliga perioder), ibland kommer en chock
    // som klingar av, och nivån dras med tröghet tillbaka mot diagonalen.
    const nextPoint = (): Point => {
      logVol += -0.03 * logVol + 0.1 * gauss();
      const vol = Math.exp(logVol);
      if (Math.random() < 0.012) shock += (Math.random() < 0.5 ? -1 : 1) * (24 + Math.random() * 36);
      shock *= 0.93;
      velocity += -0.1 * velocity - 0.015 * level + 2.6 * vol * gauss();
      level += velocity;
      volSmooth += (vol - volSmooth) * 0.15;
      return { dev: LIMIT * Math.tanh((level + shock + 3.6 * vol * gauss()) / LIMIT), vol: volSmooth };
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Första gången: kör serien en stund så att den börjar mitt i ett förlopp.
      // Vid ändrad bredd behålls punkterna, så linjen hoppar inte.
      if (series.length === 0) for (let i = 0; i < 300; i++) nextPoint();
      const n = Math.ceil(w / STEP) + 3;
      while (series.length < n) series.push(nextPoint());
      series.length = n;

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

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, w, h);
      // Punkternas hastigheter är angivna per bildruta vid 60 Hz.
      const frames = dt * 60;

      // Spridningsdiagram + svaga kopplingar mellan närliggande punkter
      for (const d of dots) {
        d.x += d.vx * frames;
        d.y += d.vy * frames;
        const dx = d.x - pointer.x;
        const dy = d.y - pointer.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < 140 * 140) {
          const f = (1 - Math.sqrt(dist2) / 140) * 0.6 * frames;
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

      // Tidsserie: diagonalen följer x-led på skärmen, inte punktens index, så inget
      // flyttar sig i höjdled när en ny punkt kommer in.
      const unit = h / 800;
      const xs = series.map((_, i) => i * STEP - offset);
      const ys = series.map((p, i) => h * 0.8 - (xs[i] / w) * h * 0.26 - p.dev * unit);

      // Konfidensband – bredare när serien är orolig
      const band = ctx.createLinearGradient(0, h * 0.4, 0, h);
      band.addColorStop(0, "rgba(255,7,7,0.10)");
      band.addColorStop(1, "rgba(255,7,7,0)");
      ctx.fillStyle = band;
      ctx.beginPath();
      for (let i = 0; i < series.length; i++) ctx.lineTo(xs[i], ys[i] - (20 + 10 * series[i].vol) * unit);
      for (let i = series.length - 1; i >= 0; i--) ctx.lineTo(xs[i], ys[i] + (26 + 12 * series[i].vol) * unit);
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
        if (i === 0) ctx.moveTo(xs[i], ys[i]);
        else ctx.lineTo(xs[i], ys[i]);
      }
      ctx.stroke();
      ctx.restore();

      // Senaste mätpunkt: glider längs linjen nära högerkanten
      const mx = w - 2 * STEP;
      const pos = (mx + offset) / STEP;
      const li = Math.floor(pos);
      if (li >= 0 && li + 1 < series.length) {
        ctx.fillStyle = "#ff0707";
        ctx.beginPath();
        ctx.arc(mx, ys[li] + (ys[li + 1] - ys[li]) * (pos - li), 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduced) {
        offset += SPEED * dt;
        while (offset >= STEP) {
          offset -= STEP;
          series.shift();
          series.push(nextPoint());
        }
      }
    };

    // Rörelsen följer klockan, inte antalet bildrutor: samma fart på 60 och 144 Hz.
    const loop = (now: number) => {
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60;
      last = now;
      draw(dt);
      if (running && !reduced) raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true;
        last = 0;
        raf = requestAnimationFrame(loop);
      } else if (!entry.isIntersecting) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });

    resize();
    loop(performance.now());
    io.observe(canvas);
    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) draw(0);
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
