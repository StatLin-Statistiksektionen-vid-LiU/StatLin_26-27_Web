import { connection } from "next/server";
import { getDb } from "@/lib/db";

/** Hälsokontroll för Docker/övervakning: svarar 200 om databasen går att läsa. */
export async function GET() {
  await connection();
  try {
    getDb().prepare("SELECT 1").get();
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false }, { status: 503 });
  }
}
