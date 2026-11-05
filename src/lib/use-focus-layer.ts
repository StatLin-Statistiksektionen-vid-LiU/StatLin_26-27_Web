"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/** Hur många öppna lager som vill ha ett element inert. Två lager kan överlappa, och det sista som stängs ska släppa det. */
const inertBy = new Map<Element, number>();

function makeInert(el: Element) {
  const count = inertBy.get(el);
  if (count !== undefined) {
    inertBy.set(el, count + 1);
    return true;
  }
  // Redan inert av något annat skäl, som en hopfälld grupp. Det ska inte vi ändra på.
  if (el.hasAttribute("inert")) return false;
  el.setAttribute("inert", "");
  inertBy.set(el, 1);
  return true;
}

function releaseInert(el: Element) {
  const count = inertBy.get(el);
  if (count === undefined) return;
  if (count > 1) {
    inertBy.set(el, count - 1);
    return;
  }
  inertBy.delete(el);
  el.removeAttribute("inert");
}

/** Allt utanför lagren: syskonen på varje nivå från lagren upp till body. */
function outside(layers: HTMLElement[]): Element[] {
  const keep = new Set<Element>();
  for (const layer of layers) for (let el: Element | null = layer; el && el !== document.body; el = el.parentElement) keep.add(el);
  const found: Element[] = [];
  for (const parent of [document.body, ...[...keep].filter((el) => !layers.includes(el as HTMLElement))]) {
    for (const child of parent.children) {
      if (keep.has(child) || child.tagName === "SCRIPT" || child.tagName === "STYLE") continue;
      found.push(child);
    }
  }
  return found;
}

function focusables(layers: HTMLElement[]): HTMLElement[] {
  return layers
    .flatMap((layer) => (layer.matches(FOCUSABLE) ? [layer] : []).concat([...layer.querySelectorAll<HTMLElement>(FOCUSABLE)]))
    .filter((el) => el.tabIndex >= 0 && !el.closest("[inert]") && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden");
}

/**
 * Ett lager ovanpå sidan (meny, panel, bildvisare, guide): allt utanför blir `inert`, Tab går runt inne i lagret och fokus
 * går tillbaka när lagret stängs. `layers` returnerar elementen som hör till lagret, så att till exempel menyknappen i
 * sidhuvudet kan vara med fast den ligger utanför själva menyn. Ändras listan körs effekten om via `layerKey`.
 */
export function useFocusLayer({
  active,
  layers,
  initial,
  returnTo,
  layerKey,
}: {
  active: boolean;
  layers: () => (HTMLElement | null | undefined)[];
  /** Det som får fokus när lagret öppnas. Utan den stannar fokus kvar, som i en meny där knappen redan har det. */
  initial?: () => HTMLElement | null | undefined;
  /** Dit fokus går vid stängning. Utan den går det tillbaka till elementet som hade fokus när lagret öppnades. */
  returnTo?: () => HTMLElement | null | undefined;
  layerKey?: unknown;
}) {
  const latest = useRef({ layers, initial, returnTo });
  useEffect(() => {
    latest.current = { layers, initial, returnTo };
  });
  // Läses bara när lagret öppnas, så att den överlever att lagret byter innehåll (nästa steg i guiden).
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    // Före inert: ett element som blir inert tappar fokus.
    opener.current ??= document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const current = () => latest.current.layers().filter((el): el is HTMLElement => !!el);
    const touched = outside(current()).filter(makeInert);
    latest.current.initial?.()?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      // En öppen <dialog> ovanpå lagret, som en bekräftelse, har redan gjort allt annat inert och sköter Tab själv.
      if (e.key !== "Tab" || document.querySelector("dialog[open]")) return;
      const items = focusables(current());
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const at = items.indexOf(document.activeElement as HTMLElement);
      if (at === -1) {
        e.preventDefault();
        (e.shiftKey ? items[items.length - 1] : items[0]).focus();
      } else if (e.shiftKey && at === 0) {
        e.preventDefault();
        items[items.length - 1].focus();
      } else if (!e.shiftKey && at === items.length - 1) {
        e.preventDefault();
        items[0].focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      touched.forEach(releaseInert);
    };
  }, [active, layerKey]);

  // Efter effekten ovan, så att inert hunnit släppas när fokus lämnas tillbaka.
  useEffect(() => {
    if (!active) return;
    return () => {
      const target = latest.current.returnTo?.() ?? opener.current;
      opener.current = null;
      if (target?.isConnected) target.focus({ preventScroll: true });
    };
  }, [active]);
}

/** Stänger ett lager som bara finns på små skärmar när fönstret blir så brett att det inte längre visas. */
export function closeWhenWider(query: string, close: () => void): () => void {
  const media = window.matchMedia(query);
  const onChange = () => media.matches && close();
  onChange();
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
