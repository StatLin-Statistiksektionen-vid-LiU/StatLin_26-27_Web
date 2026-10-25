import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { deleteEvent } from "@/app/admin/_actions/events";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { EventForm } from "@/components/admin/event-form";
import { GalleryManager } from "@/components/admin/gallery-manager";
import { AdminHeader, Card, Notice, StatusBadge } from "@/components/admin/ui";
import { ArrowUpRight, Image as ImageIcon, Trash } from "@/components/icons";
import { canEditOwned } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { listCommittees } from "@/lib/data/content";
import { getEventById, listEventImages } from "@/lib/data/events";

export const metadata = { title: "Redigera evenemang" };

export default function EditEventPage(props: PageProps<"/admin/evenemang/[id]">) {
  return (
    <Suspense>
      <EditEvent params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function EditEvent({ params, searchParams }: Pick<PageProps<"/admin/evenemang/[id]">, "params" | "searchParams">) {
  const user = await requireUser();
  const { id } = await params;
  const sp = await searchParams;
  const event = await getEventById(Number(id));
  if (!event) notFound();
  if (!canEditOwned(user, event)) redirect("/admin/evenemang?nekad=1");
  const [committees, images] = await Promise.all([listCommittees(), listEventImages(event.id)]);
  const visible = user.role === "committee" ? committees.filter((c) => c.id === user.committee_id) : committees;

  return (
    <>
      {sp.skapad && <Notice>Evenemanget är skapat! Ladda gärna upp bilder längre ned.</Notice>}
      <AdminHeader
        back={{ href: "/admin/evenemang", label: "Evenemang" }}
        title={event.title}
        description={
          <span className="inline-flex items-center gap-3">
            <StatusBadge published={!!event.published} />
            {event.committee && <span>{event.committee.name}</span>}
          </span>
        }
        actions={
          <>
            <Link href={`/evenemang/${event.slug}`} target="_blank" className="btn btn-ghost btn-sm bg-white">
              Visa sidan <ArrowUpRight size={15} />
            </Link>
            <ConfirmButton action={deleteEvent} id={event.id} message={`Ta bort "${event.title}" och alla dess bilder? Det går inte att ångra.`}>
              <Trash size={15} /> Ta bort
            </ConfirmButton>
          </>
        }
      />

      <EventForm event={event} committees={visible} user={user} defaultStart={event.starts_at} />

      <Card className="mt-10 scroll-mt-24 p-5 md:p-7">
        <div id="galleri" className="mb-5 scroll-mt-24">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <ImageIcon size={20} className="text-red" /> Bildgalleri
          </h2>
          <p className="mt-1 text-sm text-stone">Bilderna publiceras direkt på evenemangssidan och i galleriet. Ändringar här sparas automatiskt.</p>
        </div>
        <GalleryManager eventId={event.id} initial={images.map((i) => ({ id: i.id, caption: i.caption, image: i.image }))} coverMediaId={event.cover_media_id} />
      </Card>
    </>
  );
}
