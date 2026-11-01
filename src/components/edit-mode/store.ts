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

type State = { user: EditUser | null; editing: boolean; open: EditTarget | null; flash: string | null };

const KEY = "statlin-redigeringslage";
const SERVER: State = { user: null, editing: false, open: null, flash: null };
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
    set({ user, editing: user ? readPreference() : false, open: null });
  },
  setEditing(editing: boolean) {
    try {
      localStorage.setItem(KEY, editing ? "pa" : "av");
    } catch {
      /* privat läge – valet gäller bara den här sidvisningen */
    }
    set({ editing, open: editing ? state.open : null });
  },
  open(target: EditTarget) {
    set({ open: target });
  },
  close(flash?: string) {
    clearTimeout(flashTimer);
    set({ open: null, flash: flash ?? null });
    if (flash) flashTimer = setTimeout(() => set({ flash: null }), 3500);
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
