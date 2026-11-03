"use client";

import { unstable_rethrow } from "next/navigation";
import { createContext, Fragment, startTransition, useActionState, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Check } from "@/components/icons";
import type { FormState } from "@/lib/admin/form";
import { cn } from "@/lib/utils";

type SubmitKind = "primary" | "secondary";
const FormCtx = createContext<{ state: FormState; pending: boolean; submitter: SubmitKind }>({ state: {}, pending: false, submitter: "primary" });
export const useFormCtx = () => useContext(FormCtx);

/** En knapp som skickar formuläret med ett eget värde, t.ex. published=0 för "Spara som utkast". */
type SubmitOption = { label: string; name?: string; value?: string };

/**
 * Formulär för server actions med felhantering och sparstatus.
 * Skickas via startTransition i stället för form-action, så att React inte
 * nollställer fälten när valideringen misslyckas.
 */
export function ActionForm({
  action,
  children,
  className,
  submitLabel = "Spara",
  submitValue,
  secondary,
  secondaryFirst,
  footer,
  stickyFooter = true,
  resetOnSuccess,
  onSuccess,
  version,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  children: ReactNode;
  className?: string;
  submitLabel?: string;
  /** Skickas med från huvudknappen. */
  submitValue?: { name: string; value: string };
  /** En andra, mindre framträdande knapp till vänster om huvudknappen. */
  secondary?: SubmitOption;
  /** Den andra knappen ligger först i koden, så att Enter i ett fält väljer den (nya inlägg sparas då som utkast). */
  secondaryFirst?: boolean;
  footer?: ReactNode;
  stickyFooter?: boolean;
  resetOnSuccess?: boolean;
  /** Körs efter en lyckad sparning, t.ex. för att stänga redigeringspanelen. */
  onSuccess?: (state: FormState) => void;
  /**
   * Radens updated_at när formuläret laddades. Skickas i ett dolt fält så att servern kan neka en sparning ovanpå en
   * nyare version, och är nyckel för fälten: Activity behåller annars de gamla värdena på en dold sida, så när raden
   * ändrats (sparad här, i en annan flik eller av någon annan) laddas fälten om från den nya versionen.
   */
  version?: string;
}) {
  // En action som kastar (nätverksfel, en action som inte finns efter en deploy, ett fel i servern) avvisar löftet, och
  // useActionState skickar då felet till närmaste felgräns, som byter ut hela sidan. Felet fångas därför runt själva
  // anropet och visas som ett vanligt fel, och fälten står kvar. Nexts egna fel (redirect(), notFound()) kastas vidare.
  const run = useCallback(
    async (prev: FormState, fd: FormData): Promise<FormState> => {
      try {
        return await action(prev, fd);
      } catch (err) {
        unstable_rethrow(err);
        console.error(err);
        return { error: "Kunde inte spara – försök igen." };
      }
    },
    [action],
  );
  const [state, formAction, pending] = useActionState(run, {});
  const [submitter, setSubmitter] = useState<SubmitKind>("primary");
  const formRef = useRef<HTMLFormElement>(null);
  const dirty = useRef(false);

  const onSuccessRef = useRef(onSuccess);
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  });
  useEffect(() => {
    if (state.ok) {
      dirty.current = false;
      if (resetOnSuccess) formRef.current?.reset();
      onSuccessRef.current?.(state);
    }
  }, [state, resetOnSuccess]);

  // Fälten laddas om när versionen ändras – då finns inget osparat kvar.
  const loadedVersion = useRef(version);
  useEffect(() => {
    if (loadedVersion.current === version) return;
    loadedVersion.current = version;
    dirty.current = false;
  }, [version]);

  // Varna innan man lämnar sidan med osparade ändringar.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  const secondaryButton = secondary && <SubmitButton kind="secondary" label={secondary.label} name={secondary.name} value={secondary.value} />;
  return (
    <FormCtx value={{ state, pending, submitter }}>
      <form
        ref={formRef}
        // Skyddsnät: skickas formuläret innan sidan hydrerats hamnar fälten i en POST-kropp, aldrig i adressen.
        method="post"
        // @container: fälten radas om efter formulärets bredd, så samma formulär fungerar i redigeringspanelen.
        className={cn("@container space-y-6", className)}
        onChange={() => (dirty.current = true)}
        onSubmit={(e) => {
          e.preventDefault();
          // Knappen som skickade formuläret följer med, så att den kan bära ett eget värde.
          const button = (e.nativeEvent as SubmitEvent).submitter;
          setSubmitter(button?.dataset.submit === "secondary" ? "secondary" : "primary");
          const fd = new FormData(e.currentTarget, button);
          dirty.current = false;
          startTransition(() => formAction(fd));
        }}
        noValidate
      >
        <FormStatus />
        {version !== undefined && <input type="hidden" name="updated_at" value={version} />}
        {/* Nyckeln sitter på fälten och inte på formuläret, så att statusraden ("Sparat …") står kvar när sparningen ger en ny version. */}
        <Fragment key={version}>{children}</Fragment>
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-5",
            stickyFooter && "sticky bottom-0 z-10 -mx-1 bg-paper/90 px-1 pb-4 backdrop-blur",
          )}
        >
          <div className="flex flex-wrap items-center gap-2">{footer}</div>
          {/* Knappen som ligger först i koden är den som Enter i ett fält väljer: huvudknappen, eller den andra knappen med
              secondaryFirst. På skärmen står huvudknappen alltid till höger. */}
          <div className={cn("flex flex-wrap items-center gap-2", !secondaryFirst && "flex-row-reverse")}>
            {secondaryFirst && secondaryButton}
            <SubmitButton label={submitLabel} name={submitValue?.name} value={submitValue?.value} />
            {!secondaryFirst && secondaryButton}
          </div>
        </div>
      </form>
    </FormCtx>
  );
}

function FormStatus() {
  const { state } = useFormCtx();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.error || state.ok) ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [state]);
  if (!state.error && !state.ok) return null;
  return (
    <div
      ref={ref}
      role={state.error ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm",
        state.error ? "border-red/30 bg-red/[0.06] text-red-dark" : "border-emerald-600/25 bg-emerald-600/[0.07] text-emerald-900",
      )}
    >
      {state.ok && <Check size={18} className="mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className="font-semibold">{state.error ?? state.message}</p>
        {state.data?.password && (
          <p className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-ink/70">{state.data.email}</span>
            <code className="select-all rounded-lg bg-white px-2.5 py-1 font-mono text-base text-ink ring-1 ring-ink/10">{state.data.password}</code>
          </p>
        )}
      </div>
    </div>
  );
}

export function SubmitButton({
  label = "Spara",
  className,
  kind = "primary",
  name,
  value,
}: {
  label?: string;
  className?: string;
  kind?: SubmitKind;
  name?: string;
  value?: string;
}) {
  const { pending, submitter } = useFormCtx();
  const primary = kind === "primary";
  return (
    <button
      type="submit"
      name={name}
      value={value}
      data-submit={kind}
      disabled={pending}
      className={cn(primary ? "btn btn-red min-w-36" : "btn btn-ghost bg-white", "disabled:opacity-70", className)}
    >
      {pending && submitter === kind ? (
        <>
          <span className={cn("size-4 animate-spin rounded-full border-2", primary ? "border-white/40 border-t-white" : "border-ink/20 border-t-ink")} aria-hidden />
          Sparar…
        </>
      ) : (
        label
      )}
    </button>
  );
}

export function FieldError({ name }: { name: string }) {
  const { state } = useFormCtx();
  const msg = state.fieldErrors?.[name];
  if (!msg) return null;
  return (
    <p className="mt-1.5 text-sm font-medium text-red-deep" id={`${name}-error`}>
      {msg}
    </p>
  );
}
