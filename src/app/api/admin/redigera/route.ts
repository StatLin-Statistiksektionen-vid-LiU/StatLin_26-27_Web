import { canEditCommittee, canEditOwned, canManageSettings, isEditor } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/auth/session";
import { getBoardMember, getCommitteeById, getPage, getSettings, listCommittees } from "@/lib/data/content";
import { getEventById } from "@/lib/data/events";
import { getNewsById } from "@/lib/data/news";
import type { SessionUser } from "@/lib/types";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
const forbidden = () => json({ error: "Du har inte behörighet att ändra det här." }, 403);
const missing = () => json({ error: "Det finns inte längre." }, 404);

/** Utskottskonton väljer inte arrangör – de ser bara sitt eget utskott i formuläret. */
async function committeesFor(user: SessionUser) {
  const all = await listCommittees();
  return user.role === "committee" ? all.filter((c) => c.id === user.committee_id) : all;
}

/**
 * Data till redigeringspanelen på sajten. Samma behörighet som adminsidorna; själva sparningen
 * går sedan via de vanliga server actions, som kontrollerar igen.
 */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return json({ error: "Du är inte inloggad." }, 401);
  if (user.must_change_password) return json({ error: "Byt ditt tillfälliga lösenord i adminpanelen först." }, 403);

  const params = new URL(request.url).searchParams;
  const id = Number(params.get("id"));

  switch (params.get("typ")) {
    case "page": {
      if (!isEditor(user)) return forbidden();
      const page = await getPage(params.get("slug") ?? "");
      return page ? json({ page }) : missing();
    }
    case "home":
    case "footer": {
      if (!canManageSettings(user)) return forbidden();
      return json({ settings: await getSettings() });
    }
    case "committee": {
      if (!canEditCommittee(user, id)) return forbidden();
      const committee = await getCommitteeById(id);
      return committee ? json({ committee, editor: isEditor(user) }) : missing();
    }
    case "event": {
      const event = await getEventById(id);
      if (!event) return missing();
      if (!canEditOwned(user, event)) return forbidden();
      return json({ event, committees: await committeesFor(user), user: { role: user.role, committee_id: user.committee_id } });
    }
    case "news": {
      const item = await getNewsById(id);
      if (!item) return missing();
      if (!canEditOwned(user, item)) return forbidden();
      return json({ item, committees: await committeesFor(user), user: { role: user.role, committee_id: user.committee_id } });
    }
    case "board": {
      if (!isEditor(user)) return forbidden();
      const member = await getBoardMember(id);
      if (!member) return missing();
      const committees = (await listCommittees()).map((c) => ({ id: c.id, short_name: c.short_name }));
      return json({ member, committees });
    }
    default:
      return json({ error: "Okänd typ." }, 400);
  }
}
