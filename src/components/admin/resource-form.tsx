import { saveResource } from "@/app/admin/_actions/resources";
import { fileLabel, LAST_TERM, RESOURCE_CATEGORIES, RESOURCE_PROGRAMS, termLabel, TERMS } from "@/lib/resources";
import type { ResourceItem } from "@/lib/types";
import { ActionForm } from "./action-form";
import { Field, FormSection, Select, TextInput } from "./fields";

export function ResourceForm({ resource }: { resource?: ResourceItem | null }) {
  return (
    <ActionForm action={saveResource} submitLabel={resource ? "Spara" : "Lägg till hjälpmedel"} resetOnSuccess={!resource} stickyFooter={false}>
      {resource && <input type="hidden" name="id" value={resource.id} />}
      <FormSection title={resource ? "Hjälpmedel" : "Nytt hjälpmedel"} description="Filerna blir offentliga. Lägg bara upp sådant ni får dela.">
        <div className="grid gap-5 @md:grid-cols-2">
          <Field label="Titel" name="title" required>
            <TextInput name="title" defaultValue={resource?.title} placeholder="Formelblad linjär algebra" maxLength={160} />
          </Field>
          <Field label="Kategori" name="category">
            <Select name="category" defaultValue={resource?.category ?? "fusklapp"}>
              {Object.entries(RESOURCE_CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Beskrivning" name="description">
          <TextInput name="description" defaultValue={resource?.description} maxLength={300} />
        </Field>
        <div className="grid gap-5 @md:grid-cols-2">
          <Field label="Program" name="program">
            <Select name="program" defaultValue={resource?.program ?? "kandidat"}>
              {Object.entries(RESOURCE_PROGRAMS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Termin" name="term" hint="Gäller det flera terminer? Välj Hela programmet.">
            <Select name="term" defaultValue={resource?.term ?? ""}>
              <option value="">{termLabel(null)}</option>
              {TERMS.map((t) => (
                <option key={t} value={t}>
                  {termLabel(t)}
                  {t > LAST_TERM.master && " (bara Kandidat)"}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-5 @md:grid-cols-2">
          <Field label={resource?.file ? "Ersätt fil" : "Fil"} name="file" hint="PDF, Word, Excel, PowerPoint, ZIP eller en bild, t.ex. ett foto · max 30 MB, bilder 25 MB">
            <input
              type="file"
              name="file"
              id="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.txt,.zip,.jpg,.jpeg,.png,.webp"
              className="block w-full rounded-xl border border-dashed border-ink/20 bg-paper/50 px-3 py-2.5 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white"
            />
          </Field>
          <Field label="…eller länk" name="url" hint="T.ex. till ett GitHub-repo.">
            <TextInput name="url" type="url" defaultValue={resource?.url} placeholder="https://github.com/…" />
          </Field>
        </div>
        {resource?.file && (
          <div className="flex flex-wrap items-center gap-4 rounded-xl bg-paper px-4 py-3 text-sm">
            <a href={resource.file.href} target="_blank" className="font-semibold text-red-deep hover:underline">
              Nuvarande fil ({fileLabel(resource.file)})
            </a>
            <label className="inline-flex items-center gap-2 text-stone">
              <input type="checkbox" name="remove_file" /> Ta bort filen
            </label>
          </div>
        )}
      </FormSection>
    </ActionForm>
  );
}
