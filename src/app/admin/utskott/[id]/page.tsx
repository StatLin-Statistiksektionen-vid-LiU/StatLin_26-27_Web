import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { saveCommittee } from "@/app/admin/_actions/content";
import { ActionForm } from "@/components/admin/action-form";
import { Field, FormSection, TextArea, TextInput, Toggle } from "@/components/admin/fields";
import { ImageField } from "@/components/admin/image-field";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { AdminHeader } from "@/components/admin/ui";
import { ArrowUpRight } from "@/components/icons";
import { canEditCommittee, isEditor } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { getCommitteeById } from "@/lib/data/content";

export const metadata = { title: "Redigera utskott" };

export default function EditCommitteePage(props: PageProps<"/admin/utskott/[id]">) {
  return (
    <Suspense>
      <EditCommittee params={props.params} />
    </Suspense>
  );
}

async function EditCommittee({ params }: { params: PageProps<"/admin/utskott/[id]">["params"] }) {
  const user = await requireUser();
  const { id } = await params;
  const c = await getCommitteeById(Number(id));
  if (!c) notFound();
  if (!canEditCommittee(user, c.id)) redirect("/admin?nekad=1");
  const editor = isEditor(user);

  return (
    <>
      <AdminHeader
        back={editor ? { href: "/admin/utskott", label: "Utskott" } : undefined}
        title={c.short_name}
        description={c.name}
        actions={
          c.kind !== "styrelse" && (
            <Link href={`/utskott/${c.slug}`} target="_blank" className="btn btn-ghost btn-sm bg-white">
              Visa sidan <ArrowUpRight size={15} />
            </Link>
          )
        }
      />
      <ActionForm action={saveCommittee}>
        <input type="hidden" name="id" value={c.id} />
        <input type="hidden" name="logo_url" value={c.logo_url ?? ""} />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <FormSection title="Presentation">
              <div className="grid gap-5 sm:grid-cols-[1fr_10rem]">
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
              <div className="grid gap-5 sm:grid-cols-2">
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
    </>
  );
}
