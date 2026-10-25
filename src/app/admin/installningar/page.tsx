import { redirect } from "next/navigation";
import { Suspense } from "react";
import { saveSettings } from "@/app/admin/_actions/content";
import { ActionForm } from "@/components/admin/action-form";
import { Field, FormSection, TextInput } from "@/components/admin/fields";
import { AdminHeader } from "@/components/admin/ui";
import { isAdmin } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/data/content";

export const metadata = { title: "Inställningar" };

export default function SettingsPage() {
  return (
    <Suspense>
      <Settings />
    </Suspense>
  );
}

async function Settings() {
  const user = await requireUser();
  if (!isAdmin(user)) redirect("/admin?nekad=1");
  const s = await getSettings();
  return (
    <>
      <AdminHeader title="Inställningar" description="Kontaktuppgifter och länkar som visas i sidfoten och på kontaktsidan." />
      <ActionForm action={saveSettings}>
        <div className="grid gap-6 lg:grid-cols-2">
          <FormSection title="Kontakt">
            <Field label="Allmän e-post" name="contact_email" required>
              <TextInput name="contact_email" type="email" defaultValue={s.contact_email} />
            </Field>
            <Field label="Adress" name="address">
              <TextInput name="address" defaultValue={s.address} />
            </Field>
            <Field label="Sektionsrum" name="sektionsrum" hint="Var hittar man er på campus?">
              <TextInput name="sektionsrum" defaultValue={s.sektionsrum} />
            </Field>
            <Field label="Organisationsnummer" name="org_number">
              <TextInput name="org_number" defaultValue={s.org_number} />
            </Field>
          </FormSection>
          <FormSection title="Sociala medier" description="Tomma fält döljs på sajten.">
            <Field label="Instagram" name="instagram">
              <TextInput name="instagram" type="url" defaultValue={s.instagram} placeholder="https://instagram.com/…" />
            </Field>
            <Field label="Facebook" name="facebook">
              <TextInput name="facebook" type="url" defaultValue={s.facebook} placeholder="https://facebook.com/…" />
            </Field>
            <Field label="LinkedIn" name="linkedin">
              <TextInput name="linkedin" type="url" defaultValue={s.linkedin} placeholder="https://linkedin.com/company/…" />
            </Field>
          </FormSection>
          <FormSection title="Meddelande" description="En kort rad som visas högst upp på alla sidor, t.ex. inför årsmötet. Lämna tomt för att dölja.">
            <Field label="Text" name="announcement">
              <TextInput name="announcement" defaultValue={s.announcement} maxLength={200} placeholder="Årsmöte 12 mars – läs handlingarna" />
            </Field>
            <Field label="Länk" name="announcement_url">
              <TextInput name="announcement_url" defaultValue={s.announcement_url} placeholder="/dokument" />
            </Field>
          </FormSection>
          <FormSection title="Beskrivning">
            <Field label="Slogan" name="tagline" hint="Används som beskrivning i sidfot och sökmotorer.">
              <TextInput name="tagline" defaultValue={s.tagline} maxLength={200} />
            </Field>
          </FormSection>
        </div>
      </ActionForm>
    </>
  );
}
