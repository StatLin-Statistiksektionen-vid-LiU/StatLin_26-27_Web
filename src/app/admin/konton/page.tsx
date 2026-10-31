import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { UserForm } from "@/components/admin/user-form";
import { AdminHeader, Notice } from "@/components/admin/ui";
import { Edit } from "@/components/icons";
import { isAdmin } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { listUsers } from "@/lib/data/admin";
import { listCommittees } from "@/lib/data/content";
import { formatTimestamp } from "@/lib/dates";
import { ROLE_LABELS } from "@/lib/types";
import { cn, initials } from "@/lib/utils";

export const metadata = { title: "Konton" };

export default function AdminUsers(props: PageProps<"/admin/konton">) {
  return (
    <Suspense>
      <Users searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Users({ searchParams }: { searchParams: PageProps<"/admin/konton">["searchParams"] }) {
  const me = await requireUser();
  if (!isAdmin(me)) redirect("/admin?nekad=1");
  const [users, committees, sp] = await Promise.all([listUsers(), listCommittees(), searchParams]);
  return (
    <>
      {sp.raderad && <Notice>Kontot är borttaget.</Notice>}
      <AdminHeader title="Konton" description="Ett konto per post. Utskottskonton når bara sitt eget utskott, redaktörer (t.ex. info) allt innehåll och inställningarna, och administratörer (t.ex. ordförande och vice) dessutom konton och granskning." />
      <div className="grid gap-8 lg:grid-cols-5">
        <ul className="divide-y divide-ink/10 self-start overflow-hidden rounded-[1.5rem] border border-ink/10 bg-white lg:col-span-3">
          {users.map((u) => (
            <li key={u.id}>
              <Link href={`/admin/konton/${u.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-paper/40">
                <span className={cn("grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold", u.active ? "bg-ink text-white" : "bg-ink/10 text-ink/50")}>
                  {initials(u.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-semibold">{u.name}</span>
                    {u.id === me.id && <span className="chip bg-red/10 text-red-deep">Du</span>}
                    {!u.active && <span className="chip bg-ink/[0.07] text-ink/60">Inaktiv</span>}
                    {!!u.design && <span className="chip bg-paper text-ink">Grafiskt</span>}
                  </span>
                  <span className="block truncate text-xs text-stone">
                    {u.email} · {u.post || "–"}
                  </span>
                </span>
                <span className="hidden text-right sm:block">
                  <span className="chip bg-paper text-ink">
                    {ROLE_LABELS[u.role]}
                    {u.role === "committee" && u.committee_name ? ` · ${u.committee_name}` : ""}
                  </span>
                  <span className="mt-1 block font-mono text-[0.68rem] text-stone-light">{u.last_login_at ? `Senast ${formatTimestamp(u.last_login_at)}` : "Aldrig inloggad"}</span>
                </span>
                <Edit size={16} className="text-stone" />
              </Link>
            </li>
          ))}
        </ul>
        <div className="lg:col-span-2">
          <UserForm committees={committees} />
        </div>
      </div>
    </>
  );
}
