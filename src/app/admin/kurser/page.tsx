import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CourseForm } from "@/components/admin/link-form";
import { AdminHeader, EmptyState, Notice, StatusBadge } from "@/components/admin/ui";
import { Edit } from "@/components/icons";
import { canManageCourses } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { listCourses } from "@/lib/data/links";
import { PROGRAMS, formatCredits } from "@/lib/links";

export const metadata = { title: "Kurser" };

export default function AdminCourses(props: PageProps<"/admin/kurser">) {
  return (
    <Suspense>
      <Courses searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Courses({ searchParams }: { searchParams: PageProps<"/admin/kurser">["searchParams"] }) {
  const user = await requireUser();
  if (!canManageCourses(user)) redirect("/admin?nekad=1");
  const [courses, sp] = await Promise.all([listCourses(), searchParams]);
  return (
    <>
      {sp.sparad && <Notice>Kursen är tillagd. Tentastatistiken hämtas inom någon minut.</Notice>}
      {sp.raderad && <Notice>Kursen är borttagen.</Notice>}
      <AdminHeader
        title="Kurser"
        description={
          <>
            Programmens kurser på{" "}
            <Link href="/studenter/lankar#kurser" className="link-underline text-ink">
              länksidan
            </Link>{" "}
            och i tentastatistiken. Statistiken hämtas automatiskt från kurskoden.
          </>
        }
      />
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-8 lg:col-span-3">
          {courses.length === 0 ? (
            <EmptyState title="Inga kurser ännu">Lägg till den första med formuläret.</EmptyState>
          ) : (
            PROGRAMS.map((p) => {
              const list = courses.filter((c) => c.program === p.value);
              if (list.length === 0) return null;
              return (
                <section key={p.value}>
                  <h2 className="kicker mb-3 text-stone">
                    {p.label} · {p.name}
                  </h2>
                  <ul className="divide-y divide-ink/10 overflow-hidden rounded-[1.5rem] border border-ink/10 bg-white">
                    {list.map((c) => (
                      <li key={c.id} className="flex items-center gap-4 px-5 py-3.5">
                        <Link href={`/admin/kurser/${c.id}`} className="min-w-0 flex-1">
                          <span className="font-mono text-xs font-semibold text-red-deep">{c.code}</span>
                          <span className="block truncate font-semibold">{c.name}</span>
                          <span className="block text-xs text-stone">
                            Termin {c.term}
                            {c.period && `, period ${c.period}`} · {formatCredits(c.credits)}
                            {c.elective ? " · valbar" : ""}
                          </span>
                        </Link>
                        <StatusBadge published={!!c.active} label={c.active ? "Synlig" : "Dold"} />
                        <Link href={`/admin/kurser/${c.id}`} className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-paper" aria-label={`Redigera ${c.code}`}>
                          <Edit size={16} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })
          )}
        </div>
        <div className="lg:col-span-2">
          <CourseForm nextOrder={(courses.length + 1) * 10} />
        </div>
      </div>
    </>
  );
}
