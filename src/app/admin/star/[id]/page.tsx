import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { deleteStarCompany } from "@/app/admin/_actions/naringsliv";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { StarCompanyForm } from "@/components/admin/star-company-form";
import { AdminHeader } from "@/components/admin/ui";
import { Trash } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { canManageNaringsliv, listStarCompanies } from "@/lib/data/naringsliv";

export const metadata = { title: "Redigera STAR-företag" };

export default function EditStarCompanyPage(props: PageProps<"/admin/star/[id]">) {
  return (
    <Suspense>
      <EditStarCompany params={props.params} />
    </Suspense>
  );
}

async function EditStarCompany({ params }: { params: PageProps<"/admin/star/[id]">["params"] }) {
  const user = await requireUser();
  if (!canManageNaringsliv(user)) redirect("/admin?nekad=1");
  const { id } = await params;
  const company = (await listStarCompanies()).find((c) => c.id === Number(id));
  if (!company) notFound();
  return (
    <>
      <AdminHeader
        back={{ href: "/admin/star", label: "STAR" }}
        title={company.name}
        actions={
          <ConfirmButton action={deleteStarCompany} id={company.id} message={`Ta bort ${company.name}?`}>
            <Trash size={15} /> Ta bort
          </ConfirmButton>
        }
      />
      <div className="max-w-2xl">
        <StarCompanyForm company={company} />
      </div>
    </>
  );
}
