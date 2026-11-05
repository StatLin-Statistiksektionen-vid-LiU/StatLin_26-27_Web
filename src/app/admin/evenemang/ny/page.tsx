import Link from "next/link";
import { Suspense } from "react";
import { EventForm } from "@/components/admin/event-form";
import { AdminHeader, Notice } from "@/components/admin/ui";
import { canEditOwned } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { listCommittees } from "@/lib/data/content";
import { getEventById } from "@/lib/data/events";
import { addDaysLocal, todayLocal } from "@/lib/dates";

export const metadata = { title: "Nytt evenemang" };

export default function NewEventPage(props: PageProps<"/admin/evenemang/ny">) {
  return (
    <Suspense>
      <NewEvent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function NewEvent({ searchParams }: { searchParams: PageProps<"/admin/evenemang/ny">["searchParams"] }) {
  const user = await requireUser();
  const { fran } = await searchParams;
  const source = typeof fran === "string" && /^\d+$/.test(fran) ? await getEventById(Number(fran)) : null;
  // Samma krav som för att redigera originalet: en kopia ska inte kunna visa ett annat utskotts utkast.
  const original = source && canEditOwned(user, source) ? source : null;
  const committees = await listCommittees();
  const visible = user.role === "committee" ? committees.filter((c) => c.id === user.committee_id) : committees;
  const defaultStart = addDaysLocal(`${todayLocal()}T${original && !original.all_day ? original.starts_at.slice(11) : "18:00"}`, 7);
  // En kväll som slutar efter midnatt ska göra det även i kopian, så sluttiden flyttas lika många dagar som starten.
  const moved = original && Math.round((Date.parse(defaultStart.slice(0, 10)) - Date.parse(original.starts_at.slice(0, 10))) / 86_400_000);
  const copyOf = original && { ...original, ends_at: original.ends_at && addDaysLocal(original.ends_at, moved ?? 0) };
  return (
    <>
      {original && <Notice>Kopia av {original.title}. Välj datum och titta igenom texten. Omslag och anmälningslänk följer inte med.</Notice>}
      <AdminHeader back={{ href: "/admin/evenemang", label: "Evenemang" }} title="Nytt evenemang"
        description={
          original ? undefined : (
            <>
              Har ni gjort det förut?{" "}
              <Link href="/admin/evenemang?visa=tidigare" className="tryck font-semibold text-ink underline">
                Kopiera ett tidigare evenemang
              </Link>
            </>
          )
        }
      />
      <EventForm key={original?.id ?? "ny"} copyOf={copyOf} committees={visible} user={user} defaultStart={defaultStart} />
    </>
  );
}
