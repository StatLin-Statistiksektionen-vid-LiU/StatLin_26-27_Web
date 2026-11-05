import { saveStarCompany } from "@/app/admin/_actions/naringsliv";
import { COMPANY_ROLE_LABELS, COMPANY_ROLES, parseSeeks, SEEK_KINDS, SEEK_LABELS, type StarCompany } from "@/lib/naringsliv";
import { cn } from "@/lib/utils";
import { ActionForm } from "./action-form";
import { Field, FormSection, Select, TextInput, Toggle } from "./fields";
import { ImageField } from "./image-field";

/** Ett nytt företag hamnar sist och syns direkt. Plats i listan och om det syns väljs först när det finns, om det alls behövs. */
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
          <div className="flex flex-wrap gap-x-5 gap-y-2 pointer-coarse:gap-y-0">
            {SEEK_KINDS.map((k) => (
              <label key={k} className="flex cursor-pointer items-center gap-2 text-sm pointer-coarse:py-3">
                <input type="checkbox" name="seeks" value={k} defaultChecked={seeks.includes(k)} className="size-4 accent-red" />
                {SEEK_LABELS[k]}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="@container">
          <div className={cn("grid gap-5", company && "@sm:grid-cols-2")}>
            <Field label="Roll" name="role">
              <Select name="role" defaultValue={company?.role ?? "utstallare"}>
                {COMPANY_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {COMPANY_ROLE_LABELS[r]}
                  </option>
                ))}
              </Select>
            </Field>
            {company && (
              <Field label="Plats i listan" name="sort_order" hint="Lägre tal visas först.">
                <TextInput name="sort_order" type="number" min={0} defaultValue={company.sort_order} />
              </Field>
            )}
          </div>
        </div>
        <ImageField name="logo_media_id" label="Logga" defaultImage={company?.logo ?? null} aspect="aspect-[3/1]" fit="contain" />
        {company ? (
          <Toggle name="active" label="Visas på STAR-sidan" defaultChecked={!!company.active} />
        ) : (
          <>
            <input type="hidden" name="sort_order" value={nextOrder} />
            <input type="hidden" name="active" value="on" />
          </>
        )}
      </FormSection>
    </ActionForm>
  );
}
