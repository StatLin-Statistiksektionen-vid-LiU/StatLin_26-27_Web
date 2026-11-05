import { deleteLink } from "@/app/admin/_actions/links";
import { EditPage } from "@/components/admin/edit-page";
import { LinkForm } from "@/components/admin/link-form";
import { isEditor } from "@/lib/auth/permissions";
import { getLink } from "@/lib/data/links";

export const metadata = { title: "Redigera länk" };

export default function EditLinkPage({ params }: PageProps<"/admin/lankar/[id]">) {
  return (
    <EditPage
      params={params}
      allow={isEditor}
      load={getLink}
      back={{ href: "/admin/lankar", label: "Länkar" }}
      title={(link) => link.label}
      remove={{ action: deleteLink, message: (link) => `Ta bort ${link.label}?` }}
      form={(link) => <LinkForm link={link} />}
    />
  );
}
