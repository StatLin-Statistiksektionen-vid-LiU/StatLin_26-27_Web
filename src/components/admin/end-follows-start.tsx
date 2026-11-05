"use client";

import { useEffect, useRef } from "react";

/** Minuter sedan epoken för en lokal tid. Klockslagen räknas rakt av, så att sommartiden inte kan flytta dem. */
const minutes = (local: string) => Date.parse(`${local}Z`) / 60_000;

/**
 * Flyttas starten följer sluttiden med, som i en kalender. Annars stod sluttiden kvar på det gamla datumet, ofta i ett
 * hopfällt avsnitt, och sparningen nekades med ett fel om något man inte hade rört.
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
      const moved = minutes(start.value) - minutes(before);
      before = start.value;
      const next = minutes(end.value) + moved;
      if (moved !== 0 && Number.isFinite(next)) end.value = new Date(next * 60_000).toISOString().slice(0, 16);
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
