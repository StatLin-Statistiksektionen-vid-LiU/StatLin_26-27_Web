"use client";

import { useTransition } from "react";
import { moveBoardMember } from "@/app/admin/_actions/content";
import { ChevronDown } from "@/components/icons";

export function MoveButtons({ id, first, last }: { id: number; first: boolean; last: boolean }) {
  const [pending, start] = useTransition();
  return (
    <span className="inline-flex flex-col">
      <button type="button" disabled={first || pending} onClick={() => start(() => moveBoardMember(id, -1))} className="grid size-6 place-items-center rounded hover:bg-paper disabled:opacity-25" aria-label="Flytta upp">
        <ChevronDown size={14} className="rotate-180" />
      </button>
      <button type="button" disabled={last || pending} onClick={() => start(() => moveBoardMember(id, 1))} className="grid size-6 place-items-center rounded hover:bg-paper disabled:opacity-25" aria-label="Flytta ned">
        <ChevronDown size={14} />
      </button>
    </span>
  );
}
