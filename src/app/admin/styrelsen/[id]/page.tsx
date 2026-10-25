import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { deleteBoardMember, saveBoardMember } from "@/app/admin/_actions/content";
import { ActionForm } from "@/components/admin/action-form";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { Field, FormSection, Select, TextArea, TextInput } from "@/components/admin/fields";
import { ImageField } from "@/components/admin/image-field";
import { AdminHeader } from "@/components/admin/ui";
import { Trash } from "@/components/icons";
import { isEditor } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { getBoardMember, listBoard, listCommittees } from "@/lib/data/content";

export const metadata = { title: "Styrelsepost" };

/** Både /admin/styrelsen/ny och /admin/styrelsen/[id]. */
export default function BoardMemberPage(props: PageProps<"/admin/styrelsen/[id]">) {
  return (
    <Suspense>
      <BoardMemberEditor params={props.params} />
    </Suspense>
  );
}

async function BoardMemberEditor({ params }: { params: PageProps<"/admin/styrelsen/[id]">["params"] }) {
  const user = await requireUser();
  if (!isEditor(user)) redirect("/admin?nekad=1");
  const { id } = await params;
  const isNew = id === "ny";
  const member = isNew ? null : await getBoardMember(Number(id));
  if (!isNew && !member) notFound();
  const [committees, board] = await Promise.all([listCommittees(), listBoard()]);
  const nextOrder = board.length ? Math.max(...board.map((b) => b.sort_order)) + 10 : 0;

  return (
    <>
      <AdminHeader
        back={{ href: "/admin/styrelsen", label: "Styrelsen" }}
        title={member ? member.post : "Ny post"}
        actions={
          member && (
            <ConfirmButton action={deleteBoardMember} id={member.id} message={`Ta bort posten "${member.post}"?`}>
              <Trash size={15} /> Ta bort
            </ConfirmButton>
          )
        }
      />
      <ActionForm action={saveBoardMember} submitLabel={member ? "Spara" : "Lägg till"}>
        {member && <input type="hidden" name="id" value={member.id} />}
        <input type="hidden" name="sort_order" value={member?.sort_order ?? nextOrder} />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <FormSection title="Post">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Post" name="post" required>
                  <TextInput name="post" defaultValue={member?.post} placeholder="Kassör" maxLength={80} />
                </Field>
                <Field label="Namn" name="name" hint="Lämna tomt om posten är vakant.">
                  <TextInput name="name" defaultValue={member?.name} maxLength={120} />
                </Field>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
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
    </>
  );
}
