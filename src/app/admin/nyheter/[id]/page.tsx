import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { deleteNews } from "@/app/admin/_actions/news";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { NewsForm } from "@/components/admin/news-form";
import { AdminHeader, Notice } from "@/components/admin/ui";
import { ArrowUpRight, Trash } from "@/components/icons";
import { canEditOwned } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { listCommittees } from "@/lib/data/content";
import { getNewsById } from "@/lib/data/news";

export const metadata = { title: "Redigera nyhet" };

export default function EditNewsPage(props: PageProps<"/admin/nyheter/[id]">) {
  return (
    <Suspense>
      <EditNews params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function EditNews({ params, searchParams }: Pick<PageProps<"/admin/nyheter/[id]">, "params" | "searchParams">) {
  const user = await requireUser();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const item = await getNewsById(Number(id));
  if (!item) notFound();
  if (!canEditOwned(user, item)) redirect("/admin/nyheter?nekad=1");
  const committees = await listCommittees();
  const visible = user.role === "committee" ? committees.filter((c) => c.id === user.committee_id) : committees;
  return (
    <>
      {sp.skapad && <Notice>Nyheten är publicerad!</Notice>}
      <AdminHeader
        back={{ href: "/admin/nyheter", label: "Nyheter" }}
        title={item.title}
        actions={
          <>
            <Link href={`/nyheter/${item.slug}`} target="_blank" className="btn btn-ghost btn-sm bg-white">
              Visa <ArrowUpRight size={15} />
            </Link>
            <ConfirmButton action={deleteNews} id={item.id} message={`Ta bort "${item.title}"?`}>
              <Trash size={15} /> Ta bort
            </ConfirmButton>
          </>
        }
      />
      <NewsForm item={item} committees={visible} user={user} />
    </>
  );
}
