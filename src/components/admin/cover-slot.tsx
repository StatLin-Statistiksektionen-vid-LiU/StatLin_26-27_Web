"use client";

import { useState, useTransition } from "react";
import { Check } from "@/components/icons";
import type { ImageRef } from "@/lib/types";
import { ImageField } from "./image-field";

/**
 * En bild som sparas så fort den laddats upp eller tagits bort – omslag och loggor på sidan Bilder
 * och i redigeringsläget. save är en server action med id:t redan bundet.
 */
export function CoverSlot({
  name = "image",
  label,
  image,
  save,
  onSaved,
  aspect,
  fit,
  hint,
}: {
  name?: string;
  label: string;
  image: ImageRef | null;
  /** Svarar med { error } när inget sparades (t.ex. utgången session). */
  save: (mediaId: number | null) => Promise<{ error: string } | void>;
  /** Körs när bilden sparats, t.ex. så att galleriet bredvid markerar rätt omslag. */
  onSaved?: (image: ImageRef | null) => void;
  aspect?: string;
  fit?: "cover" | "contain";
  hint?: string;
}) {
  const [status, setStatus] = useState<"saved" | "error" | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  // Ökas för att ladda om fältet med den bild som faktiskt är sparad (efter ett fel eller en ångrad borttagning).
  const [attempt, setAttempt] = useState(0);

  const onChange = (next: ImageRef | null) => {
    setStatus(null);
    // Bilden raderas när den inte används längre, så en borttagning får bekräftas.
    if (!next && !confirm("Ta bort bilden? Den raderas från sajten.")) {
      setAttempt((n) => n + 1);
      return;
    }
    startTransition(async () => {
      try {
        const res = await save(next?.id ?? null);
        if (res && "error" in res) {
          // Inget sparades – fältet laddas om med den bild som faktiskt är sparad.
          setFailure(res.error);
          setStatus("error");
          setAttempt((n) => n + 1);
          return;
        }
        setStatus("saved");
        onSaved?.(next);
      } catch {
        setFailure(null);
        setStatus("error");
        setAttempt((n) => n + 1);
      }
    });
  };

  return (
    <div>
      {/* Nyckeln följer den sparade bilden, så att ett omslag som byts någon annanstans (stjärnan i galleriet) syns här. */}
      <ImageField
        key={`${image?.src ?? "ingen"}-${attempt}`}
        name={name}
        label={label}
        defaultImage={image}
        onChange={onChange}
        aspect={aspect}
        fit={fit}
        hint={hint}
      />
      <p role="status" className="mt-1.5 min-h-5 text-[0.82rem] font-semibold">
        {pending ? (
          <span className="text-stone">Sparar…</span>
        ) : status === "saved" ? (
          <span className="inline-flex items-center gap-1 text-emerald-700">
            <Check size={14} /> Sparat
          </span>
        ) : status === "error" ? (
          <span className="text-red-deep">Det gick inte att spara. {failure ?? "Ladda om sidan och försök igen."}</span>
        ) : null}
      </p>
    </div>
  );
}
