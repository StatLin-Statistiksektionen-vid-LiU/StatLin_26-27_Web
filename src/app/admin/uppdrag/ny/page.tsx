import { Suspense } from "react";
import { TaskForm } from "@/components/admin/task-form";
import { AdminHeader } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth/session";
import { listEventsForAdmin } from "@/lib/data/events";
import { listTaskRecipients } from "@/lib/data/tasks";
import { todayLocal } from "@/lib/dates";

export const metadata = { title: "Nytt uppdrag" };

export default function NewTaskPage(props: PageProps<"/admin/uppdrag/ny">) {
  return (
    <Suspense>
      <NewTask searchParams={props.searchParams} />
    </Suspense>
  );
}

async function NewTask({ searchParams }: { searchParams: PageProps<"/admin/uppdrag/ny">["searchParams"] }) {
  const user = await requireUser();
  const sp = await searchParams;
  const [recipients, events] = await Promise.all([listTaskRecipients(), listEventsForAdmin(null)]);
  const today = todayLocal();
  const num = (v: unknown) => (typeof v === "string" && /^\d+$/.test(v) ? Number(v) : null);
  return (
    <>
      <AdminHeader
        back={{ href: "/admin/uppdrag", label: "Uppdragstavla" }}
        title="Nytt uppdrag"
        description="Skicka något som behöver göras till en annan post – till exempel en affisch till grafiskt ansvarig eller ett inlägg till info."
      />
      <TaskForm
        recipients={recipients}
        events={events.filter((e) => e.starts_at.slice(0, 10) >= today).reverse()}
        meId={user.id}
        defaults={{ to_user_id: num(sp.till), event_id: num(sp.evenemang) }}
      />
    </>
  );
}
