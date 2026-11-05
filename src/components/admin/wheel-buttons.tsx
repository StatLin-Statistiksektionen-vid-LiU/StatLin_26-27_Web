"use client";

import { unstable_rethrow } from "next/navigation";
import { useActionState, useLayoutEffect, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { FormState } from "@/lib/admin/form";
import { cn } from "@/lib/utils";

/** Knapp i ett litet formulär. Låst medan svaret är på väg, så att ett dubbelklick inte skickar två gånger. */
export function PendingButton({ children, className, title }: { children: ReactNode; className?: string; title?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} title={title} className={cn("disabled:opacity-60", className)}>
      {children}
    </button>
  );
}

const NO_STATE: FormState = {};

/** "Fyll med förslag" med besked om vad som hände. */
export function FillSuggestionsButton({ action, className, children = "Fyll med förslag" }: { action: () => Promise<FormState>; className?: string; children?: ReactNode }) {
  const [state, formAction] = useActionState(async (): Promise<FormState> => {
    try {
      return await action();
    } catch (err) {
      unstable_rethrow(err);
      console.error(err);
      return { error: "Kunde inte fylla på – försök igen." };
    }
  }, NO_STATE);
  // Beskedet tas bort när sidan göms (Activity), annars står det kvar när man kommer tillbaka.
  const [cleared, setCleared] = useState(NO_STATE);
  useLayoutEffect(() => () => setCleared(state), [state]);
  const shown = state === cleared ? NO_STATE : state;
  return (
    <form action={formAction} className="contents">
      <PendingButton className={className}>{children}</PendingButton>
      {(shown.message || shown.error) && (
        <p role={shown.error ? "alert" : "status"} className={cn("basis-full text-sm font-semibold", shown.error ? "text-red-dark" : "text-emerald-900")}>
          {shown.error ?? shown.message}
        </p>
      )}
    </form>
  );
}

/** Skriver ut sidan. */
export function PrintButton({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <button type="button" onClick={() => window.print()} className={className}>
      {children}
    </button>
  );
}
