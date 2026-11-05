"use client";

import { saveBox } from "@/app/admin/_actions/fragelada";
import { ActionForm } from "@/components/admin/action-form";
import { Field, TextArea, TextInput } from "@/components/admin/fields";

type Box = { id: number; slug: string | null; title: string; description: string; closes_on: string | null; updated_at: string };

/** Ny låda, och ändring av en befintlig. En fast låda är alltid öppen och har inget stängningsdatum. */
export function BoxForm({ box }: { box?: Box }) {
  return (
    <ActionForm action={saveBox} version={box?.updated_at} submitLabel={box ? "Spara" : "Skapa låda"} stickyFooter={false} className="max-w-2xl space-y-5">
      {box && <input type="hidden" name="id" value={box.id} />}
      <Field label="Titel" name="title" required hint="Syns för den som skriver, till exempel kursens namn.">
        <TextInput name="title" maxLength={80} defaultValue={box?.title} required />
      </Field>
      <Field label="Beskrivning" name="description" hint="Valfri. Vad vill du ha frågor om?">
        <TextArea name="description" maxLength={300} defaultValue={box?.description} />
      </Field>
      {!box?.slug && (
        <Field label="Stängningsdatum" name="closes_on" hint="Valfritt. Sista dagen lådan tar emot frågor.">
          <TextInput type="date" name="closes_on" defaultValue={box?.closes_on ?? ""} />
        </Field>
      )}
    </ActionForm>
  );
}
