import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { deleteBoardMember } from "@/app/admin/_actions/content";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { BoardMemberForm } from "@/components/admin/content-forms";
import { AdminHeader } from "@/components/admin/ui";
import { Trash } from "@/components/icons";
import { isEditor } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { getBoardMember, listBoard, listCommittees } from "@/lib/data/content";

export const metadata = { title: "Styrelsepost" };

/** Både /admin/styrelsen/ny och /admin/styrelsen/[id]. */
export default function BoardMemberPage(props: PageProps<"/admin/styrelsen/[id]">) {
  return (
    <Suspense>
      <BoardMemberEditor params={props.params} />
    </Suspense>
  );
}

async function BoardMemberEditor({ params }: { params: PageProps<"/admin/styrelsen/[id]">["params"] }) {
  const user = await requireUser();
  if (!isEditor(user)) redirect("/admin?nekad=1");
  const { id } = await params;
  const isNew = id === "ny";
  const member = isNew ? null : await getBoardMember(Number(id));
  if (!isNew && !member) notFound();
  const [committees, board] = await Promise.all([listCommittees(), listBoard()]);
  const nextOrder = board.length ? Math.max(...board.map((b) => b.sort_order)) + 10 : 0;

  return (
    <>
      <AdminHeader
        back={{ href: "/admin/styrelsen", label: "Styrelsen" }}
        title={member ? member.post : "Ny post"}
        actions={
          member && (
            <ConfirmButton action={deleteBoardMember} id={member.id} message={`Ta bort posten "${member.post}"?`}>
              <Trash size={15} /> Ta bort
            </ConfirmButton>
          )
        }
      />
      <BoardMemberForm member={member} committees={committees} nextOrder={nextOrder} />
    </>
  );
}
