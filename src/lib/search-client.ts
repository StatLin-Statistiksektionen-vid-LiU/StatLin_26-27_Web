"use client";

import { prepareIndex, type PreparedIndex } from "@/lib/search";
import { fetchSearchEntries } from "@/lib/search-prefetch";

/** Indexet förbereds en gång per besök, och kurskoderna hämtas först när någon skriver en siffra. Ett fel nollställer. */
let indexPromise: Promise<PreparedIndex | null> | null = null;
let codesPromise: Promise<string[]> | null = null;

export function loadSearchIndex(): Promise<PreparedIndex | null> {
  indexPromise ??= fetchSearchEntries()
    .then((entries) => (entries ? prepareIndex(entries) : null))
    .catch(() => null)
    .then((index) => {
      if (!index) indexPromise = null;
      return index;
    });
  return indexPromise;
}

export function loadCourseCodes(): Promise<string[]> {
  codesPromise ??= fetch("/api/tentastatistik/koder")
    .then((r) => (r.ok ? (r.json() as Promise<string[]>) : []))
    .catch(() => [])
    .then((list) => {
      if (!Array.isArray(list) || list.length === 0) {
        codesPromise = null;
        return [];
      }
      return list;
    });
  return codesPromise;
}
