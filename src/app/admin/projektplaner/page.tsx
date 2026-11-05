import Link from "next/link";
import { Suspense } from "react";
import { PlanMeter } from "@/components/admin/plan-meter";
import { AdminHeader, EmptyState, Notice } from "@/components/admin/ui";
import { Plus } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { listProjectPlans, type ProjectPlan } from "@/lib/data/arshjul";
import { formatDate, todayLocal } from "@/lib/dates";
import { planTemplate } from "@/lib/projektplan-mallar";

export const metadata = { title: "Projektplaner" };

export default function PlansPage(props: PageProps<"/admin/projektplaner">) {
  return (
    <Suspense>
      <Plans searchParams={props.searchParams} />
    </Suspense>
  );
}

function PlanCard({ plan }: { plan: ProjectPlan }) {
  return (
    <Link href={`/admin/projektplaner/${plan.id}`} className="block h-full rounded-[1.5rem] border border-ink/10 bg-white p-5 transition-colors hover:border-ink/30 motion-reduce:transition-none">
      <p className="kicker text-[0.62rem] text-stone">{planTemplate(plan.template)?.name ?? plan.template}</p>
      <h3 className="mt-1 text-lg font-bold leading-snug">{plan.title}</h3>
      <p className="mt-1 font-mono text-[0.75rem] text-ink/70">
        {formatDate(plan.plan_date, true)}
        {plan.responsible && ` · ${plan.responsible}`}
      </p>
      <PlanMeter done={plan.done} total={plan.total} className="mt-4" />
    </Link>
  );
}

async function Plans({ searchParams }: { searchParams: PageProps<"/admin/projektplaner">["searchParams"] }) {
  await requireUser();
  const sp = await searchParams;
  const plans = await listProjectPlans();
  const today = todayLocal();
  const coming = plans.filter((p) => p.plan_date >= today).reverse();
  const past = plans.filter((p) => p.plan_date < today);

  const list = (title: string, id: string, rows: ProjectPlan[]) =>
    rows.length > 0 && (
      <section aria-labelledby={id} className="mt-8 first:mt-0">
        <h2 id={id} className="kicker text-ink">
          {title}
        </h2>
        <ul className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => (
            <li key={p.id}>
              <PlanCard plan={p} />
            </li>
          ))}
        </ul>
      </section>
    );

  return (
    <>
      {sp.raderad && <Notice>Planen är borttagen. Uppdrag som redan var skickade ligger kvar på tavlan.</Notice>}
      <AdminHeader
        kicker="Alla poster"
        title="Projektplaner"
        description="För det som kräver mer än ett uppdrag. Välj en mall och ett datum, så räknas stegen ut bakåt. Skicka dem till uppdragstavlan när de är redo. Lärdomarna följer med till nästa år."
        actions={
          <Link href="/admin/projektplaner/ny" className="btn btn-red">
            <Plus size={18} /> Ny plan
          </Link>
        }
      />
      {plans.length === 0 ? (
        <EmptyState
          title="Inga planer än"
          action={
            <Link href="/admin/projektplaner/ny" className="btn btn-ink">
              <Plus size={18} /> Skapa den första
            </Link>
          }
        >
          Det finns mallar för evenemang, arbetsmarknadsdag, sittning och gästföreläsning. Du kan också börja från en punkt i årshjulet.
        </EmptyState>
      ) : (
        <>
          {list("Kommande", "planer-kommande", coming)}
          {list("Tidigare", "planer-tidigare", past)}
        </>
      )}
    </>
  );
}
