import type { SessionUser } from "@/lib/types";

type Owned = { committee_id: number | null };

export const isAdmin = (u: SessionUser) => u.role === "admin";
export const isEditor = (u: SessionUser) => u.role === "admin" || u.role === "editor";

/** Evenemang och nyheter: redaktörer allt, utskott sitt eget. */
export function canEditOwned(u: SessionUser, item: Owned): boolean {
  if (isEditor(u)) return true;
  return u.role === "committee" && u.committee_id !== null && item.committee_id === u.committee_id;
}

export function canEditCommittee(u: SessionUser, committeeId: number): boolean {
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

export const canManageUsers = isAdmin;
export const canReviewEvents = isAdmin;
export const canManageSettings = isEditor;
export const canManageSiteContent = isEditor;
