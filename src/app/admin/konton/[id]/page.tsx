import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { deleteUser, resetUserPassword } from "@/app/admin/_actions/users";
import { ActionForm } from "@/components/admin/action-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { UserForm } from "@/components/admin/user-form";
import { AdminHeader, Card, Notice } from "@/components/admin/ui";
import { Trash } from "@/components/icons";
import { isAdmin } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { getUser, listAudit } from "@/lib/data/admin";
import { listCommittees } from "@/lib/data/content";
import { formatTimestamp } from "@/lib/dates";

export const metadata = { title: "Konto" };

export default function EditUserPage(props: PageProps<"/admin/konton/[id]">) {
  return (
    <Suspense>
      <EditUser params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function EditUser({ params, searchParams }: Pick<PageProps<"/admin/konton/[id]">, "params" | "searchParams">) {
  const me = await requireUser();
  if (!isAdmin(me)) redirect("/admin?nekad=1");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const user = await getUser(Number(id));
  if (!user) notFound();
  const [committees, activity] = await Promise.all([listCommittees(), listAudit(8, user.id)]);
  return (
    <>
      {sp.fel === "sjalv" && <Notice tone="warning">Du kan inte ta bort ditt eget konto.</Notice>}
      {sp.fel === "sista" && <Notice tone="warning">Det måste finnas minst en administratör.</Notice>}
      <AdminHeader
        back={{ href: "/admin/konton", label: "Konton" }}
        title={user.name}
        description={user.email}
        actions={
          user.id !== me.id && (
            <ConfirmButton action={deleteUser} id={user.id} message={`Ta bort kontot ${user.email}? Innehållet personen skapat finns kvar.`}>
              <Trash size={15} /> Ta bort konto
            </ConfirmButton>
          )
        }
      />
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <UserForm user={user} committees={committees} />
        </div>
        <div className="space-y-6 lg:col-span-2">
          <ActionForm action={resetUserPassword} submitLabel="Återställ lösenord" stickyFooter={false}>
            <input type="hidden" name="id" value={user.id} />
            <div>
              <h2 className="font-bold">Glömt lösenord?</h2>
              <p className="mt-1 text-sm text-stone">Skapar ett nytt tillfälligt lösenord och loggar ut kontot från alla enheter.</p>
            </div>
          </ActionForm>
          <Card className="p-6">
            <h2 className="font-bold">Senaste aktivitet</h2>
            <p className="mt-1 text-xs text-stone">{user.last_login_at ? `Senast inloggad ${formatTimestamp(user.last_login_at)}` : "Har aldrig loggat in."}</p>
            <ul className="mt-4 space-y-2 text-sm">
              {activity.length === 0 && <li className="text-stone">Ingen aktivitet ännu.</li>}
              {activity.map((a) => (
                <li key={a.id} className="flex justify-between gap-3">
                  <span className="truncate">{a.summary || a.entity}</span>
                  <span className="shrink-0 font-mono text-xs text-stone">{formatTimestamp(a.created_at)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
