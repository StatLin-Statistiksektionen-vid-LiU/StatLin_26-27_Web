import { Suspense } from "react";
import { BoxForm } from "@/components/fragelada/box-form";
import { AdminHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";

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
        description="Koden skapas när du sparar. Du blir ägare, och bara du kan läsa frågorna."
      />
      <BoxForm />
    </>
  );
}
