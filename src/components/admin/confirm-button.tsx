"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Formulärknapp som kräver bekräftelse (t.ex. radering). */
export function ConfirmButton({
  action,
  id,
  message,
  children,
  className,
}: {
  action: (fd: FormData) => void | Promise<void>;
  id: number;
  message: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={cn("btn btn-sm border border-red/25 bg-white text-red-deep hover:border-red hover:bg-red/5", className)}>
        {children}
      </button>
    </form>
  );
}
