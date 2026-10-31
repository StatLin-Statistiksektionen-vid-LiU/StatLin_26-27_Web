import { saveNews } from "@/app/admin/_actions/news";
import { ActionForm } from "./action-form";
import { Field, FixedCommittee, FormSection, MoreDetails, Select, TextArea, TextInput, TitleSlugFields, Toggle } from "./fields";
import { ImageField } from "./image-field";
import { MarkdownEditor } from "./markdown-editor";
import { publishButtons } from "./publish-buttons";
import type { Committee, NewsItem, SessionUser } from "@/lib/types";

function isoToLocalInput(iso: string) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(new Date(iso))
    .replace(" ", "T");
}

export function NewsForm({ item, committees, user }: { item?: NewsItem | null; committees: Committee[]; user: SessionUser }) {
  const locked = user.role === "committee";
  const own = committees.find((c) => c.id === (item?.committee_id ?? user.committee_id));
  const scheduled = !!item && item.published_at > new Date().toISOString();
  return (
    <ActionForm action={saveNews} {...publishButtons(item)}>
      {item && <input type="hidden" name="id" value={item.id} />}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <FormSection title="Nyheten">
            <TitleSlugFields defaultTitle={item?.title} defaultSlug={item?.slug} basePath="/nyheter" titleLabel="Rubrik" />
            <Field label="Ingress" name="excerpt" hint="Kort sammanfattning som visas i listor och delningar.">
              <TextArea name="excerpt" defaultValue={item?.excerpt} rows={2} maxLength={320} />
            </Field>
            <MarkdownEditor name="body_md" label="Text" defaultValue={item?.body_md} rows={18} />
          </FormSection>

          <MoreDetails summary="Schemalägg publiceringen till en senare tidpunkt." fields={["published_at"]} defaultOpen={scheduled}>
            <Field label="Publiceringsdatum" name="published_at" hint="Lämna tomt för nu. Ett framtida datum schemalägger nyheten.">
              <TextInput type="datetime-local" name="published_at" defaultValue={item ? isoToLocalInput(item.published_at) : ""} />
            </Field>
          </MoreDetails>
        </div>
        <div className="space-y-6">
          <FormSection title="Omslagsbild">
            <ImageField name="cover_media_id" label="Bild" defaultImage={item?.cover ?? null} />
          </FormSection>
          <FormSection title="Avsändare">
            {locked ? (
              <FixedCommittee label="Utskott" name={own ? `${own.short_name} – ${own.name}` : "Ditt utskott"} hint="Nyheten visas med er logga och på er utskottssida." />
            ) : (
              <>
                <Field label="Utskott" name="committee_id">
                  <Select name="committee_id" defaultValue={String(item?.committee_id ?? user.committee_id ?? "")}>
                    <option value="">Hela sektionen</option>
                    {committees.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.short_name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Toggle name="pinned" label="Fäst högst upp" defaultChecked={!!item?.pinned} hint="Visas först på startsidan och i nyhetslistan." />
              </>
            )}
          </FormSection>
        </div>
      </div>
    </ActionForm>
  );
}
