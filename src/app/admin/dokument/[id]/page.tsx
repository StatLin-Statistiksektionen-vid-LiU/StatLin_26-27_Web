import { deleteDocument } from "@/app/admin/_actions/content";
import { DocumentForm } from "@/components/admin/document-form";
import { EditPage } from "@/components/admin/edit-page";
import { canManageDocument, canManageDocuments, isEditor } from "@/lib/auth/permissions";
import { listDocuments } from "@/lib/data/content";

export const metadata = { title: "Redigera dokument" };

export default function EditDocumentPage({ params }: PageProps<"/admin/dokument/[id]">) {
  return (
    <EditPage
      params={params}
      allow={canManageDocuments}
      load={async (id) => (await listDocuments()).find((d) => d.id === id)}
      allowItem={{ check: (user, doc) => canManageDocument(user, doc.category), deniedHref: "/admin/dokument?nekad=1" }}
      back={{ href: "/admin/dokument", label: "Dokument" }}
      title={(doc) => doc.title}
      remove={{ action: deleteDocument, message: (doc) => `Ta bort "${doc.title}"?` }}
      className="max-w-3xl"
      form={(doc, user) => <DocumentForm doc={doc} category={isEditor(user) ? undefined : "grafiskt"} />}
    />
  );
}
