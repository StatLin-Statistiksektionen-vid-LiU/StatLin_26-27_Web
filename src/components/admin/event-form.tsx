import { saveEvent } from "@/app/admin/_actions/events";
import { ActionForm } from "./action-form";
import { Field, FormSection, Select, TextArea, TextInput, TitleSlugFields, Toggle } from "./fields";
import { ImageField } from "./image-field";
import { MarkdownEditor } from "./markdown-editor";
import type { Committee, EventItem, SessionUser } from "@/lib/types";

export function EventForm({
  event,
  committees,
  user,
  defaultStart,
}: {
  event?: EventItem | null;
  committees: Committee[];
  user: SessionUser;
  defaultStart: string;
}) {
  const lockedCommittee = user.role === "committee";
  return (
    <ActionForm action={saveEvent} submitLabel={event ? "Spara ändringar" : "Skapa evenemang"}>
      {event && <input type="hidden" name="id" value={event.id} />}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <FormSection title="Grunduppgifter">
            <TitleSlugFields defaultTitle={event?.title} defaultSlug={event?.slug} basePath="/evenemang" titleMaxLength={140} />
            <Field label="Kort sammanfattning" name="summary" hint="Visas på evenemangskort och i delningar. 1–2 meningar.">
              <TextArea name="summary" defaultValue={event?.summary} rows={2} maxLength={300} />
            </Field>
            <MarkdownEditor name="body_md" label="Beskrivning" defaultValue={event?.body_md} />
          </FormSection>

          <FormSection title="Tid och plats">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Start" name="starts_at" required>
                <TextInput type="datetime-local" name="starts_at" defaultValue={event?.starts_at ?? defaultStart} required />
              </Field>
              <Field label="Slut" name="ends_at" hint="Valfritt.">
                <TextInput type="datetime-local" name="ends_at" defaultValue={event?.ends_at ?? ""} />
              </Field>
            </div>
            <Toggle name="all_day" label="Heldag" defaultChecked={!!event?.all_day} hint="Visar inget klockslag." />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Plats" name="location">
                <TextInput name="location" defaultValue={event?.location} placeholder="Kårallen, Campus Valla" maxLength={160} />
              </Field>
              <Field label="Kartlänk" name="location_url" hint="Lämna tomt för automatisk Google Maps-länk.">
                <TextInput name="location_url" type="url" defaultValue={event?.location_url} placeholder="https://" />
              </Field>
            </div>
          </FormSection>

          <FormSection title="Anmälan och pris">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Anmälningslänk" name="signup_url" hint="T.ex. ett Google-formulär.">
                <TextInput name="signup_url" type="url" defaultValue={event?.signup_url} placeholder="https://" />
              </Field>
              <Field label="Pris" name="price">
                <TextInput name="price" defaultValue={event?.price} placeholder="Gratis / 295 kr" maxLength={80} />
              </Field>
            </div>
          </FormSection>
        </div>

        <div className="space-y-6">
          <FormSection title="Publicering">
            <Toggle name="published" label="Publicerad" defaultChecked={event ? !!event.published : true} hint="Avmarkera för att spara som utkast." />
            <Field label="Arrangör" name="committee_id" hint={lockedCommittee ? "Ditt konto kan bara skapa evenemang för ditt utskott." : undefined}>
              <Select name="committee_id" defaultValue={String(event?.committee_id ?? user.committee_id ?? "")} disabled={lockedCommittee}>
                {!lockedCommittee && <option value="">Ingen / hela sektionen</option>}
                {committees.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.short_name} – {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          </FormSection>
          <FormSection title="Omslagsbild" description="Utan bild genereras ett omslag i utskottets färger.">
            <ImageField name="cover_media_id" label="Bild" defaultImage={event?.cover ?? null} />
          </FormSection>
        </div>
      </div>
    </ActionForm>
  );
}
