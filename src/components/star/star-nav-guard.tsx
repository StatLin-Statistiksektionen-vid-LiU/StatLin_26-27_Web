import { getSettings } from "@/lib/data/content";
import { starIsLive } from "@/lib/naringsliv";

/**
 * Menyerna är statiska och läser inte databasen, så länken till en dold STAR-sida tas bort med en regel som kommer i ett
 * eget Suspense-hål. Direkt under listraden: annars försvann hela gruppen i menyn.
 */
export async function StarNavGuard() {
  const settings = await getSettings();
  if (starIsLive(settings)) return null;
  return <style>{`li:has(> a[href="/star"]){display:none}`}</style>;
}
