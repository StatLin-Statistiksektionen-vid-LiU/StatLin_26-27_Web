import { getEventBySlug } from "@/lib/data/events";
import { buildCalendar } from "@/lib/ics";
import { siteUrl } from "@/lib/site-url";

export async function GET(_req: Request, ctx: RouteContext<"/evenemang/[slug]/kalender.ics">) {
  const { slug } = await ctx.params;
  const event = await getEventBySlug(slug);
  if (!event) return new Response("Hittades inte", { status: 404 });
  return new Response(buildCalendar([event], await siteUrl(), event.title), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
    },
  });
}
