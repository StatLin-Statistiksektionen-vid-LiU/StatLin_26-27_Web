import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { StarCompanyForm } from "@/components/admin/star-company-form";
import { AdminHeader, EmptyState, Notice, StatusBadge } from "@/components/admin/ui";
import { ArrowUpRight, Edit } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { canManageNaringsliv, listStarCompanies } from "@/lib/data/naringsliv";
import { COMPANY_ROLE_LABELS, parseSeeks, SEEK_LABELS } from "@/lib/naringsliv";

export const metadata = { title: "STAR" };

export default function AdminStar(props: PageProps<"/admin/star">) {
  return (
    <Suspense>
      <StarAdmin searchParams={props.searchParams} />
    </Suspense>
  );
}

async function StarAdmin({ searchParams }: { searchParams: PageProps<"/admin/star">["searchParams"] }) {
  const user = await requireUser();
  if (!canManageNaringsliv(user)) redirect("/admin?nekad=1");
  const [companies, sp] = await Promise.all([listStarCompanies(), searchParams]);
  return (
    <>
      {sp.sparad && <Notice>Företaget är tillagt.</Notice>}
      {sp.raderad && <Notice>Företaget är borttaget.</Notice>}
      <AdminHeader
        title="STAR"
        description="Företag och sponsorer på STAR-sidan. Datum, plats och program kommer från STAR-evenemanget."
        actions={
          <Link href="/star" target="_blank" className="btn btn-ghost btn-sm">
            Visa sidan <ArrowUpRight size={15} />
          </Link>
        }
      />
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {companies.length === 0 ? (
            <EmptyState title="Inga företag ännu">Lägg till det första med formuläret. Tills dess står det att företagen presenteras snart.</EmptyState>
          ) : (
            <ul className="divide-y divide-ink/10 overflow-hidden rounded-[1.5rem] border border-ink/10 bg-white">
              {companies.map((c) => (
                <li key={c.id} className="flex items-center gap-4 px-5 py-4">
                  <span className="grid h-10 w-20 shrink-0 place-items-center">
                    {c.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.logo.thumb} alt="" className="max-h-10 max-w-20 object-contain" />
                    ) : (
                      <span className="text-xs text-stone">Ingen logga</span>
                    )}
                  </span>
                  <Link href={`/admin/star/${c.id}`} className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{c.name}</span>
                    <span className="block truncate text-xs text-stone">
                      {[COMPANY_ROLE_LABELS[c.role], ...parseSeeks(c.seeks).map((k) => SEEK_LABELS[k])].join(" · ")}
                    </span>
                  </Link>
                  <StatusBadge published={!!c.active} label={c.active ? "Synlig" : "Dold"} />
                  <Link href={`/admin/star/${c.id}`} className="grid size-9 place-items-center rounded-full hover:bg-paper" aria-label={`Redigera ${c.name}`}>
                    <Edit size={16} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="lg:col-span-2">
          <StarCompanyForm nextOrder={(companies.length + 1) * 10} />
        </div>
      </div>
    </>
  );
}
