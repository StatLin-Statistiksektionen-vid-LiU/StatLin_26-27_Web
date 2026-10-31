import { saveBoardMember, saveCommittee, savePage, saveSettings } from "@/app/admin/_actions/content";
import type { BoardMember, Committee, Page, SiteSettings } from "@/lib/types";
import { ActionForm } from "./action-form";
import { Field, FormSection, Select, TextArea, TextInput, Toggle } from "./fields";
import { ImageField } from "./image-field";
import { MarkdownEditor } from "./markdown-editor";

/*
 * Formulären används både på adminsidorna och i redigeringspanelen på sajten. onSaved anges bara
 * av panelen, som stänger sig och laddar om sidan efter en sparning.
 */

export function PageForm({ page, onSaved }: { page: Page; onSaved?: () => void }) {
  return (
    <ActionForm action={savePage} submitLabel="Spara och publicera" onSuccess={onSaved}>
      <input type="hidden" name="slug" value={page.slug} />
      <FormSection title="Sidhuvud" description="Skriv *ord* med stjärnor i titeln för att göra dem röda.">
        <Field label="Titel" name="title" required>
          <TextInput name="title" defaultValue={page.title} maxLength={120} className="text-lg font-semibold" />
        </Field>
        <Field label="Ingress" name="lead" hint="Visas stort under titeln.">
          <TextArea name="lead" defaultValue={page.lead} rows={3} maxLength={500} />
        </Field>
      </FormSection>
      <FormSection title="Innehåll" description="Tips: använd ▸-knappen för utfällbara frågor och svar.">
        <MarkdownEditor name="body_md" label="Text" defaultValue={page.body_md} rows={24} />
      </FormSection>
    </ActionForm>
  );
}

export function CommitteeForm({ committee: c, editor, onSaved }: { committee: Committee; editor: boolean; onSaved?: () => void }) {
  return (
    <ActionForm action={saveCommittee} onSuccess={onSaved}>
      <input type="hidden" name="id" value={c.id} />
      <input type="hidden" name="logo_url" value={c.logo_url ?? ""} />
      <div className="grid gap-6 @2xl:grid-cols-3">
        <div className="space-y-6 @2xl:col-span-2">
          <FormSection title="Presentation">
            <div className="grid gap-5 @md:grid-cols-[1fr_10rem]">
              <Field label="Fullständigt namn" name="name" required>
                <TextInput name="name" defaultValue={c.name} maxLength={120} />
              </Field>
              <Field label="Förkortning" name="short_name" required>
                <TextInput name="short_name" defaultValue={c.short_name} maxLength={30} />
              </Field>
            </div>
            <Field label="Slogan" name="tagline" hint="En mening som visas på utskottskortet.">
              <TextArea name="tagline" defaultValue={c.tagline} rows={2} maxLength={200} />
            </Field>
            <MarkdownEditor name="description_md" label="Beskrivning" defaultValue={c.description_md} />
          </FormSection>
          <FormSection title="Kontakt">
            <div className="grid gap-5 @md:grid-cols-2">
              <Field label="E-post" name="email">
                <TextInput name="email" type="email" defaultValue={c.email} />
              </Field>
              <Field label="Instagram" name="instagram">
                <TextInput name="instagram" type="url" defaultValue={c.instagram} placeholder="https://instagram.com/…" />
              </Field>
            </div>
          </FormSection>
        </div>
        <div className="space-y-6">
          <FormSection title="Logga" description="Utskottsloggor regleras av det grafiska styrdokumentet. Byt bara till en godkänd version.">
            <ImageField name="logo_media_id" label="Ladda upp ny logga" defaultImage={null} aspect="aspect-square" fit="contain" hint="PNG med transparent bakgrund blir bäst." />
            {c.logo_url && (
              <div className="flex items-center gap-3 rounded-xl bg-paper p-3 text-sm text-stone">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.logo_url} alt="" className="size-12 object-contain" /> Nuvarande logga
              </div>
            )}
          </FormSection>
          <FormSection title="Utseende">
            <Field label="Accentfärg" name="accent" hint="Används för detaljer och genererade omslag.">
              <div className="flex items-center gap-3">
                <input type="color" name="accent" defaultValue={c.accent} className="h-11 w-16 cursor-pointer rounded-xl border border-ink/15 bg-white p-1" />
              </div>
            </Field>
            {editor && (
              <>
                <Toggle name="visible" label="Visas på sajten" defaultChecked={!!c.visible} />
                <Field label="Sortering" name="sort_order" hint="Lägre tal visas först.">
                  <TextInput name="sort_order" type="number" defaultValue={c.sort_order} min={0} />
                </Field>
              </>
            )}
          </FormSection>
        </div>
      </div>
    </ActionForm>
  );
}

export function BoardMemberForm({
  member,
  committees,
  nextOrder,
  onSaved,
}: {
  member: BoardMember | null;
  committees: Pick<Committee, "id" | "short_name">[];
  nextOrder: number;
  onSaved?: () => void;
}) {
  return (
    <ActionForm action={saveBoardMember} submitLabel={member ? "Spara" : "Lägg till"} onSuccess={onSaved}>
      {member && <input type="hidden" name="id" value={member.id} />}
      <input type="hidden" name="sort_order" value={member?.sort_order ?? nextOrder} />
      <div className="grid gap-6 @2xl:grid-cols-3">
        <div className="space-y-6 @2xl:col-span-2">
          <FormSection title="Post">
            <div className="grid gap-5 @md:grid-cols-2">
              <Field label="Post" name="post" required>
                <TextInput name="post" defaultValue={member?.post} placeholder="Kassör" maxLength={80} />
              </Field>
              <Field label="Namn" name="name" hint="Lämna tomt om posten är vakant.">
                <TextInput name="name" defaultValue={member?.name} maxLength={120} />
              </Field>
            </div>
            <div className="grid gap-5 @md:grid-cols-2">
              <Field label="E-post" name="email">
                <TextInput name="email" type="email" defaultValue={member?.email} placeholder="kassor@statlin.se" />
              </Field>
              <Field label="Kopplad till" name="committee_id" hint="Visas som kontaktperson på utskottets sida.">
                <Select name="committee_id" defaultValue={String(member?.committee_id ?? "")}>
                  <option value="">Ingen</option>
                  {committees.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.short_name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Ansvarsområde" name="bio" hint="Kort beskrivning av vad posten gör.">
              <TextArea name="bio" defaultValue={member?.bio} rows={3} maxLength={400} />
            </Field>
          </FormSection>
        </div>
        <FormSection title="Porträtt">
          <ImageField name="photo_media_id" label="Foto" defaultImage={member?.photo ?? null} aspect="aspect-[4/5]" hint="Utan foto visas initialer på en genererad bakgrund." />
        </FormSection>
      </div>
    </ActionForm>
  );
}

/* Inställningarna i sektioner. saveSettings sparar bara fälten som finns i formuläret. */

export function HomeTextsSection({ s, className }: { s: SiteSettings; className?: string }) {
  return (
    <FormSection title="Startsidan" description="Skriv *ord* med stjärnor för att göra dem röda, och tryck Enter för en ny rad." className={className}>
      <Field label="Liten rad ovanför" name="hero_kicker">
        <TextInput name="hero_kicker" defaultValue={s.hero_kicker} maxLength={80} />
      </Field>
      <Field label="Rubrik" name="hero_title" required hint="T.ex. Sektionen för *statistik*, dataanalys och maskininlärning vid LiU">
        <TextArea name="hero_title" defaultValue={s.hero_title} rows={2} maxLength={140} required />
      </Field>
      <Field label="Underrubrik" name="hero_text">
        <TextArea name="hero_text" defaultValue={s.hero_text} rows={2} maxLength={300} />
      </Field>
      <Field label="Om sektionen" name="home_intro" required hint="Den stora texten under ”01 Om sektionen”.">
        <TextArea name="home_intro" defaultValue={s.home_intro} rows={3} maxLength={400} required />
      </Field>
    </FormSection>
  );
}

export function ContactSection({ s }: { s: SiteSettings }) {
  return (
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
  );
}

export function SocialSection({ s }: { s: SiteSettings }) {
  return (
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
  );
}

export function AnnouncementSection({ s }: { s: SiteSettings }) {
  return (
    <FormSection title="Meddelande" description="En kort rad som visas högst upp på alla sidor, t.ex. inför årsmötet. Lämna tomt för att dölja.">
      <Field label="Text" name="announcement">
        <TextInput name="announcement" defaultValue={s.announcement} maxLength={200} placeholder="Årsmöte 12 mars – läs handlingarna" />
      </Field>
      <Field label="Länk" name="announcement_url">
        <TextInput name="announcement_url" defaultValue={s.announcement_url} placeholder="/dokument" />
      </Field>
    </FormSection>
  );
}

export function TaglineSection({ s }: { s: SiteSettings }) {
  return (
    <FormSection title="Beskrivning">
      <Field label="Slogan" name="tagline" hint="Visas i sidfoten under kontaktuppgifterna.">
        <TextInput name="tagline" defaultValue={s.tagline} maxLength={200} />
      </Field>
    </FormSection>
  );
}

/** Startsidans texter, för pennan på heron och "Om sektionen". */
export function HomeTextsForm({ s, onSaved }: { s: SiteSettings; onSaved?: () => void }) {
  return (
    <ActionForm action={saveSettings} onSuccess={onSaved}>
      <HomeTextsSection s={s} />
    </ActionForm>
  );
}

/** Sidfotens uppgifter och meddelandet högst upp. */
export function FooterSettingsForm({ s, onSaved }: { s: SiteSettings; onSaved?: () => void }) {
  return (
    <ActionForm action={saveSettings} onSuccess={onSaved}>
      <ContactSection s={s} />
      <SocialSection s={s} />
      <TaglineSection s={s} />
      <AnnouncementSection s={s} />
    </ActionForm>
  );
}
