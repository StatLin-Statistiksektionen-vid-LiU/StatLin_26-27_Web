import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { savePage } from "@/app/admin/_actions/content";
import { ActionForm } from "@/components/admin/action-form";
import { Field, FormSection, TextArea, TextInput } from "@/components/admin/fields";
import { MarkdownEditor } from "@/components/admin/markdown-editor";
import { AdminHeader } from "@/components/admin/ui";
import { ArrowUpRight } from "@/components/icons";
import { isEditor } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { getPage } from "@/lib/data/content";
import { PAGE_PATHS } from "@/lib/navigation";

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
        title={page.title}
        actions={
          <Link href={path} target="_blank" className="btn btn-ghost btn-sm bg-white">
            Visa sidan <ArrowUpRight size={15} />
          </Link>
        }
      />
      <ActionForm action={savePage} submitLabel="Spara och publicera">
        <input type="hidden" name="slug" value={page.slug} />
        <FormSection title="Sidhuvud">
          <Field label="Titel" name="title" required>
            <TextInput name="title" defaultValue={page.title} maxLength={120} className="text-lg font-semibold" />
          </Field>
          <Field label="Ingress" name="lead" hint="Visas stort under titeln.">
            <TextArea name="lead" defaultValue={page.lead} rows={3} maxLength={500} />
          </Field>
        </FormSection>
        <FormSection title="Innehåll" description="Tips: använd ▸-knappen för utfällbara frågor och svar.">
          <MarkdownEditor name="body_md" label="Text" defaultValue={page.body_md} rows={24} />
        </FormSection>
      </ActionForm>
    </>
  );
}
