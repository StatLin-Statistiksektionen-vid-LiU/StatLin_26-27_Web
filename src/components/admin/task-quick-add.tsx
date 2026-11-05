"use client";

import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { startTransition, useActionState, useLayoutEffect, useRef, useState } from "react";
import { saveTask } from "@/app/admin/_actions/tasks";
import { RecipientOptions } from "@/components/admin/task-recipients";
import { Check, Plus } from "@/components/icons";
import type { FormState } from "@/lib/admin/form";
import type { TaskPerson } from "@/lib/types";
import { cn } from "@/lib/utils";

const NO_STATE: FormState = {};
const FIELD =
  "h-11 min-w-0 rounded-xl border border-ink/15 bg-white px-3 text-[0.92rem] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-ink/40 focus:border-ink focus:ring-4 focus:ring-ink/[0.06] pointer-coarse:text-[16px]";

/**
 * Ett nytt uppdrag direkt på tavlan: rubrik, mottagare, datum och Enter. Man står kvar med markören i rubriken och kan skriva nästa,
 * och beskrivning, evenemang och privat finns ett klick bort med det man hunnit skriva ifyllt.
 */
export function TaskQuickAdd({ recipients }: { recipients: (TaskPerson & { kind: string })[] }) {
  const [title, setTitle] = useState("");
  const [to, setTo] = useState("");
  const [due, setDue] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  // En action som kastar (nätverksfel, en ny deploy) ska bli ett vanligt fel och inte byta ut hela sidan. Nexts egna fel kastas vidare.
  const [state, formAction, pending] = useActionState(async (prev: FormState, fd: FormData): Promise<FormState> => {
    try {
      const res = await saveTask(prev, fd);
      if (res.ok) {
        // Mottagaren står kvar, eftersom flera uppdrag i rad oftast går till samma post.
        setTitle("");
        setDue("");
        titleRef.current?.focus();
      }
      return res;
    } catch (err) {
      unstable_rethrow(err);
      console.error(err);
      return { error: "Kunde inte skicka uppdraget. Försök igen." };
    }
  }, NO_STATE);

  // Beskedet gäller det senaste försöket: det försvinner när man börjar skriva nästa och när sidan göms (preserving-ui-state.md).
  const [cleared, setCleared] = useState(NO_STATE);
  useLayoutEffect(() => () => setCleared(state), [state]);
  const shown = state === cleared ? NO_STATE : state;
  const titleError = shown.fieldErrors?.title;
  const expanded = title.length > 0;

  const more = new URLSearchParams();
  if (title.trim()) more.set("titel", title.trim());
  if (to) more.set("till", to);
  if (due) more.set("datum", due);
  const moreQuery = more.toString();

  return (
    <div className="mb-4 rounded-2xl border border-ink/10 bg-white p-2.5">
      <form
        method="post"
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (pending) return;
          const fd = new FormData(e.currentTarget);
          startTransition(() => formAction(fd));
        }}
        noValidate
      >
        <input type="hidden" name="stay" value="1" />
        <input
          ref={titleRef}
          name="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setCleared(state);
          }}
          maxLength={140}
          required
          autoComplete="off"
          aria-label="Vad behöver göras?"
          aria-invalid={titleError ? true : undefined}
          placeholder="Vad behöver göras?"
          className={cn(FIELD, "min-w-48 flex-[1_1_16rem]", titleError && "border-red")}
        />
        {/* På en smal skärm kommer resten fram först när det finns något att skicka. */}
        <div className={cn("flex-wrap items-center gap-2 max-sm:w-full sm:contents", expanded ? "flex" : "hidden")}>
          <select name="to_user_id" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Till vem?" className={cn(FIELD, "flex-[1_1_10rem] pr-2 sm:max-w-60 sm:flex-[0_1_15rem]")}>
            <RecipientOptions recipients={recipients} openLabel="Öppet, vem som helst" />
          </select>
          <input type="date" name="due_date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Klart senast" className={cn(FIELD, "w-[9.5rem] flex-none pr-2", !due && "text-ink/40")} />
          <button type="submit" disabled={pending} className="btn btn-ink h-11 flex-none px-4 text-[0.9rem] disabled:opacity-70 max-sm:flex-1">
            <Plus size={16} /> Lägg till
          </button>
        </div>
      </form>
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-1 text-[0.8rem]">
        <p aria-live="polite" className="min-w-0">
          {shown.ok && (
            <span role="status" className="inline-flex flex-wrap items-center gap-x-1.5 font-semibold text-emerald-800">
              <Check size={14} /> {shown.message}
              {shown.data?.id && (
                <Link href={`/admin/uppdrag/${shown.data.id}`} className="tryck font-medium underline underline-offset-2">
                  Lägg till en beskrivning
                </Link>
              )}
            </span>
          )}
          {shown.error && (
            <span role="alert" className="font-semibold text-red-dark">
              {titleError ?? shown.error}
            </span>
          )}
        </p>
        <Link href={`/admin/uppdrag/ny${moreQuery ? `?${moreQuery}` : ""}`} className="tryck ml-auto shrink-0 text-stone underline underline-offset-2 hover:text-ink">
          Fler val: beskrivning, evenemang, privat
        </Link>
      </div>
    </div>
  );
}
