import { Suspense } from "react";
import { NewsForm } from "@/components/admin/news-form";
import { AdminHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { listCommittees } from "@/lib/data/content";

export const metadata = { title: "Ny nyhet" };

export default function NewNewsPage() {
  return (
    <Suspense>
      <NewNews />
    </Suspense>
  );
}

async function NewNews() {
  const user = await requireUser();
  const committees = await listCommittees();
  const visible = user.role === "committee" ? committees.filter((c) => c.id === user.committee_id) : committees;
  return (
    <>
      <AdminHeader back={{ href: "/admin/nyheter", label: "Nyheter" }} title="Ny nyhet" />
      <NewsForm committees={visible} user={user} />
    </>
  );
}
