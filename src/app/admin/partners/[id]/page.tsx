import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { deletePartner } from "@/app/admin/_actions/content";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { PartnerForm } from "@/components/admin/partner-form";
import { AdminHeader } from "@/components/admin/ui";
import { Trash } from "@/components/icons";
import { isEditor } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { listPartners } from "@/lib/data/content";

export const metadata = { title: "Redigera partner" };

export default function EditPartnerPage(props: PageProps<"/admin/partners/[id]">) {
  return (
    <Suspense>
      <EditPartner params={props.params} />
    </Suspense>
  );
}

async function EditPartner({ params }: { params: PageProps<"/admin/partners/[id]">["params"] }) {
  const user = await requireUser();
  if (!isEditor(user)) redirect("/admin?nekad=1");
  const { id } = await params;
  const partner = (await listPartners()).find((p) => p.id === Number(id));
  if (!partner) notFound();
  return (
    <>
      <AdminHeader
        back={{ href: "/admin/partners", label: "Partners" }}
        title={partner.name}
        actions={
          <ConfirmButton action={deletePartner} id={partner.id} message={`Ta bort ${partner.name}?`}>
            <Trash size={15} /> Ta bort
          </ConfirmButton>
        }
      />
      <div className="max-w-2xl">
        <PartnerForm partner={partner} />
      </div>
    </>
  );
}
