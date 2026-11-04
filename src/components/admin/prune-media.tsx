"use client";

import { unstable_rethrow } from "next/navigation";
import { useState, useTransition } from "react";
import type { FormState } from "@/lib/admin/form";

/** Gallringen under Bilder (ST-17): frågar först och visar sedan vad som togs bort. */
export function PruneMedia({ action }: { action: () => Promise<FormState> }) {
  const [state, setState] = useState<FormState>({});
  const [pending, startTransition] = useTransition();
  const run = () => {
    // Gallringen väljer på uppladdningsdatum och på om något använder filen just nu – inte på hur länge den varit oanvänd.
    if (!confirm("Ta bort uppladdningar som är äldre än en vecka och inte används någonstans just nu? Det går inte att ångra.")) return;
    startTransition(async () => {
      try {
        setState(await action());
      } catch (err) {
        // Som ActionForm: ett fel i anropet visas här i stället för att felgränsen byter ut sidan (Nexts egna kastas vidare).
        unstable_rethrow(err);
        setState({ error: "Det gick inte att rensa – försök igen." });
      }
    });
  };
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={run} disabled={pending} className="btn btn-ghost bg-white disabled:opacity-70">
        {pending ? "Rensar…" : "Rensa oanvända filer"}
      </button>
      {state.ok && (
        <p role="status" className="text-sm text-emerald-900">
          {state.message}
        </p>
      )}
      {state.error && (
        <p role="alert" className="text-sm font-medium text-red-deep">
          {state.error}
        </p>
      )}
    </div>
  );
}
