import Link from "next/link";
import { Suspense } from "react";
import { MarkTasksSeen } from "@/components/admin/mark-tasks-seen";
import { sortTasksForList, STATUS_ORDER, STATUS_STYLES, TaskCard, TaskList } from "@/components/admin/task-ui";
import { AdminHeader, EmptyState, Notice } from "@/components/admin/ui";
import { Plus } from "@/components/icons";
import { seesAllTasks } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { countUnseenTasks, listTasksFor, type TaskFilter } from "@/lib/data/tasks";
import { todayLocal } from "@/lib/dates";
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

type TaskView = "tavla" | "lista";

/** Filtret och vyn står i adressen, så att de följer med varandra och går att dela. Ingen kaka: den enda kakan på sajten är inloggningen. */
function boardHref(visa: TaskFilter, vy: TaskView) {
  const query = new URLSearchParams();
  if (visa !== "alla") query.set("visa", visa);
  if (vy === "lista") query.set("vy", "lista");
  const text = query.toString();
  return `/admin/uppdrag${text ? `?${text}` : ""}`;
}

function Segments({ label, items }: { label: string; items: { label: string; href: string; active: boolean }[] }) {
  return (
    <nav aria-label={label} className="inline-flex rounded-full border border-ink/15 bg-white p-1">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          aria-current={item.active ? "true" : undefined}
          className={cn("whitespace-nowrap rounded-full px-3 py-2 text-[0.82rem] font-semibold transition-colors sm:px-4 sm:text-sm", item.active ? "bg-ink text-white" : "text-ink/60 hover:text-ink")}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

async function TaskBoard({ searchParams }: { searchParams: PageProps<"/admin/uppdrag">["searchParams"] }) {
  const user = await requireUser();
  const sp = await searchParams;
  const filter: TaskFilter = sp.visa === "till" || sp.visa === "fran" ? sp.visa : "alla";
  const view: TaskView = sp.vy === "lista" ? "lista" : "tavla";
  const [tasks, unseen] = await Promise.all([listTasksFor(user, filter), countUnseenTasks(user.id)]);
  const tabs: { key: TaskFilter; label: string }[] = [
    { key: "alla", label: "Alla" },
    { key: "till", label: "Till dig" },
    { key: "fran", label: "Från dig" },
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Segments label="Vilka uppdrag" items={tabs.map((t) => ({ label: t.label, href: boardHref(t.key, view), active: filter === t.key }))} />
        <Segments
          label="Visning"
          items={[
            { label: "Tavla", href: boardHref(filter, "tavla"), active: view === "tavla" },
            { label: "Lista", href: boardHref(filter, "lista"), active: view === "lista" },
          ]}
        />
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
        // Antalet kolumner följer ytan tavlan har, så att den också passar bredvid sidomenyn. Staplade kolumner utan innehåll är bara i vägen.
        <div className="@container">
          {view === "lista" ? (
            <TaskList tasks={sortTasksForList(tasks, todayLocal())} />
          ) : (
            <div className="grid gap-3 @xl:grid-cols-2 @4xl:grid-cols-4">
              {STATUS_ORDER.map((status) => {
                const column = tasks.filter((t) => t.status === status);
                return (
                  <section key={status} aria-labelledby={`kolumn-${status}`} className={cn("min-w-0 rounded-2xl bg-ink/[0.035] p-2", column.length === 0 && "@max-xl:hidden")}>
                    <h2 id={`kolumn-${status}`} className="flex items-center justify-between px-1.5 pb-2 pt-1 text-sm font-bold">
                      <span className="flex items-center gap-2">
                        <span className={cn("size-2 rounded-full", STATUS_STYLES[status].dot)} aria-hidden />
                        {TASK_STATUSES[status]}
                      </span>
                      <span className="tabular text-stone">{column.length}</span>
                    </h2>
                    {column.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-ink/15 px-3 py-4 text-center text-xs text-stone">Inget här</p>
                    ) : (
                      <ul className="space-y-2">
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
        </div>
      )}
      <p className="mt-4 text-xs text-stone">Avklarade uppdrag försvinner från tavlan efter 30 dagar.</p>
    </>
  );
}
