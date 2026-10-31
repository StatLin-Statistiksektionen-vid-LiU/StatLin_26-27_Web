import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { CommitteeForm } from "@/components/admin/content-forms";
import { AdminHeader } from "@/components/admin/ui";
import { ArrowUpRight } from "@/components/icons";
import { canEditCommittee, isEditor } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { getCommitteeById } from "@/lib/data/content";

export const metadata = { title: "Redigera utskott" };

export default function EditCommitteePage(props: PageProps<"/admin/utskott/[id]">) {
  return (
    <Suspense>
      <EditCommittee params={props.params} />
    </Suspense>
  );
}

async function EditCommittee({ params }: { params: PageProps<"/admin/utskott/[id]">["params"] }) {
  const user = await requireUser();
  const { id } = await params;
  const c = await getCommitteeById(Number(id));
  if (!c) notFound();
  if (!canEditCommittee(user, c.id)) redirect("/admin?nekad=1");
  const editor = isEditor(user);

  return (
    <>
      <AdminHeader
        back={editor ? { href: "/admin/utskott", label: "Utskott" } : undefined}
        title={c.short_name}
        description={c.name}
        actions={
          c.kind !== "styrelse" && (
            <Link href={`/utskott/${c.slug}`} target="_blank" className="btn btn-ghost btn-sm bg-white">
              Visa sidan <ArrowUpRight size={15} />
            </Link>
          )
        }
      />
      <CommitteeForm committee={c} editor={editor} />
    </>
  );
}
