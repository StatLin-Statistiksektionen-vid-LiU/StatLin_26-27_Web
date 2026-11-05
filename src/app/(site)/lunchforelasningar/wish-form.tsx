"use client";

import { useActionState } from "react";
import { Star } from "@/components/icons";
import type { FormState } from "@/lib/admin/form";
import { WISH_COMMENT_MAX, WISH_TITLE_MAX } from "@/lib/naringsliv";
import { submitWish } from "./actions";

const NO_STATE: FormState = {};
const inputClass =
  "w-full rounded-xl border border-white/25 bg-white/[0.07] px-4 py-3 text-white outline-none transition placeholder:text-white/55 focus:border-white focus:ring-4 focus:ring-white/15";

/** Formuläret skickas också utan JavaScript: actionen ligger direkt på formuläret, och felet kommer då tillbaka i adressen. */
export function WishForm() {
  const [state, action, pending] = useActionState(submitWish, NO_STATE);
  const titleError = state.fieldErrors?.title;
  const commentError = state.fieldErrors?.comment;
  return (
    <form action={action} className="mt-6 space-y-4">
      {state.error && (
        <p role="alert" className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-red-dark">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="onskan-titel" className="mb-1.5 block text-sm font-semibold">
          Ämne, företag eller person
        </label>
        <input
          id="onskan-titel"
          name="title"
          required
          maxLength={WISH_TITLE_MAX}
          placeholder="Hur prissätter man risk med maskininlärning?"
          aria-invalid={titleError ? true : undefined}
          aria-describedby={titleError ? "onskan-titel-fel" : undefined}
          className={inputClass}
        />
        {titleError && (
          <p id="onskan-titel-fel" className="mt-1.5 text-sm font-semibold">
            {titleError}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="onskan-kommentar" className="mb-1.5 block text-sm font-semibold">
          Kommentar <span className="font-normal text-white/70">(valfri)</span>
        </label>
        <textarea
          id="onskan-kommentar"
          name="comment"
          rows={3}
          maxLength={WISH_COMMENT_MAX}
          placeholder="Varför just det här?"
          aria-invalid={commentError ? true : undefined}
          aria-describedby={commentError ? "onskan-kommentar-fel" : undefined}
          className={`${inputClass} resize-y`}
        />
        {commentError && (
          <p id="onskan-kommentar-fel" className="mt-1.5 text-sm font-semibold">
            {commentError}
          </p>
        )}
      </div>
      {/* Honungsfälla: dold för människor och skärmläsare, men en bot fyller i den. */}
      <div className="absolute left-[-9999px] top-auto size-px overflow-hidden" aria-hidden>
        <label htmlFor="onskan-webbplats">Lämna tomt</label>
        <input id="onskan-webbplats" name="webbplats" tabIndex={-1} autoComplete="off" />
      </div>
      <button type="submit" disabled={pending} className="btn btn-light w-full disabled:opacity-60">
        <Star size={18} /> {pending ? "Skickar …" : "Skicka önskemålet"}
      </button>
    </form>
  );
}
