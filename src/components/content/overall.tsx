/**
 * Studentoverallen enligt styrdokumentet (kap. 6.1.1): svart med röda revärer längs
 * ärmar och benens utsida, namnet i röda bokstäver och sektionsloggan inverterad på ryggen.
 */
export function Overall({ side, name = "NAMN" }: { side: "fram" | "bak"; name?: string }) {
  const body =
    "M150 40 C170 30 230 30 250 40 L330 70 C345 76 352 88 356 102 L392 300 C394 310 388 318 378 320 L352 324 C344 325 337 320 335 312 L304 170 L298 230 L306 600 C306 610 299 618 289 618 L232 618 C223 618 216 611 215 602 L200 330 L185 602 C184 611 177 618 168 618 L111 618 C101 618 94 610 94 600 L102 230 L96 170 L65 312 C63 320 56 325 48 324 L22 320 C12 318 6 310 8 300 L44 102 C48 88 55 76 70 70 Z";
  return (
    <svg viewBox="0 0 400 640" className="h-auto w-full" role="img" aria-label={side === "fram" ? "Overallen framifrån" : "Overallen bakifrån med sektionsloggan"}>
      <defs>
        <clipPath id={`ov-${side}`}>
          <path d={body} />
        </clipPath>
      </defs>
      <path d={body} fill="#0e0e0e" />
      <g clipPath={`url(#ov-${side})`} stroke="#ff0707" strokeWidth="9" fill="none" strokeLinecap="round">
        {/* Revärer: hals → ärmar → ärmuppslag */}
        <path d="M150 40 L70 70 L44 102 L8 300" />
        <path d="M250 40 L330 70 L356 102 L392 300" />
        {/* Armhåla → benens utsida */}
        <path d="M96 170 L102 230 L94 600" />
        <path d="M304 170 L298 230 L306 600" />
      </g>
      {side === "fram" ? (
        <>
          <path d="M200 52 L200 330" stroke="#2a2a2a" strokeWidth="2" />
          {name.split("").map((ch, i) => (
            <text key={i} x="132" y={380 + i * 44} textAnchor="middle" fill="#ff0707" fontFamily="Archivo Variable, sans-serif" fontWeight="800" fontSize="38">
              {ch}
            </text>
          ))}
        </>
      ) : (
        <image href="/brand/statlin-inverterad.svg" x="135" y="120" width="130" height="130" />
      )}
    </svg>
  );
}
