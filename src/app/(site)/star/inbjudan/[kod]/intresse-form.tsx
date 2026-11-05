"use client";

import { unstable_rethrow } from "next/navigation";
import { startTransition, useActionState, type ReactNode } from "react";
import { ArrowRight } from "@/components/icons";
import type { FormState } from "@/lib/admin/form";
import { INTRESSE_MAX, intresseFelText, type IntresseFel } from "@/lib/star-intresse";
import { cn } from "@/lib/utils";
import { submitStarInterest } from "./actions";

const NO_STATE: FormState = {};
const inputClass =
  "w-full rounded-xl border border-white/25 bg-white/[0.07] px-4 py-3 text-white outline-none transition-colors placeholder:text-white/55 focus:border-white focus:ring-4 focus:ring-white/15 aria-[invalid=true]:border-white";

function Falt({ id, label, valfritt, fel, children }: { id: string; label: string; valfritt?: boolean; fel?: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">
        {label} {valfritt && <span className="font-normal text-white/75">(valfritt)</span>}
      </label>
      {children}
      {fel && (
        <p id={`${id}-fel`} className="mt-1.5 text-sm font-semibold">
          {fel}
        </p>
      )}
    </div>
  );
}

/**
 * Intresseanmälan. Fungerar utan JavaScript: actionen ligger direkt på formuläret, felet kommer då tillbaka i adressen, och mötesfältet
 * öppnas med CSS. Med JavaScript skickas det via onSubmit, för annars tömmer React alla fält när servern svarar med ett fel.
 */
export function IntresseForm({ kod, serverFel }: { kod: string; serverFel?: IntresseFel }) {
  // Utan JavaScript går posten direkt till actionen.
  const [, serverAction] = useActionState(submitStarInterest, NO_STATE);
  // Med JavaScript fångas ett tappat nät här, så att det inte tar hela sidan med sig. Det besökaren har skrivit ligger kvar i fälten.
  const [state, action, pending] = useActionState(async (prev: FormState, data: FormData): Promise<FormState> => {
    try {
      return await submitStarInterest(prev, data);
    } catch (err) {
      unstable_rethrow(err);
      console.error(err);
      return { error: "Det gick inte att nå servern. Det du har skrivit finns kvar, så försök igen om en stund." };
    }
  }, NO_STATE);
  const fel = state.fieldErrors ?? {};
  const beskrivning = (id: string, namn: string) => (fel[namn] ? { "aria-invalid": true as const, "aria-describedby": `${id}-fel` } : {});
  const allmantFel = state.error ?? (serverFel ? intresseFelText(serverFel) : undefined);

  return (
    <form
      action={serverAction}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
      className="space-y-5"
    >
      <input type="hidden" name="kod" value={kod} />
      {allmantFel && (
        <p role="alert" className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-red-dark">
          {allmantFel}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Falt id="intresse-foretag" label="Företag" fel={fel.foretag}>
          <input id="intresse-foretag" name="foretag" required maxLength={INTRESSE_MAX.foretag} autoComplete="organization" className={inputClass} {...beskrivning("intresse-foretag", "foretag")} />
        </Falt>
        <Falt id="intresse-namn" label="Ditt namn" fel={fel.kontakt_namn}>
          <input id="intresse-namn" name="kontakt_namn" required maxLength={INTRESSE_MAX.namn} autoComplete="name" className={inputClass} {...beskrivning("intresse-namn", "kontakt_namn")} />
        </Falt>
        <Falt id="intresse-epost" label="E-post" fel={fel.epost}>
          <input id="intresse-epost" name="epost" type="email" required maxLength={200} autoComplete="email" inputMode="email" className={inputClass} {...beskrivning("intresse-epost", "epost")} />
        </Falt>
        <Falt id="intresse-telefon" label="Telefon" valfritt fel={fel.telefon}>
          <input id="intresse-telefon" name="telefon" type="tel" maxLength={INTRESSE_MAX.telefon} autoComplete="tel" className={inputClass} {...beskrivning("intresse-telefon", "telefon")} />
        </Falt>
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold">Hur långt har ni kommit?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["med", "Vi vill vara med"],
              ["mer", "Vi vill veta mer först"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="flex cursor-pointer items-center justify-center rounded-xl border border-white/25 bg-white/[0.04] px-4 py-3 text-center font-semibold transition-colors hover:border-white/60 has-[:checked]:border-white has-[:checked]:bg-white has-[:checked]:text-star-navy has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-white"
            >
              <input type="radio" name="val" value={value} defaultChecked={value === "med"} className="sr-only" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="group/mote rounded-xl border border-white/25 bg-white/[0.04] transition-colors has-[:checked]:border-white/60">
        <label className="flex cursor-pointer items-start gap-3 p-4">
          <input type="checkbox" name="vill_boka_mote" className="mt-0.5 size-5 shrink-0 accent-[var(--color-red)]" />
          <span>
            <span className="block font-semibold">Vi vill boka ett möte</span>
            <span className="mt-0.5 block text-sm text-white/80">Prata vidare med SASU eller styrelsen, på plats eller digitalt.</span>
          </span>
        </label>
        {/* Öppnas med CSS, så att det fungerar utan JavaScript. Dolt fält går inte att nå med tangentbordet. */}
        <div className="invisible grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 group-has-[:checked]/mote:visible group-has-[:checked]/mote:grid-rows-[1fr] motion-reduce:transition-none">
          <div className="min-h-0 overflow-hidden">
            <div className="px-4 pb-4">
              <Falt id="intresse-mote" label="När passar det?" valfritt fel={fel.moteforslag}>
                <input
                  id="intresse-mote"
                  name="moteforslag"
                  maxLength={INTRESSE_MAX.mote}
                  placeholder="Till exempel tisdagar efter lunch"
                  className={inputClass}
                  {...beskrivning("intresse-mote", "moteforslag")}
                />
              </Falt>
            </div>
          </div>
        </div>
      </div>

      <Falt id="intresse-meddelande" label="Något vi bör veta?" valfritt fel={fel.meddelande}>
        <textarea
          id="intresse-meddelande"
          name="meddelande"
          rows={3}
          maxLength={INTRESSE_MAX.meddelande}
          placeholder="Till exempel om ni söker exjobbare, sommarjobbare eller nyanställda"
          className={cn(inputClass, "resize-y")}
          {...beskrivning("intresse-meddelande", "meddelande")}
        />
      </Falt>

      {/* Honungsfälla: dold för människor och skärmläsare, men en bot fyller i den. */}
      <div className="absolute left-[-9999px] top-auto size-px overflow-hidden" aria-hidden>
        <label htmlFor="intresse-webbplats">Lämna tomt</label>
        <input id="intresse-webbplats" name="webbplats" tabIndex={-1} autoComplete="off" />
      </div>

      <button type="submit" disabled={pending} className="btn btn-red w-full disabled:opacity-60">
        {pending ? "Skickar …" : "Skicka intresseanmälan"} {!pending && <ArrowRight size={18} />}
      </button>
      <p className="text-sm leading-relaxed text-white/80">
        Anmälan är inte bindande. Uppgifterna går till SASU och används bara för att svara er.{" "}
        <a href="/integritet" className="underline underline-offset-2 hover:text-white">
          Så hanterar vi uppgifter
        </a>
      </p>
    </form>
  );
}
