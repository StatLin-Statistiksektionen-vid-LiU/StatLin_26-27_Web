import { NextResponse, type NextRequest } from "next/server";
import { normalizeCourseCode } from "@/lib/exam-stats";

/**
 * Två saker:
 * - Admin: utan sessionskaka skickas besökare direkt till inloggningen. Det är en optimistisk kontroll –
 *   den riktiga behörighetskontrollen görs mot databasen i varje sida och server action.
 * - Tentastatistik: kurssidorna har alltid koden med versaler (/tentastatistik/732g33 → 732G33), och
 *   sökformuläret utan JavaScript (/tentastatistik?kod=…) skickas vidare till kurssidan.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/tentastatistik" || pathname.startsWith("/tentastatistik/")) {
    return examStatsRedirect(request) ?? NextResponse.next();
  }
  if (!request.cookies.has("statlin_session")) {
    const url = new URL("/logga-in", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

function examStatsRedirect(request: NextRequest): NextResponse | null {
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === "/tentastatistik") {
    const code = normalizeCourseCode(searchParams.get("kod") ?? "");
    return code ? NextResponse.redirect(new URL(`/tentastatistik/${code}`, request.url)) : null;
  }
  let raw = pathname.slice("/tentastatistik/".length);
  try {
    raw = decodeURIComponent(raw);
  } catch {
    return null;
  }
  const code = normalizeCourseCode(raw);
  return code && code !== raw ? NextResponse.redirect(new URL(`/tentastatistik/${code}`, request.url), 308) : null;
}

export const config = {
  matcher: ["/admin/:path*", "/tentastatistik", "/tentastatistik/:kod"],
};
