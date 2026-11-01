import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deleteResource } from "@/app/admin/_actions/resources";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { ResourceForm } from "@/components/admin/resource-form";
import { AdminHeader } from "@/components/admin/ui";
import { Trash } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { getResource } from "@/lib/data/resources";

export const metadata = { title: "Redigera hjälpmedel" };

export default function EditResourcePage(props: PageProps<"/admin/hjalpmedel/[id]">) {
  return (
    <Suspense>
      <EditResource params={props.params} />
    </Suspense>
  );
}

async function EditResource({ params }: { params: PageProps<"/admin/hjalpmedel/[id]">["params"] }) {
  await requireUser();
  const { id } = await params;
  const resource = await getResource(Number(id));
  if (!resource) notFound();
  return (
    <>
      <AdminHeader
        back={{ href: "/admin/hjalpmedel", label: "Hjälpmedel" }}
        title={resource.title}
        actions={
          <ConfirmButton action={deleteResource} id={resource.id} message={`Ta bort "${resource.title}"?`}>
            <Trash size={15} /> Ta bort
          </ConfirmButton>
        }
      />
      <div className="max-w-3xl">
        <ResourceForm resource={resource} />
      </div>
    </>
  );
}
