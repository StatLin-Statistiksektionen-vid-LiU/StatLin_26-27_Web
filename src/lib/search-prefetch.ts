"use client";

import type { SearchEntry } from "@/lib/search";

/**
 * Det lilla som sidhuvudet behöver för sökknappen: hämta indexet i förväg och be sökfliken lägga markören i rutan. Själva sökmotorn
 * (src/lib/search.ts) laddas bara på sökfliken, så den gör inga andra sidor tyngre.
 */

/** Sökknappen skickar den här händelsen när man redan står på sökfliken: markören ska till rutan. */
export const FOCUS_SEARCH_EVENT = "statlin:sok";

let entriesPromise: Promise<SearchEntry[] | null> | null = null;

/** Indexet hämtas en gång per besök. Ett fel nollställer, så nästa försök hämtar igen. */
export function fetchSearchEntries(): Promise<SearchEntry[] | null> {
  entriesPromise ??= fetch("/api/sok")
    .then((r) => (r.ok ? (r.json() as Promise<SearchEntry[]>) : null))
    .catch(() => null)
    .then((entries) => {
      if (!Array.isArray(entries)) {
        entriesPromise = null;
        return null;
      }
      return entries;
    });
  return entriesPromise;
}
