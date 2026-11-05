import { Suspense } from "react";
import { AdminBarLoader } from "@/components/edit-mode/admin-bar-loader";
import { Announcement } from "@/components/layout/announcement";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { StarNavGuard } from "@/components/star/star-nav-guard";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="innehall">{children}</main>
      <SiteFooter />
      <Suspense fallback={null}>
        <Announcement />
      </Suspense>
      {/* Tar bort länken till STAR-sidan ur menyerna när den är dold. */}
      <Suspense fallback={null}>
        <StarNavGuard />
      </Suspense>
      {/* Bara för inloggade: redigeringsläget och genvägar till adminpanelen. */}
      <Suspense fallback={null}>
        <AdminBarLoader />
      </Suspense>
    </>
  );
}
