import { saveEvent } from "@/app/admin/_actions/events";
import { ActionForm } from "./action-form";
import { Field, FixedCommittee, FormSection, MoreDetails, Select, TextArea, TextInput, TitleSlugFields, Toggle } from "./fields";
import { ImageField } from "./image-field";
import { MarkdownEditor } from "./markdown-editor";
import { publishButtons } from "./publish-buttons";
import type { Committee, EventItem, SessionUser } from "@/lib/types";

export function EventForm({
  event,
  committees,
  user,
  defaultStart,
  onSaved,
}: {
  event?: EventItem | null;
  committees: Committee[];
  user: Pick<SessionUser, "role" | "committee_id">;
  defaultStart: string;
  /** Redigeringspanelen på sajten stänger sig efter en sparning. */
  onSaved?: () => void;
}) {
  const lockedCommittee = user.role === "committee";
  const own = committees.find((c) => c.id === (event?.committee_id ?? user.committee_id));
  const hasDetails = !!(event?.ends_at || event?.all_day || event?.location_url || event?.signup_url || event?.price);
  return (
    <ActionForm action={saveEvent} {...publishButtons(event)} onSuccess={onSaved}>
      {event && <input type="hidden" name="id" value={event.id} />}
      <div className="grid gap-6 @2xl:grid-cols-3">
        <div className="space-y-6 @2xl:col-span-2">
          <FormSection title="Evenemanget">
            <TitleSlugFields defaultTitle={event?.title} defaultSlug={event?.slug} basePath="/evenemang" titleMaxLength={140} />
            <div className="grid gap-5 @md:grid-cols-2">
              <Field label="Datum och tid" name="starts_at" required>
                <TextInput type="datetime-local" name="starts_at" defaultValue={event?.starts_at ?? defaultStart} required />
              </Field>
              <Field label="Plats" name="location">
                <TextInput name="location" defaultValue={event?.location} placeholder="Kårallen, Campus Valla" maxLength={160} />
              </Field>
            </div>
            <Field label="Kort sammanfattning" name="summary" hint="Visas på evenemangskort och i delningar. 1–2 meningar.">
              <TextArea name="summary" defaultValue={event?.summary} rows={2} maxLength={300} />
            </Field>
            <MarkdownEditor name="body_md" label="Beskrivning" defaultValue={event?.body_md} />
          </FormSection>

          <MoreDetails
            summary="Sluttid, heldag, kartlänk, anmälan och pris."
            fields={["ends_at", "all_day", "location_url", "signup_url", "price"]}
            defaultOpen={hasDetails}
          >
            <div className="grid gap-5 @md:grid-cols-2">
              <Field label="Slut" name="ends_at" hint="Valfritt.">
                <TextInput type="datetime-local" name="ends_at" defaultValue={event?.ends_at ?? ""} />
              </Field>
              <div className="@md:pt-8">
                <Toggle name="all_day" label="Heldag" defaultChecked={!!event?.all_day} hint="Visar inget klockslag." />
              </div>
            </div>
            <Field label="Kartlänk" name="location_url" hint="Lämna tomt för automatisk Google Maps-länk.">
              <TextInput name="location_url" type="url" defaultValue={event?.location_url} placeholder="https://" />
            </Field>
            <div className="grid gap-5 @md:grid-cols-2">
              <Field label="Anmälningslänk" name="signup_url" hint="T.ex. ett Google-formulär.">
                <TextInput name="signup_url" type="url" defaultValue={event?.signup_url} placeholder="https://" />
              </Field>
              <Field label="Pris" name="price">
                <TextInput name="price" defaultValue={event?.price} placeholder="Gratis / 295 kr" maxLength={80} />
              </Field>
            </div>
          </MoreDetails>
        </div>

        <div className="space-y-6">
          <FormSection title="Omslagsbild" description="Utan bild genereras ett omslag i utskottets färger.">
            <ImageField name="cover_media_id" label="Bild" defaultImage={event?.cover ?? null} />
          </FormSection>
          <FormSection title="Arrangör">
            {lockedCommittee ? (
              <FixedCommittee label="Utskott" name={own ? `${own.short_name} – ${own.name}` : "Ditt utskott"} hint="Evenemanget visas på er utskottssida och i kalendern." />
            ) : (
              <Field label="Utskott" name="committee_id">
                <Select name="committee_id" defaultValue={String(event?.committee_id ?? user.committee_id ?? "")}>
                  <option value="">Ingen / hela sektionen</option>
                  {committees.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.short_name} – {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          </FormSection>
        </div>
      </div>
    </ActionForm>
  );
}
