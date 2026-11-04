import { redirect } from "next/navigation";
import { Suspense } from "react";
import { saveSettings } from "@/app/admin/_actions/content";
import { ActionForm } from "@/components/admin/action-form";
import { AnnouncementSection, ContactSection, HomeTextsSection, SocialSection, StarSection, TaglineSection } from "@/components/admin/content-forms";
import { AdminHeader } from "@/components/admin/ui";
import { canManageSettings } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/data/content";
import { listUpcomingEvents } from "@/lib/data/events";

export const metadata = { title: "Inställningar" };

export default function SettingsPage() {
  return (
    <Suspense>
      <Settings />
    </Suspense>
  );
}

async function Settings() {
  const user = await requireUser();
  if (!canManageSettings(user)) redirect("/admin?nekad=1");
  const [s, upcoming] = await Promise.all([getSettings(), listUpcomingEvents(200)]);
  return (
    <>
      <AdminHeader title="Inställningar" description="Startsidans texter, kontaktuppgifter och länkar som visas i sidfoten och på kontaktsidan." />
      <ActionForm action={saveSettings}>
        <div className="grid gap-6 lg:grid-cols-2">
          <HomeTextsSection s={s} className="lg:col-span-2" />
          <ContactSection s={s} />
          <SocialSection s={s} />
          <AnnouncementSection s={s} />
          <TaglineSection s={s} />
          <StarSection s={s} events={upcoming} />
        </div>
      </ActionForm>
    </>
  );
}
