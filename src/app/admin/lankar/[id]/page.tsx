import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { deleteLink } from "@/app/admin/_actions/links";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { LinkForm } from "@/components/admin/link-form";
import { AdminHeader } from "@/components/admin/ui";
import { Trash } from "@/components/icons";
import { isEditor } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { getLink } from "@/lib/data/links";

export const metadata = { title: "Redigera länk" };

export default function EditLinkPage(props: PageProps<"/admin/lankar/[id]">) {
  return (
    <Suspense>
      <EditLink params={props.params} />
    </Suspense>
  );
}

async function EditLink({ params }: { params: PageProps<"/admin/lankar/[id]">["params"] }) {
  const user = await requireUser();
  if (!isEditor(user)) redirect("/admin?nekad=1");
  const { id } = await params;
  const link = await getLink(Number(id));
  if (!link) notFound();
  return (
    <>
      <AdminHeader
        back={{ href: "/admin/lankar", label: "Länkar" }}
        title={link.label}
        actions={
          <ConfirmButton action={deleteLink} id={link.id} message={`Ta bort ${link.label}?`}>
            <Trash size={15} /> Ta bort
          </ConfirmButton>
        }
      />
      <div className="max-w-2xl">
        <LinkForm link={link} />
      </div>
    </>
  );
}
