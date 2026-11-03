import { useSyncExternalStore } from "react";
import { canEditCommittee, canEditImages, canEditOwned, canManageSettings, isEditor } from "@/lib/auth/permissions";
import type { SessionUser } from "@/lib/types";

/**
 * Redigeringsläget på sajten. Sidorna läser aldrig sessionen själva, så de kan fortsätta vara statiska.
 * I stället lägger adminlisten in den inloggade användaren här, och pennorna prenumererar på det.
 * Behörigheten speglar permissions.ts; servern kontrollerar alltid igen när något hämtas eller sparas.
 */

export type EditUser = Pick<SessionUser, "id" | "name" | "post" | "role" | "committee_id" | "committee_name" | "design">;

export type EditTarget =
  | { type: "page"; slug: string }
  | { type: "home" }
  | { type: "footer" }
  | { type: "committee"; id: number }
  | { type: "event"; id: number; committeeId: number | null }
  | { type: "news"; id: number; committeeId: number | null }
  | { type: "board"; id: number }
  /** Bara bilderna – även för grafiskt ansvarig, som inte får ändra texten. */
  | { type: "event-images"; id: number; committeeId: number | null }
  | { type: "news-cover"; id: number; committeeId: number | null }
  /** Hjälpmedlen sköts i adminpanelen. Målet styr bara vem som ser länken dit. */
  | { type: "resources" };

/**
 * dirty: formuläret i panelen har osparade ändringar – panelen frågar innan den stängs.
 * uploading: ett formulär i panelen laddar upp en bild – panelen stängs inte då.
 */
type State = { user: EditUser | null; editing: boolean; open: EditTarget | null; flash: string | null; dirty: boolean; uploading: boolean };

const KEY = "statlin-redigeringslage";
const SERVER: State = { user: null, editing: false, open: null, flash: null, dirty: false, uploading: false };
const UPLOADING = "En bild laddas fortfarande upp – vänta tills den är klar innan du stänger panelen.";
const UNSAVED = "Du har osparade ändringar – stäng ändå?";
let state: State = SERVER;
const listeners = new Set<() => void>();
let flashTimer: ReturnType<typeof setTimeout> | undefined;

function set(next: Partial<State>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function readPreference(): boolean {
  try {
    return localStorage.getItem(KEY) !== "av";
  } catch {
    return true;
  }
}

export const editStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => state,
  setUser(user: EditUser | null) {
    set({ user, editing: user ? readPreference() : false, open: null, dirty: false, uploading: false });
  },
  setEditing(editing: boolean) {
    try {
      localStorage.setItem(KEY, editing ? "pa" : "av");
    } catch {
      /* privat läge – valet gäller bara den här sidvisningen */
    }
    set(editing ? { editing } : { editing, open: null, dirty: false, uploading: false });
  },
  open(target: EditTarget) {
    set({ open: target, dirty: false, uploading: false });
  },
  close(flash?: string) {
    clearTimeout(flashTimer);
    set({ open: null, flash: flash ?? null, dirty: false, uploading: false });
    if (flash) flashTimer = setTimeout(() => set({ flash: null }), 3500);
  },
  /**
   * Stängning som användaren bett om – Escape, klick utanför, stängknappen, länken till adminpanelen eller ett
   * adressbyte. Under en uppladdning står panelen kvar, och med osparade ändringar frågar den först.
   * Returnerar false om panelen inte stängdes.
   */
  requestClose(): boolean {
    if (!state.open) return true;
    if (state.uploading) {
      window.alert(UPLOADING);
      return false;
    }
    if (state.dirty && !window.confirm(UNSAVED)) return false;
    editStore.close();
    return true;
  },
  setDirty(dirty: boolean) {
    if (state.dirty !== dirty) set({ dirty });
  },
  setUploading(uploading: boolean) {
    if (state.uploading !== uploading) set({ uploading });
  },
};

export function useEditState(): State {
  return useSyncExternalStore(editStore.subscribe, editStore.get, () => SERVER);
}

export function canEditTarget(user: EditUser, target: EditTarget): boolean {
  switch (target.type) {
    case "page":
    case "board":
      return isEditor(user);
    case "home":
    case "footer":
      return canManageSettings(user);
    case "committee":
      return canEditCommittee(user, target.id);
    case "event":
    case "news":
      return canEditOwned(user, { committee_id: target.committeeId });
    case "event-images":
    case "news-cover":
      return canEditImages(user, { committee_id: target.committeeId });
    case "resources":
      return true;
  }
}

/** Frågesträngen till /api/admin/redigera. */
export function targetQuery(target: EditTarget): string {
  const p = new URLSearchParams({ typ: target.type });
  if ("id" in target) p.set("id", String(target.id));
  if ("slug" in target) p.set("slug", target.slug);
  return p.toString();
}
