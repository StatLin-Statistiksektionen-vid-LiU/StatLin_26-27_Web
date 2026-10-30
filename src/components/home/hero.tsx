import Link from "next/link";
import { DataField } from "@/components/brand/data-field";
import { FloatingLogo } from "@/components/brand/floating-logo";
import { ArrowRight } from "@/components/icons";

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
            Statistiksektionen i Linköping
          </p>
          <p className="kicker hidden text-right text-white/35 md:block">
            58.3978° N
            <br />
            15.5760° E
          </p>
        </div>

        {/* Loggan */}
        <div className="flex flex-1 items-center justify-center py-6 md:py-3">
          <FloatingLogo className="w-[min(82vw,56svh,640px)]" />
        </div>

        <div className="grid items-end gap-6 pb-8 md:grid-cols-12 md:pb-10">
          <div className="md:col-span-7 [animation:fade-up_1.2s_1.6s_var(--ease-out-expo)_both]">
            <h1 className="display-tight text-[clamp(1.7rem,3.1vw,2.7rem)] leading-[1.02]">
              Sektionen för <span className="mono-accent text-red">statistik</span>
              <br /> och dataanalys vid LiU
            </h1>
            <p className="mt-4 max-w-lg text-[1rem] leading-relaxed text-white/60">
              Sittningar, pubar, idrott, studiebevakning och kontakt med arbetslivet – drivet av studenter, för
              studenter.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 md:col-span-5 md:justify-end [animation:fade-up_1.2s_1.85s_var(--ease-out-expo)_both]">
            <Link href="/evenemang" className="btn btn-red group">
              Kommande evenemang
              <ArrowRight size={18} className="transition-transform duration-500 group-hover:translate-x-1" />
            </Link>
            <Link href="/ny-student" className="btn btn-ghost-dark">
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
      </div>
    </section>
  );
}
