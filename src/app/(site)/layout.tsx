import { Suspense } from "react";
import { AdminBarLoader } from "@/components/edit-mode/admin-bar-loader";
import { Announcement } from "@/components/layout/announcement";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="innehall">{children}</main>
      <SiteFooter />
      <Suspense fallback={null}>
        <Announcement />
      </Suspense>
      {/* Bara för inloggade: redigeringsläget och genvägar till adminpanelen. */}
      <Suspense fallback={null}>
        <AdminBarLoader />
      </Suspense>
    </>
  );
}
