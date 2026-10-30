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

export const canManageUsers = isAdmin;
export const canReviewEvents = isAdmin;
export const canManageSettings = isEditor;
export const canManageSiteContent = isEditor;
