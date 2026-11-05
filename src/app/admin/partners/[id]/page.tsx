import { deletePartner } from "@/app/admin/_actions/content";
import { EditPage } from "@/components/admin/edit-page";
import { PartnerForm } from "@/components/admin/partner-form";
import { isEditor } from "@/lib/auth/permissions";
import { listPartners } from "@/lib/data/content";

export const metadata = { title: "Redigera partner" };

export default function EditPartnerPage({ params }: PageProps<"/admin/partners/[id]">) {
  return (
    <EditPage
      params={params}
      allow={isEditor}
      load={async (id) => (await listPartners()).find((p) => p.id === id)}
      back={{ href: "/admin/partners", label: "Partners" }}
      title={(partner) => partner.name}
      remove={{ action: deletePartner, message: (partner) => `Ta bort ${partner.name}?` }}
      form={(partner) => <PartnerForm partner={partner} />}
    />
  );
}
