import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { addTaskComment, claimTask, deleteTask, setTaskStatus } from "@/app/admin/_actions/tasks";
import { ActionForm } from "@/components/admin/action-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Field, TextArea } from "@/components/admin/fields";
import { TaskForm } from "@/components/admin/task-form";
import { DueLabel, PersonChip, STATUS_ORDER, STATUS_STYLES, TaskStatusBadge } from "@/components/admin/task-ui";
import { AdminHeader, Card, Notice } from "@/components/admin/ui";
import { Markdown } from "@/components/content/markdown";
import { ArrowUpRight, Lock, Trash, Users } from "@/components/icons";
import { canEditTask, canSeeTask, canUpdateTask } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { listEventsForAdmin } from "@/lib/data/events";
import { getTask, listTaskComments, listTaskRecipients } from "@/lib/data/tasks";
import { formatTimestamp, todayLocal } from "@/lib/dates";
import { TASK_STATUSES } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata = { title: "Uppdrag" };

export default function TaskPage(props: PageProps<"/admin/uppdrag/[id]">) {
  return (
    <Suspense>
      <TaskDetail params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function TaskDetail({
  params,
  searchParams,
}: {
  params: PageProps<"/admin/uppdrag/[id]">["params"];
  searchParams: PageProps<"/admin/uppdrag/[id]">["searchParams"];
}) {
  const user = await requireUser();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const task = /^\d+$/.test(id) ? await getTask(Number(id)) : null;
  if (!task) notFound();
  if (!canSeeTask(user, task)) redirect("/admin/uppdrag");
  const mayUpdate = canUpdateTask(user, task);
  const mayEdit = canEditTask(user, task);
  const [comments, recipients, events] = await Promise.all([
    listTaskComments(task.id),
    mayEdit ? listTaskRecipients() : Promise.resolve([]),
    mayEdit ? listEventsForAdmin(null) : Promise.resolve([]),
  ]);
  const today = todayLocal();

  return (
    <>
      {sp.skapat && <Notice>Uppdraget är skickat. Det syns nu på tavlan{task.to ? ` och hos ${task.to.label}` : ""}.</Notice>}
      <AdminHeader
        back={{ href: "/admin/uppdrag", label: "Uppdragstavla" }}
        kicker={TASK_STATUSES[task.status]}
        title={task.title}
        actions={
          mayEdit && (
            <ConfirmButton action={deleteTask} id={task.id} message={`Ta bort uppdraget "${task.title}"?`}>
              <Trash size={15} /> Ta bort
            </ConfirmButton>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <h2 className="kicker text-stone">Beskrivning</h2>
            <div className="mt-3">
              {task.description.trim() ? <Markdown source={task.description} /> : <p className="text-stone">Ingen beskrivning.</p>}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-bold">Kommentarer {comments.length > 0 && <span className="text-stone">({comments.length})</span>}</h2>
            {comments.length > 0 && (
              <ol className="mt-4 space-y-4">
                {comments.map((c) => (
                  <li key={c.id} className="rounded-2xl bg-paper/70 p-4">
                    <p className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <PersonChip person={c.author} />
                      <span className="font-mono text-[0.7rem] text-stone">{formatTimestamp(c.created_at)}</span>
                    </p>
                    <div className="mt-2 text-[0.95rem]">
                      <Markdown source={c.body} />
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <div className="mt-5">
              <ActionForm action={addTaskComment} submitLabel="Skicka" stickyFooter={false} resetOnSuccess>
                <input type="hidden" name="task_id" value={task.id} />
                <Field label="Skriv en kommentar" name="body">
                  <TextArea name="body" rows={3} maxLength={2000} placeholder="Utkastet finns här: https://… / Jag kan hjälpa till på lördag!" />
                </Field>
              </ActionForm>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="kicker text-stone">Status</h2>
            {mayUpdate ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {STATUS_ORDER.map((s) => (
                  <form key={s} action={setTaskStatus}>
                    <input type="hidden" name="id" value={task.id} />
                    <input type="hidden" name="status" value={s} />
                    <button
                      type="submit"
                      aria-pressed={task.status === s}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                        task.status === s ? "border-ink bg-ink text-white" : "border-ink/10 bg-white hover:border-ink/40",
                      )}
                    >
                      <span className={cn("size-2 shrink-0 rounded-full", STATUS_STYLES[s].dot)} aria-hidden />
                      {TASK_STATUSES[s]}
                    </button>
                  </form>
                ))}
              </div>
            ) : (
              <div className="mt-3">
                <TaskStatusBadge status={task.status} />
                <p className="mt-2 text-xs text-stone">Avsändaren och mottagaren ändrar status.</p>
              </div>
            )}
            {task.to_user_id === null && (
              <form action={claimTask} className="mt-4">
                <input type="hidden" name="id" value={task.id} />
                <button type="submit" className="btn btn-red w-full">
                  <Users size={17} /> Jag tar den
                </button>
                <p className="mt-2 text-xs text-stone">Uppdraget är öppet – den som tar det blir mottagare.</p>
              </form>
            )}
          </Card>

          <Card className="p-6">
            <dl className="space-y-3.5 text-sm">
              <Meta label="Från">
                <PersonChip person={task.from} />
              </Meta>
              <Meta label="Till">{task.to_user_id === null ? <span className="font-semibold text-red-deep">Öppet – vem som helst</span> : <PersonChip person={task.to} />}</Meta>
              {task.due_date && (
                <Meta label="Klart senast">
                  <DueLabel date={task.due_date} done={task.status === "klar"} />
                </Meta>
              )}
              {task.event && (
                <Meta label="Evenemang">
                  <Link href={`/evenemang/${task.event.slug}`} target="_blank" className="inline-flex items-center gap-1 font-semibold hover:underline">
                    {task.event.title} <ArrowUpRight size={13} className="text-red" />
                  </Link>
                </Meta>
              )}
              <Meta label="Syns för">
                {task.shared ? (
                  "Hela styrelsen"
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <Lock size={13} /> Avsändare, mottagare och ordf/vice/info
                  </span>
                )}
              </Meta>
              <Meta label="Skapat">{formatTimestamp(task.created_at)}</Meta>
              {task.completed_at && <Meta label="Klart">{formatTimestamp(task.completed_at)}</Meta>}
            </dl>
          </Card>
        </div>
      </div>

      {mayEdit && (
        <details className="group mt-8 rounded-[1.5rem] border border-ink/10 bg-white/60 p-5 open:bg-transparent open:p-0 open:pt-2">
          <summary className="cursor-pointer list-none font-bold group-open:mb-5">Redigera uppdraget</summary>
          <TaskForm
            task={task}
            recipients={recipients}
            events={events.filter((e) => e.starts_at.slice(0, 10) >= today || e.id === task.event_id).reverse()}
            meId={user.id}
          />
        </details>
      )}
    </>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3">
      <dt className="text-stone">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  );
}
