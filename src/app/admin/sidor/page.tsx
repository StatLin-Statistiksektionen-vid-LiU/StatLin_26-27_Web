import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminHeader } from "@/components/admin/ui";
import { Edit } from "@/components/icons";
import { isEditor } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { listPages } from "@/lib/data/content";
import { formatTimestamp } from "@/lib/dates";
import { PAGE_PATHS } from "@/lib/navigation";

export const metadata = { title: "Sidor" };

export default function AdminPages() {
  return (
    <Suspense>
      <Pages />
    </Suspense>
  );
}

async function Pages() {
  const user = await requireUser();
  if (!isEditor(user)) redirect("/admin?nekad=1");
  const pages = await listPages();
  return (
    <>
      <AdminHeader title="Sidor" description="Texterna på informationssidorna. Ändringar publiceras direkt när du sparar." />
      <ul className="grid gap-3 sm:grid-cols-2">
        {pages.map((p) => (
          <li key={p.slug}>
            <Link href={`/admin/sidor/${p.slug}`} className="group block rounded-[1.5rem] border border-ink/10 bg-white p-5 transition-colors hover:border-ink/30">
              <span className="flex items-center justify-between">
                <span className="text-lg font-bold">{p.title}</span>
                <Edit size={16} className="text-stone group-hover:text-ink" />
              </span>
              <span className="mt-1 block font-mono text-xs text-stone">{PAGE_PATHS[p.slug] ?? `/${p.slug}`}</span>
              <span className="mt-3 line-clamp-2 block text-sm text-stone">{p.lead}</span>
              <span className="mt-3 block text-xs text-stone-light">Senast ändrad {formatTimestamp(p.updated_at)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
