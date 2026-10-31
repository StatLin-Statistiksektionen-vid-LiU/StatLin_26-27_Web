import { getSessionUser } from "@/lib/auth/session";
import { AdminBar } from "./admin-bar";

/** Läser sessionen i ett eget Suspense-hål, så att sidorna förblir statiska för besökare. */
export async function AdminBarLoader() {
  const user = await getSessionUser();
  if (!user) return null;
  return <AdminBar user={{ id: user.id, name: user.name, post: user.post, role: user.role, committee_id: user.committee_id, committee_name: user.committee_name, committee_slug: user.committee_slug }} />;
}
