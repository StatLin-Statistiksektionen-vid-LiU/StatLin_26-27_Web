import { savePartner } from "@/app/admin/_actions/content";
import { ActionForm } from "./action-form";
import { Field, FormSection, Select, TextInput, Toggle } from "./fields";
import { ImageField } from "./image-field";
import type { Partner } from "@/lib/types";

export function PartnerForm({ partner, nextOrder = 0 }: { partner?: Partner | null; nextOrder?: number }) {
  return (
    <ActionForm action={savePartner} submitLabel={partner ? "Spara" : "Lägg till partner"} stickyFooter={false}>
      {partner && <input type="hidden" name="id" value={partner.id} />}
      <FormSection title={partner ? "Partner" : "Ny partner"}>
        <Field label="Företag" name="name" required>
          <TextInput name="name" defaultValue={partner?.name} maxLength={120} />
        </Field>
        <Field label="Webbplats" name="url">
          <TextInput name="url" type="url" defaultValue={partner?.url} placeholder="https://" />
        </Field>
        <Field label="Beskrivning" name="description">
          <TextInput name="description" defaultValue={partner?.description} maxLength={300} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nivå" name="tier">
            <Select name="tier" defaultValue={partner?.tier ?? "partner"}>
              <option value="partner">Partner</option>
              <option value="huvudpartner">Huvudpartner</option>
            </Select>
          </Field>
          <Field label="Sortering" name="sort_order">
            <TextInput name="sort_order" type="number" min={0} defaultValue={partner?.sort_order ?? nextOrder} />
          </Field>
        </div>
        <ImageField name="logo_media_id" label="Logga" defaultImage={partner?.logo ?? null} aspect="aspect-[3/1]" fit="contain" />
        <Toggle name="active" label="Visas på sajten" defaultChecked={partner ? !!partner.active : true} />
      </FormSection>
    </ActionForm>
  );
}
