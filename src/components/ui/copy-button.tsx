"use client";

import { useState } from "react";
import { Check } from "@/components/icons";
import { cn } from "@/lib/utils";

export function CopyButton({ value, label, className }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1400);
        } catch {
          /* urklipp ej tillgängligt */
        }
      }}
      className={cn("group inline-flex items-center gap-1.5 font-mono transition-colors", className)}
      aria-label={`Kopiera ${label ?? value}`}
    >
      <span>{label ?? value}</span>
      <span className={cn("transition-opacity", copied ? "opacity-100" : "opacity-0 group-hover:opacity-60")} aria-hidden>
        {copied ? <Check size={13} /> : "⧉"}
      </span>
      <span className="sr-only" aria-live="polite">
        {copied ? "Kopierat" : ""}
      </span>
    </button>
  );
}
