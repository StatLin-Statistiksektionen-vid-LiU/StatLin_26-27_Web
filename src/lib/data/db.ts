import "server-only";
import { connection } from "next/server";
import { getDb } from "@/lib/db";
import type { EventItem } from "@/lib/types";

/**
 * better-sqlite3 är synkront och räknas annars som "förutsägbar" data som
 * bakas in vid build. connection() gör läsningen till request-tid så att
 * innehåll som poster ändrar syns direkt.
 */
export async function readDb() {
  await connection();
  return getDb();
}

/** Arrangören i kolumnen committee_json. SQLite saknar booleans, så json_object ger visible som 0 eller 1. */
export function parseCommitteeRef(json: string | null): EventItem["committee"] {
  if (!json) return null;
  const committee = JSON.parse(json);
  return { ...committee, visible: Boolean(committee.visible) };
}
