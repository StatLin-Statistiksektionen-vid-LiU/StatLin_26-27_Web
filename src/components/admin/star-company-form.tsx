import { saveStarCompany } from "@/app/admin/_actions/naringsliv";
import { COMPANY_ROLE_LABELS, COMPANY_ROLES, parseSeeks, SEEK_KINDS, SEEK_LABELS, type StarCompany } from "@/lib/naringsliv";
import { ActionForm } from "./action-form";
import { Field, FormSection, Select, TextInput, Toggle } from "./fields";
import { ImageField } from "./image-field";

export function StarCompanyForm({ company, nextOrder = 0 }: { company?: StarCompany | null; nextOrder?: number }) {
  const seeks = company ? parseSeeks(company.seeks) : [];
  return (
    <ActionForm action={saveStarCompany} submitLabel={company ? "Spara" : "Lägg till företag"} stickyFooter={false}>
      {company && <input type="hidden" name="id" value={company.id} />}
      <FormSection title={company ? "Företag" : "Nytt företag"}>
        <Field label="Företag" name="name" required>
          <TextInput name="name" defaultValue={company?.name} maxLength={120} />
        </Field>
        <Field label="Webbplats" name="url">
          <TextInput name="url" type="url" defaultValue={company?.url} placeholder="https://" />
        </Field>
        <Field label="Kort text" name="description">
          <TextInput name="description" defaultValue={company?.description} maxLength={300} />
        </Field>
        <fieldset>
          <legend className="mb-2 block text-sm font-semibold">Söker</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {SEEK_KINDS.map((k) => (
              <label key={k} className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" name="seeks" value={k} defaultChecked={seeks.includes(k)} className="size-4 accent-red" />
                {SEEK_LABELS[k]}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Roll" name="role">
            <Select name="role" defaultValue={company?.role ?? "utstallare"}>
              {COMPANY_ROLES.map((r) => (
                <option key={r} value={r}>
                  {COMPANY_ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Sortering" name="sort_order">
            <TextInput name="sort_order" type="number" min={0} defaultValue={company?.sort_order ?? nextOrder} />
          </Field>
        </div>
        <ImageField name="logo_media_id" label="Logga" defaultImage={company?.logo ?? null} aspect="aspect-[3/1]" fit="contain" />
        <Toggle name="active" label="Visas på STAR-sidan" defaultChecked={company ? !!company.active : true} />
      </FormSection>
    </ActionForm>
  );
}
