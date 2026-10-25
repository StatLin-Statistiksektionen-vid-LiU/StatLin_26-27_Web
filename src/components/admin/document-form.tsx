import { saveDocument } from "@/app/admin/_actions/content";
import { ActionForm } from "./action-form";
import { Field, FormSection, Select, TextInput, Toggle } from "./fields";
import { DOCUMENT_CATEGORIES, type DocumentItem } from "@/lib/types";
import { formatBytes } from "@/lib/utils";

export function DocumentForm({ doc }: { doc?: DocumentItem | null }) {
  return (
    <ActionForm action={saveDocument} submitLabel={doc ? "Spara" : "Lägg till dokument"} resetOnSuccess={!doc} stickyFooter={false}>
      {doc && <input type="hidden" name="id" value={doc.id} />}
      <FormSection title={doc ? "Dokument" : "Nytt dokument"}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Titel" name="title" required>
            <TextInput name="title" defaultValue={doc?.title} placeholder="Protokoll sektionsmöte HT26" maxLength={160} />
          </Field>
          <Field label="Kategori" name="category">
            <Select name="category" defaultValue={doc?.category ?? "protokoll"}>
              {Object.entries(DOCUMENT_CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-[1fr_12rem]">
          <Field label="Beskrivning" name="description">
            <TextInput name="description" defaultValue={doc?.description} maxLength={300} />
          </Field>
          <Field label="Datum" name="doc_date">
            <TextInput name="doc_date" type="date" defaultValue={doc?.doc_date ?? ""} />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={doc?.file ? "Ersätt fil" : "Fil"} name="file" hint="PDF, Word, Excel, PowerPoint m.fl. · max 30 MB">
            <input
              type="file"
              name="file"
              id="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.txt,.zip"
              className="block w-full rounded-xl border border-dashed border-ink/20 bg-paper/50 px-3 py-2.5 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white"
            />
          </Field>
          <Field label="…eller länk" name="url" hint="T.ex. till en delad mapp.">
            <TextInput name="url" type="url" defaultValue={doc?.url} placeholder="https://" />
          </Field>
        </div>
        {doc?.file && (
          <div className="flex flex-wrap items-center gap-4 rounded-xl bg-paper px-4 py-3 text-sm">
            <a href={doc.file.href} target="_blank" className="font-semibold text-red-deep hover:underline">
              Nuvarande fil ({doc.file.ext.toUpperCase()}, {formatBytes(doc.file.size)})
            </a>
            <label className="inline-flex items-center gap-2 text-stone">
              <input type="checkbox" name="remove_file" /> Ta bort filen
            </label>
          </div>
        )}
        <Toggle name="published" label="Publicerad" defaultChecked={doc ? !!doc.published : true} />
      </FormSection>
    </ActionForm>
  );
}
