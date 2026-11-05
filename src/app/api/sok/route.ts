import { buildSearchIndex } from "@/lib/data/search-index";

/** Sökindexet till sökfliken. Hämtas en gång per besök och söks sedan i webbläsaren, så träffarna kommer medan man skriver. */
export async function GET() {
  const entries = await buildSearchIndex();
  return Response.json(entries, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=600" } });
}
