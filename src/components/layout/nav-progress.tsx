"use client";

import { useEffect, useRef } from "react";

/** Så länge får ett sidbyte ta innan raden syns. En förhämtad sida visas långt tidigare, och då syns ingen rad alls. */
const SHOW_AFTER_MS = 250;
/** Fly svarar senast efter ungefär 40 sekunder, och om svaret är ett fel laddar Next om sidan på egen hand. Raden ska inte stå kvar längre än så. */
const GIVE_UP_MS = 45000;
const START_EVENT = "statlin:sidbyte";

/** För sidbyten som inte börjar med ett klick på en länk, till exempel när tentasöket skickas med Enter. */
export function startNavProgress(href: string) {
  window.dispatchEvent(new CustomEvent(START_EVENT, { detail: href }));
}

/**
 * En tunn röd rad överst medan ett sidbyte väntar på servern, så att ett tryck aldrig ser ut att inte ha gjort något.
 * Raden startar bara när Next har tagit hand om klicket (preventDefault) och länken leder till en annan sida på webbplatsen.
 * Den försvinner när adressen byts, vilket Next gör först när den nya sidan visas, eller när man går bakåt.
 * En länk vars sidbyte kan avbrytas, som länken i redigeringsrutan som först frågar om osparade ändringar, har data-utan-laddningsrad.
 */
export function NavProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = ref.current;
    if (!bar) return;
    let from = "";
    let showTimer = 0;
    let pollTimer = 0;
    let giveUpTimer = 0;
    let hideTimer = 0;

    const stop = () => {
      from = "";
      window.clearTimeout(showTimer);
      window.clearInterval(pollTimer);
      window.clearTimeout(giveUpTimer);
    };
    const reset = () => {
      stop();
      window.clearTimeout(hideTimer);
      delete bar.dataset.state;
    };
    const finish = () => {
      if (!from) return;
      stop();
      if (bar.dataset.state !== "loading") return;
      bar.dataset.state = "done";
      hideTimer = window.setTimeout(() => delete bar.dataset.state, 450);
    };
    const begin = (href: string) => {
      const url = new URL(href, location.href);
      // Samma sida (ett ankare eller andra sökparametrar), en annan webbplats eller en fil: då finns inget sidbyte att vänta på.
      if (url.origin !== location.origin || url.pathname === location.pathname || /\.[a-z0-9]{2,5}$/i.test(url.pathname)) return;
      reset();
      from = location.href;
      showTimer = window.setTimeout(() => {
        bar.dataset.state = "loading";
      }, SHOW_AFTER_MS);
      pollTimer = window.setInterval(() => {
        if (location.href !== from) finish();
      }, 100);
      giveUpTimer = window.setTimeout(finish, GIVE_UP_MS);
    };

    const onClick = (e: MouseEvent) => {
      if (!e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!(a instanceof HTMLAnchorElement) || a.closest("[data-utan-laddningsrad]")) return;
      if ((a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      begin(a.href);
    };
    const onStart = (e: Event) => {
      if (e instanceof CustomEvent && typeof e.detail === "string") begin(e.detail);
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) reset();
    };

    // På window körs lyssnaren efter Reacts egna, så defaultPrevented visar om Next sköter sidbytet.
    window.addEventListener("click", onClick);
    window.addEventListener(START_EVENT, onStart);
    window.addEventListener("popstate", finish);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      reset();
      window.removeEventListener("click", onClick);
      window.removeEventListener(START_EVENT, onStart);
      window.removeEventListener("popstate", finish);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return <div ref={ref} aria-hidden className="nav-progress" />;
}
