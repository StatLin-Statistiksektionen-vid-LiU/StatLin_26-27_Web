import "server-only";
import { connection } from "next/server";
import { getDb } from "@/lib/db";

/**
 * better-sqlite3 är synkront och räknas annars som "förutsägbar" data som
 * bakas in vid build. connection() gör läsningen till request-tid så att
 * innehåll som poster ändrar syns direkt.
 */
export async function readDb() {
  await connection();
  return getDb();
}
