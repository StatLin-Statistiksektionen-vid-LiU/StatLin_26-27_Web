import { saveStarPage } from "@/app/admin/_actions/naringsliv";
import { formatDate } from "@/lib/dates";
import type { EventItem, SiteSettings } from "@/lib/types";
import { ActionForm } from "./action-form";
import { Field, FormSection, Select, TextArea, TextInput } from "./fields";

/**
 * Texterna på STAR-sidan, för SASU och redaktörerna. Samma formulär i adminpanelen och i pennans sidopanel.
 * Ett tomt fält tar bort texten från sidan, och tomma Förbered dig eller Frågor tar bort hela avsnittet.
 */
export function StarPageForm({ s, events, onSaved }: { s: SiteSettings; events: Pick<EventItem, "id" | "title" | "starts_at">[]; onSaved?: () => void }) {
  return (
    <ActionForm action={saveStarPage} submitLabel="Spara texterna" onSuccess={onSaved} className="space-y-5">
      <FormSection title="Evenemanget" description="Datum, tid och plats hämtas från evenemanget. Programmet också: rader som börjar med ett klockslag under rubriken Program.">
        <Field label="Evenemang" name="star_event_id" hint="Automatiskt betyder nästa evenemang med adressen star eller star-2027.">
          <Select name="star_event_id" defaultValue={s.star_event_id}>
            <option value="">Automatiskt</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}, {formatDate(e.starts_at, true)}
              </option>
            ))}
          </Select>
        </Field>
      </FormSection>
      <FormSection title="Överst på sidan">
        <Field label="Underrubrik" name="star_subtitle">
          <TextInput name="star_subtitle" defaultValue={s.star_subtitle} maxLength={120} />
        </Field>
        <Field label="Introduktion" name="star_intro">
          <TextArea name="star_intro" defaultValue={s.star_intro} rows={3} maxLength={600} />
        </Field>
      </FormSection>
      <FormSection title="Företag och sponsorer">
        <Field label="Text över företagen" name="star_companies_intro">
          <TextArea name="star_companies_intro" defaultValue={s.star_companies_intro} rows={2} maxLength={400} />
        </Field>
        <Field label="Text över sponsorerna" name="star_sponsors_intro">
          <TextInput name="star_sponsors_intro" defaultValue={s.star_sponsors_intro} maxLength={300} />
        </Field>
      </FormSection>
      <FormSection title="Förbered dig" description="Tipsen till studenterna. Töm fältet så försvinner avsnittet.">
        <Field label="Tips" name="star_tips" hint="Ett tips per rad.">
          <TextArea name="star_tips" defaultValue={s.star_tips} rows={6} maxLength={1500} />
        </Field>
      </FormSection>
      <FormSection title="Frågor och svar" description="Lägg gärna till anmälan och annat ni vet när det är bestämt. Töm fältet så försvinner avsnittet.">
        <Field label="Frågor" name="star_faq" hint="Frågan på första raden och svaret på nästa. En tom rad börjar nästa fråga.">
          <TextArea name="star_faq" defaultValue={s.star_faq} rows={10} maxLength={4000} />
        </Field>
      </FormSection>
      <FormSection title="Längst ner på sidan">
        <Field label="Rubrik för studenter" name="star_student_title">
          <TextInput name="star_student_title" defaultValue={s.star_student_title} maxLength={120} />
        </Field>
        <Field label="Text för studenter" name="star_student_text">
          <TextArea name="star_student_text" defaultValue={s.star_student_text} rows={3} maxLength={500} />
        </Field>
        <Field label="Rubrik för företag" name="star_company_title">
          <TextInput name="star_company_title" defaultValue={s.star_company_title} maxLength={120} />
        </Field>
        <Field label="Text för företag" name="star_company_text">
          <TextArea name="star_company_text" defaultValue={s.star_company_text} rows={3} maxLength={500} />
        </Field>
      </FormSection>
      <FormSection title="När sidan är dold" description="Det enda besökare ser innan ni gör sidan live.">
        <Field label="Text" name="star_teaser">
          <TextArea name="star_teaser" defaultValue={s.star_teaser} rows={3} maxLength={500} />
        </Field>
      </FormSection>
    </ActionForm>
  );
}
