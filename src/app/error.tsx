"use client"; // Felgränser måste vara klientkomponenter.

import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft } from "@/components/icons";

/**
 * Sista skyddsnätet när något kastar under renderingen. Formulären fångar sina egna fel (ActionForm), så hit
 * kommer bara oväntade fel. retry() hämtar och renderar sidan på nytt.
 */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  // Fel från servern har en kod som går att hitta i loggen; meddelandet visas aldrig i produktion.
  const digest = error instanceof Error && "digest" in error && typeof error.digest === "string" ? error.digest : null;
  return (
    <main className="noise relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-ink px-6 text-center text-white">
      <div className="grid-paper pointer-events-none absolute inset-0 text-white [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" aria-hidden />
      <div className="relative w-full max-w-xl">
        <p className="kicker text-red">Något gick fel</p>
        <h1 className="display mt-5 text-[clamp(1.9rem,6vw,3.5rem)]">Sidan kunde inte visas</h1>
        <p className="mx-auto mt-6 max-w-md text-lg text-white/65">Ett oväntat fel inträffade. Försök igen – hjälper det inte, ladda om sidan eller gå till startsidan.</p>
        {digest && <p className="mt-4 font-mono text-xs text-white/40">Felkod {digest}</p>}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => retry()} className="btn btn-red">
            Försök igen
          </button>
          <Link href="/" className="btn btn-light">
            <ArrowLeft size={18} /> Till startsidan
          </Link>
        </div>
      </div>
    </main>
  );
}
