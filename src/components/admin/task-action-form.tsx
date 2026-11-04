"use client";

import { unstable_rethrow } from "next/navigation";
import { useActionState, useLayoutEffect, useState, type ReactNode } from "react";
import type { FormState } from "@/lib/admin/form";

const NO_STATE: FormState = {};

/** Knappar på ett uppdrag som gör sitt direkt, utan fält att fylla i. Går det inte står beskedet ovanför knapparna. */
export function TaskActionForm({
  action,
  id,
  className,
  children,
}: {
  action: (fd: FormData) => Promise<FormState>;
  id: number;
  className?: string;
  children: ReactNode;
}) {
  // En action som kastar (nätverksfel, ett fel i servern) når annars felgränsen, som byter ut hela sidan. Nexts egna fel
  // (redirect()) kastas vidare.
  const [state, formAction] = useActionState(async (_prev: FormState, fd: FormData): Promise<FormState> => {
    try {
      return await action(fd);
    } catch (err) {
      unstable_rethrow(err);
      console.error(err);
      return { error: "Kunde inte spara – försök igen." };
    }
  }, NO_STATE);
  // Beskedet gäller det senaste klicket. Det tas bort när sidan göms (Activity), för när man kommer tillbaka kan man ha
  // loggat in igen (preserving-ui-state.md).
  const [cleared, setCleared] = useState(NO_STATE);
  useLayoutEffect(() => () => setCleared(state), [state]);
  const error = state === cleared ? undefined : state.error;

  return (
    <form action={formAction} className={className}>
      <input type="hidden" name="id" value={id} />
      {error && <p role="alert" className="mb-3 rounded-2xl border border-red/30 bg-red/[0.06] px-4 py-3 text-sm font-semibold text-red-dark">{error}</p>}
      {children}
    </form>
  );
}
