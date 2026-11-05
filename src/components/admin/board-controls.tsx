"use client";

import { unstable_rethrow } from "next/navigation";
import { useState, useTransition } from "react";
import { moveBoardMember } from "@/app/admin/_actions/content";
import { ChevronDown } from "@/components/icons";

export function MoveButtons({ id, first, last }: { id: number; first: boolean; last: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const move = (direction: -1 | 1) =>
    start(async () => {
      setError(null);
      try {
        const res = await moveBoardMember(id, direction);
        if (res) setError(res.error);
      } catch (err) {
        unstable_rethrow(err);
        setError("Det gick inte att flytta posten – försök igen.");
      }
    });
  return (
    <span className="inline-flex items-center gap-2">
      {error && (
        <span role="alert" className="max-w-56 text-xs font-medium text-red-deep">
          {error}
        </span>
      )}
      <span className="inline-flex flex-col">
      <button type="button" disabled={first || pending} onClick={() => move(-1)} className="grid size-6 place-items-center rounded hover:bg-paper disabled:opacity-25" aria-label="Flytta upp">
        <ChevronDown size={14} className="rotate-180" />
      </button>
      <button type="button" disabled={last || pending} onClick={() => move(1)} className="grid size-6 place-items-center rounded hover:bg-paper disabled:opacity-25" aria-label="Flytta ned">
        <ChevronDown size={14} />
      </button>
      </span>
    </span>
  );
}
