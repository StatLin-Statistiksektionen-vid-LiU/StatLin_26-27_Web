"use client";

import { useEffect, useRef } from "react";

const DAY_MS = 86_400_000;
/** Lokala tider räknas rakt av som UTC, så att sommartiden inte kan flytta klockslagen. */
const dayOf = (local: string) => Date.parse(`${local.slice(0, 10)}T00:00Z`) / DAY_MS;

/**
 * Flyttas evenemanget till en annan dag följer sluttiden med lika många dagar. Annars stod den kvar på det gamla datumet
 * och sparningen nekades med ett fel om något man inte hade rört. Ett ändrat klockslag rör inte sluttiden: den är inte
 * alltid i bild, och att ett evenemang börjar senare betyder inte att det slutar senare.
 */
export function EndFollowsStart() {
  const anchor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const form = anchor.current?.closest("form");
    const start = form?.querySelector<HTMLInputElement>('input[name="starts_at"]');
    const end = form?.querySelector<HTMLInputElement>('input[name="ends_at"]');
    if (!start || !end) return;
    let before = start.value;
    const remember = () => {
      if (start.value) before = start.value;
    };
    const follow = () => {
      // Ett halvifyllt datum är tomt tills det är klart. Då räknas flytten från det senaste hela datumet.
      if (!start.value) return;
      const moved = dayOf(start.value) - dayOf(before);
      before = start.value;
      const next = Date.parse(`${end.value}Z`) + moved * DAY_MS;
      if (moved !== 0 && Number.isFinite(next)) end.value = new Date(next).toISOString().slice(0, 16);
    };
    start.addEventListener("focus", remember);
    start.addEventListener("change", follow);
    return () => {
      start.removeEventListener("focus", remember);
      start.removeEventListener("change", follow);
    };
  }, []);
  return <span ref={anchor} hidden />;
}
