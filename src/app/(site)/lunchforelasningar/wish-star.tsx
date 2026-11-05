"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { Star } from "@/components/icons";
import { voteForWish, voteForWishForm } from "./actions";

/** Stjärnorna den här webbläsaren redan gett. Inget lämnar webbläsaren, och servern vet inte vem som röstat på vad. */
const STORE_KEY = "statlin:stjarnor";
const NOTHING = "";
const listeners = new Set<() => void>();

function readRaw(): string {
  try {
    return localStorage.getItem(STORE_KEY) ?? NOTHING;
  } catch {
    return NOTHING;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function parse(raw: string): number[] {
  try {
    const list = JSON.parse(raw || "[]");
    return Array.isArray(list) ? list.filter(Number.isInteger) : [];
  } catch {
    return [];
  }
}

function remember(id: number) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify([...new Set([...parse(readRaw()), id])]));
  } catch {
    // Privat läge eller full lagring: rösten räknas ändå, men knappen kommer inte ihåg den till nästa besök.
  }
  listeners.forEach((l) => l());
}

/**
 * "Ge en stjärna". Utan JavaScript är det ett vanligt formulär. Med JavaScript tänds stjärnan direkt och antalet ökar; säger servern
 * nej (spärren) släcks den igen och besökaren får veta varför.
 */
export function WishStar({ id, title, votes, litByServer = false }: { id: number; title: string; votes: number; litByServer?: boolean }) {
  const raw = useSyncExternalStore(subscribe, readRaw, () => NOTHING);
  const [count, setCount] = useState(votes);
  const [litNow, setLitNow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lit = litByServer || litNow || parse(raw).includes(id);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (lit) return;
    setError(null);
    setLitNow(true);
    setCount((c) => c + 1);
    const result = await voteForWish(id).catch(() => ({ ok: false as const, error: "Det gick inte att nå servern. Försök igen." }));
    if (result.ok) {
      remember(id);
      setCount(result.votes);
    } else {
      setLitNow(false);
      setCount((c) => c - 1);
      setError(result.error);
    }
  };

  return (
    <form action={voteForWishForm} onSubmit={onSubmit} className="flex flex-col items-center">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={lit}
        aria-pressed={lit}
        aria-label={lit ? `Du har gett en stjärna till ${title}` : `Ge en stjärna till ${title}`}
        data-lit-now={litNow || undefined}
        className="wish-star relative grid size-14 cursor-pointer place-items-center rounded-full border border-ink/20 bg-white disabled:cursor-default disabled:border-red/50"
      >
        <Star size={24} className={lit ? "wish-star-icon fill-red text-red" : "wish-star-icon fill-transparent text-ink"} />
      </button>
      <span className="wish-count mono-accent mt-1.5 text-sm font-semibold tabular" aria-live="polite">
        {count}
        <span className="sr-only"> {count === 1 ? "stjärna" : "stjärnor"}</span>
      </span>
      {error && (
        <span role="alert" className="wish-count mt-1 w-28 text-center text-xs font-semibold text-red-dark">
          {error}
        </span>
      )}
    </form>
  );
}
