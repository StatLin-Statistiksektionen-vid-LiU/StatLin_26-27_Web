import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { deleteCourse } from "@/app/admin/_actions/links";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { CourseForm } from "@/components/admin/link-form";
import { AdminHeader } from "@/components/admin/ui";
import { ArrowUpRight, Trash } from "@/components/icons";
import { canManageCourses } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { getCourse } from "@/lib/data/links";

export const metadata = { title: "Redigera kurs" };

export default function EditCoursePage(props: PageProps<"/admin/kurser/[id]">) {
  return (
    <Suspense>
      <EditCourse params={props.params} />
    </Suspense>
  );
}

async function EditCourse({ params }: { params: PageProps<"/admin/kurser/[id]">["params"] }) {
  const user = await requireUser();
  if (!canManageCourses(user)) redirect("/admin?nekad=1");
  const { id } = await params;
  const course = await getCourse(Number(id));
  if (!course) notFound();
  return (
    <>
      <AdminHeader
        back={{ href: "/admin/kurser", label: "Kurser" }}
        kicker={course.code}
        title={course.name}
        actions={
          <>
            <Link href={`/tentastatistik/${course.code}`} target="_blank" className="btn btn-ghost btn-sm">
              Tentastatistik <ArrowUpRight size={14} />
            </Link>
            <ConfirmButton action={deleteCourse} id={course.id} message={`Ta bort ${course.code} ${course.name}?`}>
              <Trash size={15} /> Ta bort
            </ConfirmButton>
          </>
        }
      />
      <div className="max-w-2xl">
        <CourseForm course={course} />
      </div>
    </>
  );
}
