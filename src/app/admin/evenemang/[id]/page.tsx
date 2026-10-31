import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { deleteEvent, setEventChecked } from "@/app/admin/_actions/events";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { EventForm } from "@/components/admin/event-form";
import { GalleryManager } from "@/components/admin/gallery-manager";
import { AdminHeader, Card, Notice, ReviewBadge, StatusBadge } from "@/components/admin/ui";
import { ArrowUpRight, Check, Image as ImageIcon, Trash } from "@/components/icons";
import { canEditOwned, canReviewEvents } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { getUser } from "@/lib/data/admin";
import { listCommittees } from "@/lib/data/content";
import { getEventById, listEventImages } from "@/lib/data/events";
import { formatTimestamp } from "@/lib/dates";
import type { EventItem } from "@/lib/types";

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
      {sp.skapad && (
        <Notice>{event.published ? "Evenemanget är publicerat! Ladda gärna upp bilder längre ned." : "Evenemanget är sparat som utkast och syns inte på sajten än."}</Notice>
      )}
      <AdminHeader
        back={{ href: "/admin/evenemang", label: "Evenemang" }}
        title={event.title}
        description={
          <span className="inline-flex flex-wrap items-center gap-3">
            <StatusBadge published={!!event.published} />
            <ReviewBadge checked={!!event.checked_at} />
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

      {canReviewEvents(user) && <ReviewPanel event={event} />}

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

/** Bara för administratörer: markera evenemanget som granskat, eller ångra. */
async function ReviewPanel({ event }: { event: EventItem }) {
  const checker = event.checked_by ? await getUser(event.checked_by) : null;
  return (
    <div className="mb-8 flex flex-col gap-4 rounded-[1.5rem] border border-ink/10 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-stone">
        <span className="block font-semibold text-ink">
          {event.checked_at
            ? `Granskad ${formatTimestamp(event.checked_at)}${checker ? ` av ${checker.name}` : ""}`
            : "Ingen administratör har granskat evenemanget än"}
        </span>
        Granskningen syns bara här i adminpanelen och påverkar inte om evenemanget visas på sajten.
      </p>
      <form action={setEventChecked} className="shrink-0">
        <input type="hidden" name="id" value={event.id} />
        <input type="hidden" name="checked" value={event.checked_at ? "0" : "1"} />
        {event.checked_at ? (
          <button type="submit" className="btn btn-ghost btn-sm bg-white">
            Ångra granskning
          </button>
        ) : (
          <button type="submit" className="btn btn-ink btn-sm">
            <Check size={15} /> Markera som granskad
          </button>
        )}
      </form>
    </div>
  );
}
