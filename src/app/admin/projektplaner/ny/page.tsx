import { Suspense } from "react";
import { PlanNewForm } from "@/components/admin/plan-new-form";
import { LessonsPanel } from "@/components/admin/plan-lessons";
import { AdminHeader } from "@/components/admin/ui";
import { suggestedPlanDate, yearInRange } from "@/lib/arshjul";
import { requireUser } from "@/lib/auth/session";
import { getWheelItem, listLessons, listResponsibleOptions } from "@/lib/data/arshjul";
import { todayLocal } from "@/lib/dates";

export const metadata = { title: "Ny projektplan" };

export default function NewPlanPage(props: PageProps<"/admin/projektplaner/ny">) {
  return (
    <Suspense>
      <NewPlan searchParams={props.searchParams} />
    </Suspense>
  );
}

async function NewPlan({ searchParams }: { searchParams: PageProps<"/admin/projektplaner/ny">["searchParams"] }) {
  const user = await requireUser();
  const sp = await searchParams;
  const today = todayLocal();
  const item = typeof sp.punkt === "string" && /^\d+$/.test(sp.punkt) ? await getWheelItem(Number(sp.punkt)) : null;
  const requested = typeof sp.ar === "string" && /^\d{4}$/.test(sp.ar) ? Number(sp.ar) : null;
  const year = requested !== null && yearInRange(requested, today) ? requested : Number(today.slice(0, 4));
  const [options, lessons] = await Promise.all([listResponsibleOptions(), item ? listLessons(item.id) : []]);

  return (
    <>
      <AdminHeader
        back={item ? { href: "/admin/arshjul", label: "Årshjul" } : { href: "/admin/projektplaner", label: "Projektplaner" }}
        title={item ? `Plan för ${item.title}` : "Ny projektplan"}
        description="Välj mall och datum, så visas stegen med uträknade datum. Inget hamnar på tavlan förrän du själv skickar det dit."
      />
      <LessonsPanel lessons={lessons} />
      <PlanNewForm
        today={today}
        responsibleOptions={options}
        defaults={{
          title: item ? `${item.title} ${year}` : "",
          template: item?.template || "",
          date: item ? suggestedPlanDate(item, year, today) : "",
          responsible: item?.responsible || (user.role === "committee" ? user.post : ""),
          goal: "",
          wheelItemId: item?.id ?? null,
          year: item ? year : null,
        }}
      />
    </>
  );
}
