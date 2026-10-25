import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistisk kontroll: utan sessionskaka skickas besökare direkt till inloggningen.
 * Den riktiga behörighetskontrollen görs mot databasen i varje sida och server action.
 */
export function proxy(request: NextRequest) {
  if (!request.cookies.has("statlin_session")) {
    const url = new URL("/logga-in", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
