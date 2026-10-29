"use client";

import { useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { FieldError, useFormCtx } from "./action-form";
import { cn, slugify, slugifyWhileTyping } from "@/lib/utils";

const inputBase =
  "w-full rounded-xl border border-ink/15 bg-white px-3.5 py-2.5 text-[0.95rem] text-ink shadow-[0_1px_0_rgba(0,0,0,0.02)] outline-none transition-[border-color,box-shadow] placeholder:text-ink/35 focus:border-ink focus:ring-4 focus:ring-ink/[0.06] disabled:bg-paper-2 disabled:text-ink/50";

export function Field({
  label,
  name,
  hint,
  children,
  className,
  required,
}: {
  label: string;
  name: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
  required?: boolean;
}) {
  const { state } = useFormCtx();
  const hasError = !!state.fieldErrors?.[name];
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={name} className="mb-1.5 flex items-baseline justify-between gap-3 text-sm font-semibold text-ink">
        <span>
          {label}
          {required && <span className="text-red-deep"> *</span>}
        </span>
      </label>
      <div className={cn(hasError && "field-invalid")}>{children}</div>
      {hint && <p className="mt-1.5 text-[0.82rem] leading-snug text-stone">{hint}</p>}
      <FieldError name={name} />
    </div>
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement> & { name: string }) {
  return <input id={props.name} aria-describedby={`${props.name}-error`} className={cn(inputBase, className)} {...props} />;
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { name: string }) {
  return <textarea id={props.name} className={cn(inputBase, "min-h-24 resize-y leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { name: string }) {
  return (
    <select
      id={props.name}
      className={cn(
        inputBase,
        "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 fill=%22none%22 stroke=%22%230a0a0a%22 stroke-width=%222%22><path d=%22m4 6 4 4 4-4%22/></svg>')] bg-[length:16px] bg-[right_0.9rem_center] bg-no-repeat pr-10",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Toggle({ name, label, defaultChecked, hint, disabled }: { name: string; label: string; defaultChecked?: boolean; hint?: string; disabled?: boolean }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3", disabled && "cursor-not-allowed opacity-60")}>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} disabled={disabled} className="peer sr-only" />
        <span className="h-6 w-11 rounded-full bg-ink/15 transition-colors peer-checked:bg-red peer-focus-visible:ring-4 peer-focus-visible:ring-red/20" />
        <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </span>
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-[0.82rem] text-stone">{hint}</span>}
      </span>
    </label>
  );
}

/** Titel + slug där slug fylls i automatiskt tills man ändrar den själv. */
export function TitleSlugFields({
  defaultTitle = "",
  defaultSlug = "",
  basePath,
  titleLabel = "Titel",
  titleMaxLength = 160,
}: {
  defaultTitle?: string;
  defaultSlug?: string;
  basePath: string;
  titleLabel?: string;
  titleMaxLength?: number;
}) {
  const [title, setTitle] = useState(defaultTitle);
  const [slug, setSlug] = useState(defaultSlug);
  const [touched, setTouched] = useState(!!defaultSlug);
  const shown = touched ? slug : slugify(title);
  return (
    <div className="space-y-2">
      <Field label={titleLabel} name="title" required>
        <TextInput
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="py-3 text-lg font-semibold"
          maxLength={titleMaxLength}
          autoComplete="off"
          required
        />
      </Field>
      <div className="flex items-center gap-1 overflow-hidden text-[0.82rem] text-stone">
        <span className="shrink-0 font-mono">{basePath}/</span>
        <input
          name="slug"
          value={shown}
          onChange={(e) => {
            setTouched(true);
            setSlug(slugifyWhileTyping(e.target.value));
          }}
          onBlur={() => setSlug((s) => slugify(s))}
          aria-label="Adress (slug)"
          className="min-w-0 flex-1 rounded-md bg-transparent px-1 py-0.5 font-mono text-ink outline-none hover:bg-white focus:bg-white focus:ring-2 focus:ring-ink/10"
        />
      </div>
    </div>
  );
}

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.5rem] border border-ink/10 bg-white p-5 md:p-7">
      <div className="mb-5">
        <h2 className="text-base font-bold">{title}</h2>
        {description && <p className="mt-1 text-sm text-stone">{description}</p>}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
