import { saveLink } from "@/app/admin/_actions/links";
import { LINK_CATEGORIES, LINK_ICONS } from "@/lib/links";
import type { LinkItem } from "@/lib/types";
import { ActionForm } from "./action-form";
import { Field, FormSection, Select, TextInput, Toggle } from "./fields";

export function LinkForm({ link, nextOrder = 0 }: { link?: LinkItem | null; nextOrder?: number }) {
  return (
    <ActionForm action={saveLink} submitLabel={link ? "Spara" : "Lägg till länk"} stickyFooter={false}>
      {link && <input type="hidden" name="id" value={link.id} />}
      <FormSection title={link ? "Länk" : "Ny länk"}>
        <Field label="Namn" name="label" required>
          <TextInput name="label" defaultValue={link?.label} maxLength={80} />
        </Field>
        <Field label="Adress" name="url" required hint="En hel adress (https://…) eller en sida på sajten, till exempel /tentastatistik.">
          <TextInput name="url" defaultValue={link?.url} placeholder="https://" maxLength={500} />
        </Field>
        <Field label="Beskrivning" name="description" hint="En kort rad under namnet.">
          <TextInput name="description" defaultValue={link?.description} maxLength={160} />
        </Field>
        <Field label="Sökord" name="keywords" hint="Andra ord som ska hitta länken, till exempel timeedit kalender.">
          <TextInput name="keywords" defaultValue={link?.keywords} maxLength={200} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Grupp" name="category">
            <Select name="category" defaultValue={link?.category ?? "studier"}>
              {LINK_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ikon" name="icon" hint="Syns när länken är en genväg.">
            <Select name="icon" defaultValue={link?.icon ?? "link"}>
              {LINK_ICONS.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Sortering" name="sort_order" hint="Lägre nummer visas först.">
          <TextInput name="sort_order" type="number" min={0} defaultValue={link?.sort_order ?? nextOrder} />
        </Field>
        <Toggle
          name="featured"
          label="Genväg"
          hint="Visas som en stor knapp överst på länksidan och i raden Genvägar på startsidan och studentsidorna."
          defaultChecked={!!link?.featured}
        />
        <Toggle name="active" label="Visas på sajten" defaultChecked={link ? !!link.active : true} />
      </FormSection>
    </ActionForm>
  );
}
