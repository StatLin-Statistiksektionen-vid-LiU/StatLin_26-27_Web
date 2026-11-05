import { notFound, redirect } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { AdminHeader } from "@/components/admin/ui";
import { Trash } from "@/components/icons";
import type { FormState } from "@/lib/admin/form";
import { requireUser } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/types";

type EditPageProps<T extends { id: number }> = {
  params: Promise<{ id: string }>;
  /** Spärren för hela sidan. Utelämnas när alla inloggade får redigera. */
  allow?: (user: SessionUser) => boolean;
  load: (id: number) => Promise<T | null | undefined> | T | null | undefined;
  /** Spärren för just den här raden, med adressen den skickar till. */
  allowItem?: { check: (user: SessionUser, item: T) => boolean; deniedHref: string };
  back: { href: string; label: string };
  title: (item: T) => string;
  remove: { action: (fd: FormData) => Promise<FormState>; message: (item: T) => string };
  className?: string;
  form: (item: T, user: SessionUser) => ReactNode;
};

/** Skelettet för en adminsida som redigerar en rad (ST-07): spärrarna, 404 och rubriken med Ta bort. Sidan ger bara formuläret. */
export function EditPage<T extends { id: number }>(props: EditPageProps<T>) {
  return (
    <Suspense>
      <EditPageBody {...props} />
    </Suspense>
  );
}

async function EditPageBody<T extends { id: number }>({ params, allow, load, allowItem, back, title, remove, className = "max-w-2xl", form }: EditPageProps<T>) {
  const user = await requireUser();
  if (allow && !allow(user)) redirect("/admin?nekad=1");
  const { id } = await params;
  const item = await load(Number(id));
  if (!item) notFound();
  if (allowItem && !allowItem.check(user, item)) redirect(allowItem.deniedHref);
  return (
    <>
      <AdminHeader
        back={back}
        title={title(item)}
        actions={
          <ConfirmButton action={remove.action} id={item.id} message={remove.message(item)}>
            <Trash size={15} /> Ta bort
          </ConfirmButton>
        }
      />
      <div className={className}>{form(item, user)}</div>
    </>
  );
}
