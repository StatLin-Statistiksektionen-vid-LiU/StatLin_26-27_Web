import { useSyncExternalStore } from "react";

/**
 * Fästa länkar på länksidan. Sparas bara i webbläsaren, så det behövs inget konto.
 * Id:n är "l12" för länken med id 12. Fästa kurser från när sidan hade en kurslista ("k732G33") ligger kvar men visas inte.
 */

const KEY = "statlin-fasta-lankar";
const EMPTY: string[] = [];
let cache: string[] | null = null;
const listeners = new Set<() => void>();

function read(): string[] {
  if (cache) return cache;
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    cache = Array.isArray(raw) ? raw.filter((v): v is string => typeof v === "string") : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

export const pinStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    // Fäster man i en annan flik uppdateras den här också.
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      cache = null;
      listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  },
  get: read,
  toggle(id: string) {
    const current = read();
    cache = current.includes(id) ? current.filter((v) => v !== id) : [...current, id];
    try {
      localStorage.setItem(KEY, JSON.stringify(cache));
    } catch {
      /* privat läge – fästningen gäller bara den här sidvisningen */
    }
    listeners.forEach((l) => l());
  },
};

export function usePins(): string[] {
  return useSyncExternalStore(pinStore.subscribe, pinStore.get, () => EMPTY);
}
