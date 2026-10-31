import Link from "next/link";
import { Calendar, Lock, MessageCircle } from "@/components/icons";
import { formatDate, todayLocal } from "@/lib/dates";
import { TASK_STATUSES, type Task, type TaskPerson, type TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const STATUS_ORDER: TaskStatus[] = ["planerad", "pagar", "hjalp", "klar"];

export const STATUS_STYLES: Record<TaskStatus, { dot: string; chip: string }> = {
  planerad: { dot: "bg-ink/40", chip: "bg-ink/[0.07] text-ink/70" },
  pagar: { dot: "bg-sky-600", chip: "bg-sky-600/10 text-sky-900" },
  hjalp: { dot: "bg-red", chip: "bg-red/10 text-red-deep" },
  klar: { dot: "bg-emerald-600", chip: "bg-emerald-600/10 text-emerald-800" },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className={cn("chip", STATUS_STYLES[status].chip)}>
      <span className={cn("size-1.5 rounded-full", STATUS_STYLES[status].dot)} aria-hidden />
      {TASK_STATUSES[status]}
    </span>
  );
}

/** Ett konto som posten det tillhör, med utskottets färg som prick. */
export function PersonChip({ person, fallback = "Borttaget konto", className }: { person: TaskPerson | null; fallback?: string; className?: string }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5 font-semibold", className)}>
      <span className="size-2 shrink-0 rounded-full ring-1 ring-ink/10" style={{ background: person?.accent ?? "#d4d4d4" }} aria-hidden />
      <span className="truncate">{person ? person.label : fallback}</span>
      {person?.committee && simplify(person.committee) !== simplify(person.label) && <span className="shrink-0 font-normal text-stone">· {person.committee}</span>}
    </span>
  );
}

/** "e-STIG" och "eSTIG" är samma sak – utskottet visas bara när det säger något nytt. */
const simplify = (s: string) => s.toLowerCase().replace(/[^a-z0-9åäö]/g, "");

export function DueLabel({ date, done }: { date: string; done?: boolean }) {
  const overdue = !done && date < todayLocal();
  return (
    <span className={cn("inline-flex items-center gap-1", overdue ? "font-semibold text-red-deep" : "text-stone")}>
      <Calendar size={13} />
      {overdue ? "Försenat · " : ""}
      {formatDate(date)}
    </span>
  );
}

export function TaskCard({ task }: { task: Task }) {
  return (
    <Link
      href={`/admin/uppdrag/${task.id}`}
      className="block rounded-2xl border border-ink/10 bg-white p-4 shadow-[0_1px_0_rgb(0_0_0/0.03)] transition-colors hover:border-ink/30"
    >
      <span className="flex items-start justify-between gap-3">
        <span className="font-semibold leading-snug">{task.title}</span>
        {!task.shared && (
          <span title="Privat: syns bara för avsändaren, mottagaren och ordf/vice/info" className="mt-1 shrink-0 text-stone">
            <Lock size={14} />
            <span className="sr-only">Privat</span>
          </span>
        )}
      </span>
      <span className="mt-3 flex min-w-0 flex-col gap-1 text-[0.8rem]">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="w-8 shrink-0 text-stone">Från</span>
          <PersonChip person={task.from} />
        </span>
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="w-8 shrink-0 text-stone">Till</span>
          {task.to_user_id === null ? <span className="chip bg-red/10 text-red-deep">Öppet – vem som helst</span> : <PersonChip person={task.to} />}
        </span>
      </span>
      {(task.due_date || task.event || task.comment_count > 0) && (
        <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-ink/[0.07] pt-3 text-[0.78rem]">
          {task.due_date && <DueLabel date={task.due_date} done={task.status === "klar"} />}
          {task.event && <span className="truncate text-stone">↳ {task.event.title}</span>}
          {task.comment_count > 0 && (
            <span className="inline-flex items-center gap-1 text-stone">
              <MessageCircle size={13} /> {task.comment_count}
            </span>
          )}
        </span>
      )}
    </Link>
  );
}
