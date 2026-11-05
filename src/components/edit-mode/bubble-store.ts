import { useSyncExternalStore } from "react";

/** Var bubblan ligger, om den är hopfälld och vilket steg i guiden som visas. Plats och hopfällning sparas i webbläsaren. */

export type Corner = "bottom-right" | "bottom-left" | "top-right" | "top-left";
export const CORNERS: Record<Corner, string> = {
  "bottom-right": "nere till höger",
  "bottom-left": "nere till vänster",
  "top-right": "uppe till höger",
  "top-left": "uppe till vänster",
};

export type GuideStep = 0 | 1 | 2;

/** collapsed null: inget val ännu, så telefon börjar hopfälld och dator utfälld. Det avgör CSS, så att inget hoppar när sidan hydreras. */
type Bubble = { corner: Corner; collapsed: boolean | null; guide: GuideStep | null };

const PLACE_KEY = "statlin-redigeringsbubbla";
const GUIDE_KEY = "statlin-redigeringsguide";
const SERVER: Bubble = { corner: "bottom-right", collapsed: null, guide: null };

let state = SERVER;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const saved = JSON.parse(localStorage.getItem(PLACE_KEY) ?? "null") as Partial<Bubble> | null;
    if (!saved) return;
    state = {
      ...state,
      corner: saved.corner && Object.hasOwn(CORNERS, saved.corner) ? saved.corner : state.corner,
      collapsed: typeof saved.collapsed === "boolean" ? saved.collapsed : null,
    };
  } catch {
    /* privat läge eller trasigt värde: då gäller standardvalen */
  }
}

function set(next: Partial<Bubble>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function save() {
  try {
    localStorage.setItem(PLACE_KEY, JSON.stringify({ corner: state.corner, collapsed: state.collapsed }));
  } catch {
    /* privat läge: valet gäller bara den här sidvisningen */
  }
}

export const bubbleStore = {
  moveTo(corner: Corner) {
    set({ corner });
    save();
  },
  setCollapsed(collapsed: boolean) {
    set({ collapsed });
    save();
  },
  openGuide(step: GuideStep = 0) {
    set({ guide: step });
    try {
      localStorage.setItem(GUIDE_KEY, "sedd");
    } catch {
      /* privat läge: guiden kommer igen nästa gång */
    }
  },
  closeGuide() {
    set({ guide: null });
  },
  /** Guiden öppnas av sig själv en enda gång. */
  openGuideFirstTime() {
    try {
      if (localStorage.getItem(GUIDE_KEY)) return;
    } catch {
      return;
    }
    bubbleStore.openGuide();
  },
};

export function useBubble(): Bubble {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => {
      load();
      return state;
    },
    () => SERVER,
  );
}

/** Hörnet som en piltangent flyttar bubblan till. Null: tangenten gör ingenting här. */
export function cornerAfterKey(corner: Corner, key: string): Corner | null {
  const [vertical, horizontal] = corner.split("-");
  if (key === "ArrowUp" && vertical === "bottom") return `top-${horizontal}` as Corner;
  if (key === "ArrowDown" && vertical === "top") return `bottom-${horizontal}` as Corner;
  if (key === "ArrowLeft" && horizontal === "right") return `${vertical}-left` as Corner;
  if (key === "ArrowRight" && horizontal === "left") return `${vertical}-right` as Corner;
  return null;
}
