import { hashString, mulberry32, cn } from "@/lib/utils";

/**
 * Generativt omslag för evenemang och nyheter som saknar bild.
 * Deterministiskt utifrån en nyckel (slug) – samma evenemang får alltid samma grafik.
 */
export function CoverArt({
  seed,
  accent = "#ff0707",
  logo,
  className,
  label,
}: {
  seed: string;
  accent?: string;
  logo?: string | null;
  className?: string;
  label?: string;
}) {
  const rnd = mulberry32(hashString(seed));
  const variant = Math.floor(rnd() * 3);
  const slope = 0.25 + rnd() * 0.45;
  const points = Array.from({ length: 46 }, () => {
    const x = rnd() * 400;
    const noise = (rnd() + rnd() + rnd() - 1.5) * 70;
    return { x, y: 250 - (x * slope + 40 + noise), r: 1.5 + rnd() * 3.5, red: rnd() > 0.85 };
  });
  let line = "";
  let v = 0;
  for (let x = -10; x <= 410; x += 10) {
    v += (rnd() - 0.45) * 14;
    v *= 0.9;
    line += `${x === -10 ? "M" : "L"}${x},${(250 - (x * slope + 50) + v).toFixed(1)} `;
  }
  const bars = Array.from({ length: 12 }, (_, i) => {
    const mu = 5.5;
    const h = Math.exp(-((i - mu) ** 2) / 8) * (120 + rnd() * 40) + rnd() * 18;
    return { x: 40 + i * 27, h };
  });

  return (
    <div className={cn("relative overflow-hidden bg-ink", className)} aria-hidden={!label} role={label ? "img" : undefined} aria-label={label}>
      <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id={`g-${seed}`} cx="80%" cy="10%" r="90%">
            <stop offset="0" stopColor={accent} stopOpacity="0.45" />
            <stop offset="0.6" stopColor={accent} stopOpacity="0.05" />
            <stop offset="1" stopColor="#0a0a0a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="250" fill="#0d0d0d" />
        <rect width="400" height="250" fill={`url(#g-${seed})`} />
        {Array.from({ length: 11 }, (_, i) => (
          <line key={`v${i}`} x1={i * 40} y1="0" x2={i * 40} y2="250" stroke="#fff" strokeOpacity="0.06" />
        ))}
        {Array.from({ length: 7 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 40} x2="400" y2={i * 40} stroke="#fff" strokeOpacity="0.06" />
        ))}
        {variant === 0 &&
          points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={p.red ? "#ff0707" : "#fff"} fillOpacity={p.red ? 0.9 : 0.35} />
          ))}
        {variant === 1 &&
          bars.map((b, i) => (
            <rect key={i} x={b.x} y={235 - b.h} width="20" height={b.h} fill={i === 5 || i === 6 ? "#ff0707" : "#fff"} fillOpacity={i === 5 || i === 6 ? 0.85 : 0.18} />
          ))}
        {variant !== 1 && <path d={line} fill="none" stroke="#ff0707" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
        {variant === 2 && (
          <path d={`${line} L410,260 L-10,260 Z`} fill="#ff0707" fillOpacity="0.12" />
        )}
      </svg>
      {logo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt=""
          className="absolute -bottom-[18%] -right-[8%] w-[58%] max-w-none rotate-[-8deg] opacity-[0.9] drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
          loading="lazy"
        />
      )}
    </div>
  );
}
