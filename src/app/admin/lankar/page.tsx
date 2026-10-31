import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LinkForm } from "@/components/admin/link-form";
import { AdminHeader, EmptyState, Notice, StatusBadge } from "@/components/admin/ui";
import { Edit, Star } from "@/components/icons";
import { isEditor } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { listLinks } from "@/lib/data/links";
import { LINK_CATEGORIES } from "@/lib/links";

export const metadata = { title: "Länkar" };

export default function AdminLinks(props: PageProps<"/admin/lankar">) {
  return (
    <Suspense>
      <Links searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Links({ searchParams }: { searchParams: PageProps<"/admin/lankar">["searchParams"] }) {
  const user = await requireUser();
  if (!isEditor(user)) redirect("/admin?nekad=1");
  const [links, sp] = await Promise.all([listLinks(), searchParams]);
  const groups = LINK_CATEGORIES.map((c) => ({ ...c, links: links.filter((l) => l.category === c.value) })).filter((g) => g.links.length > 0);
  return (
    <>
      {sp.sparad && <Notice>Länken är tillagd.</Notice>}
      {sp.raderad && <Notice>Länken är borttagen.</Notice>}
      <AdminHeader
        title="Länkar"
        description={
          <>
            Länkarna på{" "}
            <Link href="/studenter/lankar" className="link-underline text-ink">
              Studenter → Länkar
            </Link>
            . Genvägarna (stjärna) visas också på startsidan och studentsidorna.
          </>
        }
      />
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          {groups.length === 0 ? (
            <EmptyState title="Inga länkar ännu">Lägg till den första med formuläret.</EmptyState>
          ) : (
            groups.map((g) => (
              <section key={g.value}>
                <h2 className="kicker mb-3 text-stone">{g.label}</h2>
                <ul className="divide-y divide-ink/10 overflow-hidden rounded-[1.5rem] border border-ink/10 bg-white">
                  {g.links.map((l) => (
                    <li key={l.id} className="flex items-center gap-4 px-5 py-3.5">
                      <Link href={`/admin/lankar/${l.id}`} className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 font-semibold">
                          <span className="truncate">{l.label}</span>
                          {l.featured ? <Star size={14} fill="currentColor" className="shrink-0 text-red" aria-label="Genväg" /> : null}
                        </span>
                        <span className="block truncate text-xs text-stone">{l.url}</span>
                      </Link>
                      <StatusBadge published={!!l.active} label={l.active ? "Synlig" : "Dold"} />
                      <Link href={`/admin/lankar/${l.id}`} className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-paper" aria-label={`Redigera ${l.label}`}>
                        <Edit size={16} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
        <div className="lg:col-span-2">
          <LinkForm nextOrder={(links.length + 1) * 10} />
        </div>
      </div>
    </>
  );
}
