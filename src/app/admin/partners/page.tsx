import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PartnerForm } from "@/components/admin/partner-form";
import { AdminHeader, EmptyState, Notice, StatusBadge } from "@/components/admin/ui";
import { Edit } from "@/components/icons";
import { isEditor } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { listPartners } from "@/lib/data/content";

export const metadata = { title: "Partners" };

export default function AdminPartners(props: PageProps<"/admin/partners">) {
  return (
    <Suspense>
      <Partners searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Partners({ searchParams }: { searchParams: PageProps<"/admin/partners">["searchParams"] }) {
  const user = await requireUser();
  if (!isEditor(user)) redirect("/admin?nekad=1");
  const [partners, sp] = await Promise.all([listPartners(), searchParams]);
  return (
    <>
      {sp.sparad && <Notice>Partnern är tillagd.</Notice>}
      {sp.raderad && <Notice>Partnern är borttagen.</Notice>}
      <AdminHeader title="Partners" description="Företag som visas på sidan För företag." />
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {partners.length === 0 ? (
            <EmptyState title="Inga partners ännu">Lägg till den första med formuläret.</EmptyState>
          ) : (
            <ul className="divide-y divide-ink/10 overflow-hidden rounded-[1.5rem] border border-ink/10 bg-white">
              {partners.map((p) => (
                <li key={p.id} className="flex items-center gap-4 px-5 py-4">
                  <span className="grid h-10 w-20 shrink-0 place-items-center">
                    {p.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.logo.thumb} alt="" className="max-h-10 max-w-20 object-contain" />
                    ) : (
                      <span className="text-xs text-stone">Ingen logga</span>
                    )}
                  </span>
                  <Link href={`/admin/partners/${p.id}`} className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{p.name}</span>
                    <span className="block text-xs text-stone">{p.tier === "huvudpartner" ? "Huvudpartner" : "Partner"}</span>
                  </Link>
                  <StatusBadge published={!!p.active} label={p.active ? "Synlig" : "Dold"} />
                  <Link href={`/admin/partners/${p.id}`} className="grid size-9 place-items-center rounded-full hover:bg-paper" aria-label="Redigera">
                    <Edit size={16} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="lg:col-span-2">
          <PartnerForm nextOrder={(partners.length + 1) * 10} />
        </div>
      </div>
    </>
  );
}
