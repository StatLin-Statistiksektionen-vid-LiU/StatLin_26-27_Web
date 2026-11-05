"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useFocusLayer } from "@/lib/use-focus-layer";
import { cn } from "@/lib/utils";
import { bubbleStore, useBubble, type GuideStep } from "./bubble-store";
import { editStore, useEditState, type EditUser } from "./store";

const LAST: GuideStep = 2;
const GAP = 14;
const SPOTLIGHT_PADDING = 7;

const motion = () => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");

/** Sidans första penna som faktiskt syns. Next behåller förra sidan dold i dokumentet, och de pennorna räknas inte. */
function firstPen(): HTMLElement | null {
  return [...document.querySelectorAll<HTMLElement>("[data-edit-pen]")].find((pen) => pen.getClientRects().length > 0) ?? null;
}

function findTarget(step: GuideStep): HTMLElement | null {
  if (step === 0) return document.querySelector<HTMLElement>('#admin-bar [role="switch"]');
  if (step === 1) return firstPen() ?? document.querySelector<HTMLElement>('#admin-bar a[href="/admin"]');
  return null;
}

type Box = { top: number; left: number; width: number; height: number };

const sameBox = (a: Box | null, b: Box | null) => a?.top === b?.top && a?.left === b?.left && a?.width === b?.width && a?.height === b?.height;

function cardPlace(box: Box | null): CSSProperties {
  // Utan mål: mitt på, ovanför bubblan i nederkanten.
  if (!box) return { left: "50%", bottom: "5.5rem", translate: "-50% 0" };
  const width = Math.min(340, window.innerWidth - 32);
  const left = Math.min(Math.max(16, box.left + box.width / 2 - width / 2), window.innerWidth - width - 16);
  const over = box.top + box.height / 2 > window.innerHeight / 2;
  return over ? { left, bottom: window.innerHeight - box.top + GAP } : { left, top: box.top + box.height + GAP };
}

/** Guiden lyser upp det den pratar om och låter det gå att klicka på, medan resten av sidan står stilla. */
export function EditGuide({ user, helpRef }: { user: EditUser; helpRef: React.RefObject<HTMLButtonElement | null> }) {
  const { guide: step } = useBubble();
  const { open, editing } = useEditState();
  const visible = step !== null && !open;
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  // Klickar man på pennan i steg 2 öppnas panelen. Guiden väntar, och fortsätter med steg 3 när panelen stängs.
  useEffect(() => {
    if (open && step === 1) bubbleStore.openGuide(2);
  }, [open, step]);

  // Följer målet medan sidan scrollar, och hittar det också om det kommer in sent.
  useEffect(() => {
    if (!visible) return;
    let frame = 0;
    let found: HTMLElement | null = null;
    const tick = () => {
      const now = findTarget(step);
      if (now !== found) {
        found = now;
        setTarget(now);
        if (now?.hasAttribute("data-edit-pen")) now.scrollIntoView({ block: "center", behavior: motion() });
      }
      const r = now?.getBoundingClientRect();
      const next = r ? { top: r.top, left: r.left, width: r.width, height: r.height } : null;
      setBox((before) => (sameBox(before, next) ? before : next));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visible, step]);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      bubbleStore.closeGuide();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [visible]);

  useFocusLayer({
    active: visible,
    // I sista steget finns inget att lysa upp, och bubblan ska synas: där hamnar ett sparat-meddelande.
    layers: () => [cardRef.current, step === LAST ? document.getElementById("admin-bar") : target],
    initial: () => nextRef.current,
    returnTo: () => helpRef.current,
    layerKey: step === LAST ? "sista" : target,
  });

  if (!visible) return null;

  const noPen = step === 1 && !!target && !target.hasAttribute("data-edit-pen");
  const spotlight = step !== LAST && box;

  function next() {
    if (step === 0) editStore.setEditing(true);
    if (step === LAST) bubbleStore.closeGuide();
    else bubbleStore.openGuide(((step ?? 0) + 1) as GuideStep);
  }

  return (
    <div className="print:hidden">
      <div
        aria-hidden
        className={cn("pointer-events-none fixed z-[80] rounded-full transition-[top,left,width,height] duration-300 ease-out", !spotlight && "inset-0 bg-black/45")}
        style={
          spotlight
            ? {
                top: box.top - SPOTLIGHT_PADDING,
                left: box.left - SPOTLIGHT_PADDING,
                width: box.width + SPOTLIGHT_PADDING * 2,
                height: box.height + SPOTLIGHT_PADDING * 2,
                boxShadow: "0 0 0 3px var(--color-red), 0 0 0 200vmax rgb(0 0 0 / 0.55)",
              }
            : undefined
        }
      />
      <div
        ref={cardRef}
        role="dialog"
        aria-labelledby="redigeringsguide-rubrik"
        aria-describedby="redigeringsguide-text"
        className="fixed z-[85] w-[min(21.25rem,calc(100vw-2rem))] rounded-2xl bg-ink p-5 text-white shadow-[0_30px_70px_-20px_rgb(0_0_0/0.8)] ring-1 ring-white/20"
        style={cardPlace(step === LAST ? null : box)}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="redigeringsguide-rubrik" className="kicker text-xs">
            Steg {(step ?? 0) + 1} av {LAST + 1}
          </h2>
          <span aria-hidden className="flex gap-1.5 text-sm leading-none">
            {[0, 1, 2].map((i) => (
              <span key={i} className={i === step ? "text-red" : i < (step ?? 0) ? "text-white" : "text-white/30"}>
                ✦
              </span>
            ))}
          </span>
        </div>
        <div id="redigeringsguide-text" aria-live="polite" className="mt-3 space-y-2 leading-snug">
          {step === 0 && (
            <>
              <p className="font-semibold">Slå på reglaget. Det du får ändra får en röd ram.</p>
              <p className="text-sm text-white/70">{editing ? "Reglaget är på nu." : "Reglaget är av nu."}</p>
            </>
          )}
          {step === 1 && !noPen && <p className="font-semibold">Klicka på den röda pennan. Panelen öppnas vid sidan.</p>}
          {noPen && (
            <>
              <p className="font-semibold">Den här sidan har ingen penna för ditt konto.</p>
              <p className="text-sm text-white/70">Gå till en sida som du ansvarar för, så finns pennan där. Allt annat når du i adminpanelen bakom kugghjulet.</p>
            </>
          )}
          {step === LAST && (
            <>
              <p className="font-semibold">Ändra och tryck Spara. Ändringen syns direkt.</p>
              <p className="text-sm text-white/70">Nya evenemang och inlägg i Nytt skapas i adminpanelen. Guiden finns kvar bakom frågetecknet.</p>
              <p className="text-sm text-white/70">Inloggad som {user.post || user.name}.</p>
            </>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          {step !== LAST ? (
            <button type="button" onClick={() => bubbleStore.closeGuide()} className="rounded-full px-1 py-2 text-sm font-semibold text-white/80 underline-offset-4 hover:underline">
              Hoppa över
            </button>
          ) : (
            <span />
          )}
          <button ref={nextRef} type="button" onClick={next} className="btn btn-red btn-sm">
            {step === LAST ? "Klar" : "Nästa"}
          </button>
        </div>
      </div>
    </div>
  );
}
