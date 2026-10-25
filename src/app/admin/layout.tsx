import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { getSessionUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: { default: "Adminpanel", template: "%s · Admin · StatLin" },
  robots: { index: false, follow: false },
};

// Adminpanelen läser sessionen och får blockera vid navigering.
export const instant = false;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/logga-in?next=/admin");
  return (
    <div className="min-h-dvh bg-paper lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)]">
      <AdminSidebar user={{ name: user.name, post: user.post, role: user.role, committee_name: user.committee_name, committee_id: user.committee_id }} />
      <div className="min-w-0">
        {user.must_change_password && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-red px-6 py-3 text-sm font-semibold text-white">
            <span>Du loggade in med ett tillfälligt lösenord. Byt till ett eget innan du fortsätter.</span>
            <Link href="/admin/konto?byt=1" className="rounded-full bg-white px-4 py-1.5 text-red-deep">
              Byt lösenord
            </Link>
          </div>
        )}
        <div className="mx-auto max-w-6xl px-5 pb-24 pt-8 md:px-10 md:pt-12">{children}</div>
      </div>
    </div>
  );
}

function AdminLoading() {
  return (
    <div className="grid min-h-dvh place-items-center bg-paper">
      <div className="size-8 animate-spin rounded-full border-2 border-ink/15 border-t-red" aria-label="Laddar" />
    </div>
  );
}
