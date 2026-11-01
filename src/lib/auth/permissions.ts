import type { DocumentCategory, SessionUser } from "@/lib/types";

type Owned = { committee_id: number | null };
/** Det behörigheterna bygger på. Räcker även i webbläsaren, där redigeringsläget visar pennor efter samma regler. */
type Who = Pick<SessionUser, "role" | "committee_id">;
type Designer = Who & Pick<SessionUser, "design">;

export const isAdmin = (u: Who) => u.role === "admin";
export const isEditor = (u: Who) => u.role === "admin" || u.role === "editor";

/** Evenemang och nyheter: redaktörer allt, utskott sitt eget. */
export function canEditOwned(u: Who, item: Owned): boolean {
  if (isEditor(u)) return true;
  return u.role === "committee" && u.committee_id !== null && item.committee_id === u.committee_id;
}

export function canEditCommittee(u: Who, committeeId: number): boolean {
  if (isEditor(u)) return true;
  return u.role === "committee" && u.committee_id === committeeId;
}

/* Uppdragstavlan: ordförande, vice och info (administratörer och redaktörer) ser och får ändra allt. */
type TaskRef = { from_user_id: number | null; to_user_id: number | null; shared: number };

export const seesAllTasks = isEditor;

/** Övriga ser det som delats med hela styrelsen och det de själva skickat eller fått. */
export function canSeeTask(u: SessionUser, t: TaskRef): boolean {
  return seesAllTasks(u) || t.shared === 1 || t.from_user_id === u.id || t.to_user_id === u.id;
}

/** Status: avsändaren och mottagaren. */
export function canUpdateTask(u: SessionUser, t: TaskRef): boolean {
  return seesAllTasks(u) || t.from_user_id === u.id || t.to_user_id === u.id;
}

/** Titel, beskrivning, mottagare och borttagning: bara avsändaren. */
export function canEditTask(u: SessionUser, t: TaskRef): boolean {
  return seesAllTasks(u) || t.from_user_id === u.id;
}

/* Grafiskt ansvar (flaggan under Konton): bilderna på hela sajten. Texterna följer fortfarande rollen. */
export const hasDesign = (u: Pick<SessionUser, "design">) => !!u.design;

/** Omslag och galleri på evenemang, omslag på nyheter och utskottens loggor. */
export const canEditImages = (u: Designer, item: Owned) => canEditOwned(u, item) || hasDesign(u);

/** Adminsidan Bilder, med alla omslag och loggor på ett ställe. */
export const canManageImages = (u: Designer) => isEditor(u) || hasDesign(u);

/** Dokument: redaktörer alla kategorier, grafiskt ansvarig bara det grafiska materialet. */
export const canManageDocuments = (u: Designer) => isEditor(u) || hasDesign(u);
export const canManageDocument = (u: Designer, category: DocumentCategory) => isEditor(u) || (hasDesign(u) && category === "grafiskt");

export const canManageUsers = isAdmin;
export const canReviewEvents = isAdmin;
export const canManageSettings = isEditor;
export const canManageSiteContent = isEditor;
