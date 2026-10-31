import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { PageForm } from "@/components/admin/content-forms";
import { AdminHeader } from "@/components/admin/ui";
import { ArrowUpRight } from "@/components/icons";
import { isEditor } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { getPage } from "@/lib/data/content";
import { PAGE_PATHS } from "@/lib/navigation";
import { stripAccent } from "@/components/ui/accent-text";

export const metadata = { title: "Redigera sida" };

export default function EditPagePage(props: PageProps<"/admin/sidor/[slug]">) {
  return (
    <Suspense>
      <EditPage params={props.params} />
    </Suspense>
  );
}

async function EditPage({ params }: { params: PageProps<"/admin/sidor/[slug]">["params"] }) {
  const user = await requireUser();
  if (!isEditor(user)) redirect("/admin?nekad=1");
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();
  const path = PAGE_PATHS[page.slug] ?? `/${page.slug}`;
  return (
    <>
      <AdminHeader
        back={{ href: "/admin/sidor", label: "Sidor" }}
        title={stripAccent(page.title)}
        actions={
          <Link href={path} target="_blank" className="btn btn-ghost btn-sm bg-white">
            Visa sidan <ArrowUpRight size={15} />
          </Link>
        }
      />
      <PageForm page={page} />
    </>
  );
}
