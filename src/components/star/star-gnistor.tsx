import type { CSSProperties } from "react";

/** Var gnistorna sitter, i procent av ordets ruta. De första ligger på grafens punkter, de sista visas bara på större skärmar. */
const GNISTOR = [
  { x: 90, y: -6, storlek: 30, start: 1.3, varv: 7 },
  { x: 21, y: 62, storlek: 18, start: 3.1, varv: 8.5 },
  { x: 56, y: 24, storlek: 22, start: 5.2, varv: 9 },
  { x: 8, y: -14, storlek: 14, start: 6.8, varv: 10 },
  { x: 71, y: -18, storlek: 16, start: 8.4, varv: 8 },
  { x: 38, y: -8, storlek: 12, start: 2.2, varv: 11 },
  { x: 97, y: 58, storlek: 14, start: 4.3, varv: 9.5 },
  { x: 46, y: 88, storlek: 12, start: 7.4, varv: 12 },
  { x: 78, y: 96, storlek: 16, start: 9.6, varv: 10.5 },
];

/**
 * Några få stjärnor som glimmar till runt ordet STAR. Var och en är ett litet eget lager som bara flyttas och tonas, och de lyser
 * ungefär en femtedel av tiden, så att himlen lever utan att det blir stökigt. Utan rörelse syns de inte alls.
 */
export function StarGnistor() {
  return (
    <div className="star-gnistor" aria-hidden>
      {GNISTOR.map((g) => (
        <span
          key={`${g.x}-${g.y}`}
          className="star-gnista"
          style={{ left: `${g.x}%`, top: `${g.y}%`, "--s": `${g.storlek}px`, animationDelay: `${g.start}s`, animationDuration: `${g.varv}s` } as CSSProperties}
        />
      ))}
    </div>
  );
}
