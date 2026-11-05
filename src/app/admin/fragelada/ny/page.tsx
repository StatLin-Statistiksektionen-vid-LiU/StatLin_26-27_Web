import { Suspense } from "react";
import { BoxForm } from "@/components/fragelada/box-form";
import { AdminHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { generateCode } from "@/lib/fragelada";

export const metadata = { title: "Ny låda" };

export default function NewBoxPage() {
  return (
    <Suspense>
      <NewBox />
    </Suspense>
  );
}

async function NewBox() {
  await requireUser();
  return (
    <>
      <AdminHeader
        back={{ href: "/admin/fragelada", label: "Frågelådan" }}
        title="Ny låda"
        description="Skriv en egen kod eller använd den slumpade. Du blir ägare, och bara du kan läsa frågorna."
      />
      <BoxForm suggestedCode={generateCode()} />
    </>
  );
}
