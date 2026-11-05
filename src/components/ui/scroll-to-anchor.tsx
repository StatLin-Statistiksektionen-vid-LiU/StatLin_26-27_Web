"use client";

import { useEffect, useRef } from "react";

/**
 * När hela sidan strömmas in letar webbläsaren och Next efter #ankaret innan det finns, och besökaren blir kvar högst upp. Den här ligger
 * i samma del av sidan som ankaret och scrollar dit när delen är på plats. Står sidan redan någon annanstans, efter bakåt eller en
 * omladdning, ska besökaren vara kvar där. "manual" betyder att scroll-restore.ts håller på att lägga tillbaka platsen.
 */
export function ScrollToAnchor({ id }: { id: string }) {
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    if (window.location.hash === `#${id}` && window.scrollY < 40 && history.scrollRestoration !== "manual") document.getElementById(id)?.scrollIntoView();
  }, [id]);

  return null;
}
