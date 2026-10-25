import { listAllPublishedEvents } from "@/lib/data/events";
import { buildCalendar } from "@/lib/ics";
import { siteUrl } from "@/lib/site-url";

/** Prenumererbart kalenderflöde med alla publicerade evenemang. */
export async function GET() {
  const events = await listAllPublishedEvents();
  const body = buildCalendar(events, await siteUrl());
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="statlin.ics"',
      "Cache-Control": "public, max-age=900",
    },
  });
}
