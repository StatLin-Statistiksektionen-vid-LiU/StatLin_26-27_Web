import Link from "next/link";
import { Suspense } from "react";
import { DataField } from "@/components/brand/data-field";
import { FloatingLogo } from "@/components/brand/floating-logo";
import { FormulaRing } from "@/components/brand/formula-ring";
import { ArrowRight } from "@/components/icons";
import { AccentText, stripAccent } from "@/components/ui/accent-text";
import { DEFAULT_SETTINGS, getSettings } from "@/lib/data/content";
import { cn } from "@/lib/utils";
import { Editable } from "@/components/edit-mode/editable";

/** Texterna och ringens glöd kommer från Inställningar → Startsidan. Loggan och knapparna hör till det statiska skalet. */
async function HeroRing() {
  const s = await getSettings();
  return <FormulaRing glow={s.hero_ring_color} />;
}

async function HeroKicker() {
  const s = await getSettings();
  return <>{s.hero_kicker}</>;
}

/** Längre rubriker får mindre text och bredare kolumn, så att de inte trycker in i loggan. */
function titleSize(title: string) {
  const n = stripAccent(title).length;
  if (n <= 48) return { text: "text-[clamp(1.4rem,2.5vw,2.15rem)]", col: "md:col-span-7" };
  if (n <= 80) return { text: "text-[clamp(1.15rem,1.9vw,1.7rem)]", col: "md:col-span-7 lg:col-span-8" };
  return { text: "text-[clamp(1.05rem,1.6vw,1.45rem)]", col: "md:col-span-7 lg:col-span-8" };
}

// Meningen bryts olika med reservtypsnittet och Archivo. Tre rader håller platsen på telefon, så att loggan står still när typsnittet laddas.
const SENTENCE = "mt-3 max-w-md text-[0.875rem] leading-relaxed pointer-coarse:min-h-[3lh]";

function HeroBottom({ title, text }: { title: string | null; text: string | null }) {
  const size = titleSize(title ?? DEFAULT_SETTINGS.hero_title);
  return (
    <div className="hero-bunn grid items-end gap-6 pb-8 md:grid-cols-12 md:pb-10">
      <Editable
        target={{ type: "home" }}
        label="Redigera texten"
        className={cn(size.col, "[animation:fade-up_1.2s_1.6s_var(--ease-out-expo)_both] pointer-coarse:[animation-delay:.3s] pointer-coarse:[animation-duration:.8s]")}
      >
        {title === null ? (
          // På telefon håller en osynlig kopia av standardtexten platsen, så att höjden stämmer vid varje skärmbredd.
          <div className="min-h-[7rem] pointer-coarse:min-h-0" aria-hidden>
            <div className="invisible hidden pointer-coarse:block">
              <p className={cn("display-tight leading-[1.02]", size.text)}>
                <AccentText text={DEFAULT_SETTINGS.hero_title} />
              </p>
              <p className={SENTENCE}>{DEFAULT_SETTINGS.hero_text}</p>
            </div>
          </div>
        ) : (
          <>
            <h1 className={cn("display-tight leading-[1.02]", size.text)}>
              <AccentText text={title} />
            </h1>
            {text && <p className={cn(SENTENCE, "text-white/60")}>{text}</p>}
          </>
        )}
      </Editable>
      {/* Knapparna finns både i skalet och i det som kommer senare. På telefon, där det dröjer längre, syns de direkt så att intoningen inte börjar om. */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-3 md:col-span-5 md:justify-end [animation:fade-up_1.2s_1.85s_var(--ease-out-expo)_both] pointer-coarse:animate-none",
          size.col.includes("lg:col-span-8") && "lg:col-span-4",
        )}
      >
        <Link href="/evenemang" className="btn btn-red group">
          Kommande evenemang
          <ArrowRight size={18} className="transition-transform duration-500 group-hover:translate-x-1" />
        </Link>
        <Link href="/studenter/ny-student" className="btn btn-ghost-dark">
          Ny student?
        </Link>
        <a
          href="#utforska"
          aria-label="Scrolla vidare"
          className="ml-2 hidden h-12 items-center text-white/50 transition-colors hover:text-white lg:flex"
        >
          <span className="relative block h-12 w-px overflow-hidden bg-white/15">
            <span className="absolute inset-x-0 top-0 h-1/2 bg-red [animation:scroll-cue_2s_ease-in-out_infinite]" />
          </span>
        </a>
      </div>
    </div>
  );
}

async function HeroText() {
  const s = await getSettings();
  return <HeroBottom title={s.hero_title.trim() || DEFAULT_SETTINGS.hero_title} text={s.hero_text.trim()} />;
}

export function Hero() {
  return (
    <section className="noise relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-ink text-white">
      {/* Bakgrund: rutnät + levande data */}
      <div
        aria-hidden
        className="grid-paper pointer-events-none absolute inset-0 -z-10 text-white [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_80%)]"
      />
      <DataField className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-90" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-ink to-transparent"
      />

      {/* Jättetypografi bakom loggan */}
      <div
        aria-hidden
        className="display pointer-events-none absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 select-none whitespace-nowrap text-center text-[26vw] leading-none text-transparent opacity-0 [-webkit-text-stroke:1.5px_rgb(255_255_255/0.09)] [animation:fade-up_1.6s_0.2s_var(--ease-out-expo)_both] md:text-[22vw]"
      >
        StatLin
      </div>

      <div className="container-site relative flex flex-1 flex-col pt-[calc(var(--header-h)+1.5rem)]">
        <div className="flex items-start justify-between gap-6">
          <p className="kicker flex items-center gap-3 text-white/60 [animation:fade-up_1s_0.1s_var(--ease-out-expo)_both]">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-red" />
            </span>
            <Suspense fallback={<span className="invisible">{DEFAULT_SETTINGS.hero_kicker}</span>}>
              <HeroKicker />
            </Suspense>
          </p>
          <p className="kicker hidden text-right text-white/35 md:block">
            58.3978° N
            <br />
            15.5760° E
          </p>
        </div>

        {/* Loggan */}
        <div className="flex flex-1 items-center justify-center py-6 md:py-3">
          <FloatingLogo
            className="w-[min(82vw,56svh,640px)]"
            ring={
              <Suspense fallback={null}>
                <HeroRing />
              </Suspense>
            }
          />
        </div>

        <Suspense fallback={<HeroBottom title={null} text={null} />}>
          <HeroText />
        </Suspense>
      </div>
    </section>
  );
}
