import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { deleteDocument } from "@/app/admin/_actions/content";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { DocumentForm } from "@/components/admin/document-form";
import { AdminHeader } from "@/components/admin/ui";
import { Trash } from "@/components/icons";
import { canManageDocument, canManageDocuments, isEditor } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { listDocuments } from "@/lib/data/content";

export const metadata = { title: "Redigera dokument" };

export default function EditDocumentPage(props: PageProps<"/admin/dokument/[id]">) {
  return (
    <Suspense>
      <EditDocument params={props.params} />
    </Suspense>
  );
}

async function EditDocument({ params }: { params: PageProps<"/admin/dokument/[id]">["params"] }) {
  const user = await requireUser();
  if (!canManageDocuments(user)) redirect("/admin?nekad=1");
  const { id } = await params;
  const doc = (await listDocuments()).find((d) => d.id === Number(id));
  if (!doc) notFound();
  if (!canManageDocument(user, doc.category)) redirect("/admin/dokument?nekad=1");
  return (
    <>
      <AdminHeader
        back={{ href: "/admin/dokument", label: "Dokument" }}
        title={doc.title}
        actions={
          <ConfirmButton action={deleteDocument} id={doc.id} message={`Ta bort "${doc.title}"?`}>
            <Trash size={15} /> Ta bort
          </ConfirmButton>
        }
      />
      <div className="max-w-3xl">
        <DocumentForm doc={doc} category={isEditor(user) ? undefined : "grafiskt"} />
      </div>
    </>
  );
}
