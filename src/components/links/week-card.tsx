"use client";

import { useSyncExternalStore } from "react";
import { capitalize, isoWeek, parts, todayLocal } from "@/lib/dates";

const subscribe = () => () => {};

/** Veckonumret – det man oftast letar efter i schemat. Räknas om i webbläsaren, så att det aldrig blir inaktuellt. */
export function WeekCard({ today }: { today: string }) {
  const day = useSyncExternalStore(subscribe, todayLocal, () => today);
  const p = parts(day);
  return (
    <div className="flex items-center justify-between gap-6 rounded-[1.5rem] border border-white/15 bg-white/[0.04] p-6 backdrop-blur md:block md:w-full md:max-w-xs md:rotate-2 md:p-7">
      <div>
        <p className="kicker text-white/45">Vecka</p>
        <p className="mt-2 text-white/60 md:hidden">
          {capitalize(p.weekday)} {p.day} {p.monthLong}
        </p>
      </div>
      <p className="display text-[3.5rem] leading-none md:mt-4 md:text-[5.5rem]">
        <span className="mono-accent normal-case text-red">v.</span>
        {isoWeek(day)}
      </p>
      <p className="mt-4 hidden font-mono text-xs uppercase tracking-[0.12em] text-white/50 md:block">
        {p.weekday} {p.day} {p.monthLong}
      </p>
    </div>
  );
}
