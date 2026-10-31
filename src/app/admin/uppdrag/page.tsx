import Link from "next/link";
import { Suspense } from "react";
import { MarkTasksSeen } from "@/components/admin/mark-tasks-seen";
import { STATUS_ORDER, STATUS_STYLES, TaskCard } from "@/components/admin/task-ui";
import { AdminHeader, EmptyState, Notice } from "@/components/admin/ui";
import { Plus } from "@/components/icons";
import { seesAllTasks } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { countUnseenTasks, listTasksFor, type TaskFilter } from "@/lib/data/tasks";
import { TASK_STATUSES } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata = { title: "Uppdragstavla" };

export default function TaskBoardPage(props: PageProps<"/admin/uppdrag">) {
  return (
    <Suspense>
      <TaskBoard searchParams={props.searchParams} />
    </Suspense>
  );
}

async function TaskBoard({ searchParams }: { searchParams: PageProps<"/admin/uppdrag">["searchParams"] }) {
  const user = await requireUser();
  const sp = await searchParams;
  const filter: TaskFilter = sp.visa === "till" || sp.visa === "fran" ? sp.visa : "alla";
  const [tasks, unseen] = await Promise.all([listTasksFor(user, filter), countUnseenTasks(user.id)]);
  const tabs: { key: TaskFilter; label: string; href: string }[] = [
    { key: "alla", label: "Alla", href: "/admin/uppdrag" },
    { key: "till", label: "Till dig", href: "/admin/uppdrag?visa=till" },
    { key: "fran", label: "Från dig", href: "/admin/uppdrag?visa=fran" },
  ];

  return (
    <>
      {unseen > 0 && <MarkTasksSeen />}
      {sp.raderat && <Notice>Uppdraget är borttaget.</Notice>}
      <AdminHeader
        kicker="Styrelsen"
        title="Uppdragstavla"
        description={
          seesAllTasks(user)
            ? "Uppdrag mellan styrelsens poster. Du ser allt, även det som skickats privat."
            : "Uppdrag mellan styrelsens poster. Du ser det som delats med hela styrelsen och det som rör dig."
        }
        actions={
          <Link href="/admin/uppdrag/ny" className="btn btn-red">
            <Plus size={18} /> Nytt uppdrag
          </Link>
        }
      />
      <div className="mb-6 inline-flex rounded-full border border-ink/15 bg-white p-1">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={cn("rounded-full px-5 py-2 text-sm font-semibold", filter === t.key ? "bg-ink text-white" : "text-ink/60 hover:text-ink")}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title={filter === "till" ? "Inga uppdrag till dig" : filter === "fran" ? "Du har inte skickat några uppdrag" : "Tavlan är tom"}
          action={
            <Link href="/admin/uppdrag/ny" className="btn btn-ink">
              <Plus size={18} /> Skicka ett uppdrag
            </Link>
          }
        >
          Behöver ni en affisch, ett inlägg på Instagram eller hjälp på ett evenemang? Skicka det som ett uppdrag till rätt post.
        </EmptyState>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {STATUS_ORDER.map((status) => {
            const column = tasks.filter((t) => t.status === status);
            return (
              <section key={status} aria-labelledby={`kolumn-${status}`} className="min-w-0 rounded-[1.5rem] bg-ink/[0.035] p-3">
                <h2 id={`kolumn-${status}`} className="flex items-center justify-between px-2 pb-3 pt-1 text-sm font-bold">
                  <span className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", STATUS_STYLES[status].dot)} aria-hidden />
                    {TASK_STATUSES[status]}
                  </span>
                  <span className="tabular text-stone">{column.length}</span>
                </h2>
                {column.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-ink/15 px-4 py-6 text-center text-xs text-stone">Inget här</p>
                ) : (
                  <ul className="space-y-2.5">
                    {column.map((t) => (
                      <li key={t.id}>
                        <TaskCard task={t} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
      <p className="mt-6 text-xs text-stone">Avklarade uppdrag försvinner från tavlan efter 30 dagar.</p>
    </>
  );
}
