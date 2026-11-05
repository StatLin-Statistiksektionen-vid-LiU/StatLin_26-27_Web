import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { deleteWheelItem } from "@/app/admin/_actions/arshjul";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { AdminHeader } from "@/components/admin/ui";
import { WheelItemForm } from "@/components/admin/wheel-item-form";
import { Trash } from "@/components/icons";
import { canChangeWheelItem } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { getWheelItem, listResponsibleOptions } from "@/lib/data/arshjul";

export const metadata = { title: "Ändra punkt i årshjulet" };

export default function EditWheelItemPage(props: PageProps<"/admin/arshjul/[id]">) {
  return (
    <Suspense>
      <EditWheelItem params={props.params} />
    </Suspense>
  );
}

async function EditWheelItem({ params }: { params: PageProps<"/admin/arshjul/[id]">["params"] }) {
  const user = await requireUser();
  const { id } = await params;
  const item = /^\d+$/.test(id) ? await getWheelItem(Number(id)) : null;
  if (!item) notFound();
  if (!canChangeWheelItem(user, item)) redirect("/admin/arshjul");
  const options = await listResponsibleOptions();
  return (
    <>
      <AdminHeader
        back={{ href: "/admin/arshjul", label: "Årshjul" }}
        title={item.title}
        description="Ändringen gäller alla år, också nästa års post."
        actions={
          <ConfirmButton action={deleteWheelItem} id={item.id} message="Ta bort punkten från årshjulet? Uppdrag och planer som redan skapats från den står kvar.">
            <Trash size={15} /> Ta bort
          </ConfirmButton>
        }
      />
      <WheelItemForm item={item} responsibleOptions={options} />
    </>
  );
}
