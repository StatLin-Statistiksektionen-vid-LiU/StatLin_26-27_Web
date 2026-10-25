"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef, type ReactNode } from "react";
import { Check } from "@/components/icons";
import type { FormState } from "@/lib/admin/form";
import { cn } from "@/lib/utils";

const FormCtx = createContext<{ state: FormState; pending: boolean }>({ state: {}, pending: false });
export const useFormCtx = () => useContext(FormCtx);

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
  footer,
  stickyFooter = true,
  resetOnSuccess,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  children: ReactNode;
  className?: string;
  submitLabel?: string;
  footer?: ReactNode;
  stickyFooter?: boolean;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  const dirty = useRef(false);

  useEffect(() => {
    if (state.ok) {
      dirty.current = false;
      if (resetOnSuccess) formRef.current?.reset();
    }
  }, [state, resetOnSuccess]);

  // Varna innan man lämnar sidan med osparade ändringar.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  return (
    <FormCtx value={{ state, pending }}>
      <form
        ref={formRef}
        className={cn("space-y-6", className)}
        onChange={() => (dirty.current = true)}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          dirty.current = false;
          startTransition(() => formAction(fd));
        }}
        noValidate
      >
        <FormStatus />
        {children}
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-5",
            stickyFooter && "sticky bottom-0 z-10 -mx-1 bg-paper/90 px-1 pb-4 backdrop-blur",
          )}
        >
          <div className="flex flex-wrap items-center gap-2">{footer}</div>
          <SubmitButton label={submitLabel} />
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

export function SubmitButton({ label = "Spara", className }: { label?: string; className?: string }) {
  const { pending } = useFormCtx();
  return (
    <button type="submit" disabled={pending} className={cn("btn btn-red min-w-36 disabled:opacity-70", className)}>
      {pending ? (
        <>
          <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />
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
