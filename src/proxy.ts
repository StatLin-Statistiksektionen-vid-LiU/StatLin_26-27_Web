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
  // SD-27: server actions (POST med next-action) kontrollerar sessionen själva och svarar med ett fel som formuläret visar.
  // Omdirigerades själva anropet hit tappade formuläret beskedet. Sidornas omdirigering nedan är oförändrad.
  const requested = requestedPath(request);
  if (!(request.method === "POST" && request.headers.has("next-action")) && !request.cookies.has("statlin_session")) {
    const url = new URL("/logga-in", request.url);
    url.searchParams.set("next", requested);
    return NextResponse.redirect(url);
  }
  // Layouten och requireUser skickar den vars session gått ut till inloggningen, med vägen tillbaka hit (SB-38).
  const headers = new Headers(request.headers);
  headers.set("x-pathname", requested);
  return NextResponse.next({ request: { headers } });
}

/** Adressen som efterfrågades. _rsc är Nexts eget tillägg för sidbyten i klienten och hör inte till vägen tillbaka. */
function requestedPath(request: NextRequest): string {
  const { pathname, searchParams } = request.nextUrl;
  const query = new URLSearchParams(searchParams);
  query.delete("_rsc");
  const search = query.toString();
  return search ? `${pathname}?${search}` : pathname;
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
