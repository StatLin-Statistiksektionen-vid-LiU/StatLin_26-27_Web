import { listExamCodes } from "@/lib/data/exam-stats";

/** Alla kurskoder som har tentastatistik, till förslagen i sökrutan. Hämtas först när någon börjar skriva. */
export async function GET() {
  const codes = await listExamCodes();
  // En tom lista betyder att källan inte svarade – den ska inte sparas i webbläsarens cache.
  const cacheControl = codes.length ? "public, max-age=3600, stale-while-revalidate=86400" : "no-store";
  return Response.json(codes, { headers: { "Cache-Control": cacheControl } });
}
