import { deleteResource } from "@/app/admin/_actions/resources";
import { EditPage } from "@/components/admin/edit-page";
import { ResourceForm } from "@/components/admin/resource-form";
import { getResource } from "@/lib/data/resources";

export const metadata = { title: "Redigera hjälpmedel" };

export default function EditResourcePage({ params }: PageProps<"/admin/hjalpmedel/[id]">) {
  return (
    <EditPage
      params={params}
      load={getResource}
      back={{ href: "/admin/hjalpmedel", label: "Hjälpmedel" }}
      title={(resource) => resource.title}
      remove={{ action: deleteResource, message: (resource) => `Ta bort "${resource.title}"?` }}
      className="max-w-3xl"
      form={(resource) => <ResourceForm resource={resource} />}
    />
  );
}
