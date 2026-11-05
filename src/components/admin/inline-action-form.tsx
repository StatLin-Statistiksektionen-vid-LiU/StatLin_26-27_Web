"use client";

import { unstable_rethrow } from "next/navigation";
import { useActionState, useLayoutEffect, useState, type ReactNode } from "react";
import type { FormState } from "@/lib/admin/form";

const NO_STATE: FormState = {};

/** Ett formulär med bara en knapp, som gör sitt direkt. Går det inte står beskedet ovanför knappen. */
export function InlineActionForm({ action, className, children }: { action: (fd: FormData) => Promise<FormState>; className?: string; children: ReactNode }) {
  // Som ActionForm: ett fel i anropet blir ett besked i stället för en felgräns, och Nexts egna kastas vidare.
  const [state, formAction] = useActionState(async (_prev: FormState, fd: FormData): Promise<FormState> => {
    try {
      return await action(fd);
    } catch (err) {
      unstable_rethrow(err);
      console.error(err);
      return { error: "Det gick inte att spara. Försök igen." };
    }
  }, NO_STATE);
  // Beskedet tas bort när sidan göms (Activity): när man kommer tillbaka kan man ha loggat in igen.
  const [cleared, setCleared] = useState(NO_STATE);
  useLayoutEffect(() => () => setCleared(state), [state]);
  const error = state === cleared ? undefined : state.error;

  return (
    <form action={formAction} className={className}>
      {error && (
        <p role="alert" className="mb-2 max-w-xs text-sm font-medium text-red-deep">
          {error}
        </p>
      )}
      {children}
    </form>
  );
}
