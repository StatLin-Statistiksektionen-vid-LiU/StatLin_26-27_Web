import { Suspense } from "react";
import { EventForm } from "@/components/admin/event-form";
import { AdminHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { listCommittees } from "@/lib/data/content";
import { addDaysLocal, todayLocal } from "@/lib/dates";

export const metadata = { title: "Nytt evenemang" };

export default function NewEventPage() {
  return (
    <Suspense>
      <NewEvent />
    </Suspense>
  );
}

async function NewEvent() {
  const user = await requireUser();
  const committees = await listCommittees();
  const visible = user.role === "committee" ? committees.filter((c) => c.id === user.committee_id) : committees;
  return (
    <>
      <AdminHeader back={{ href: "/admin/evenemang", label: "Evenemang" }} title="Nytt evenemang" description="Efter att du skapat evenemanget kan du ladda upp bilder till galleriet." />
      <EventForm committees={visible} user={user} defaultStart={addDaysLocal(`${todayLocal()}T18:00`, 7)} />
    </>
  );
}
