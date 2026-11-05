import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { deleteEvent, setEventChecked } from "@/app/admin/_actions/events";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { EventEditor } from "@/components/admin/event-editor";
import { InlineActionForm } from "@/components/admin/inline-action-form";
import { AdminHeader, Notice, ReviewBadge, StatusBadge } from "@/components/admin/ui";
import { ArrowUpRight, Check, Trash } from "@/components/icons";
import { canEditOwned, canReviewEvents, hasDesign } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { getUser } from "@/lib/data/admin";
import { listCommittees } from "@/lib/data/content";
import { getEventById, listEventImages } from "@/lib/data/events";
import { findDesignRecipient } from "@/lib/data/tasks";
import { addDaysLocal, formatTimestamp, todayLocal } from "@/lib/dates";
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
  const reviewer = canReviewEvents(user);
  // Adressen behåller ?skapad=1 när formuläret sparas, men då har beskedet gjort sitt.
  const justCreated = !!sp.skapad && event.updated_at === event.created_at;
  const askForPoster = justCreated && !event.cover && !hasDesign(user) && event.starts_at.slice(0, 10) >= todayLocal();
  const posterLink = askForPoster && (
    <Link href={await posterRequestHref(event)} className="btn btn-ghost btn-sm bg-white">
      Be om affisch
    </Link>
  );

  return (
    <>
      {justCreated &&
        (event.published ? (
          <Notice
            actions={
              <>
                {posterLink}
                <a href="#galleri" className="btn btn-ghost btn-sm bg-white">
                  Ladda upp bilder
                </a>
                <Link href={`/evenemang/${event.slug}`} target="_blank" className="btn btn-ghost btn-sm bg-white">
                  Visa på sajten <ArrowUpRight size={15} />
                </Link>
              </>
            }
          >
            Evenemanget är publicerat!
          </Notice>
        ) : (
          <Notice actions={posterLink}>Evenemanget är sparat som utkast och syns inte på sajten än.</Notice>
        ))}
      <AdminHeader
        back={{ href: "/admin/evenemang", label: "Evenemang" }}
        title={event.title}
        description={
          <span className="inline-flex flex-wrap items-center gap-3">
            <StatusBadge published={!!event.published} />
            {reviewer && <ReviewBadge checked={!!event.checked_at} />}
            {event.committee && <span>{event.committee.name}</span>}
          </span>
        }
        actions={
          <>
            {/* Ett utkast har ingen sida att visa. */}
            {event.published && (
              <Link href={`/evenemang/${event.slug}`} target="_blank" className="btn btn-ghost btn-sm bg-white">
                Visa sidan <ArrowUpRight size={15} />
              </Link>
            )}
            <Link href={`/admin/evenemang/ny?fran=${event.id}`} className="btn btn-ghost btn-sm bg-white">
              Kopiera
            </Link>
            <ConfirmButton action={deleteEvent} id={event.id} message={`Ta bort "${event.title}" och alla dess bilder? Det går inte att ångra.`}>
              <Trash size={15} /> Ta bort
            </ConfirmButton>
          </>
        }
      />

      {reviewer && <ReviewPanel event={event} />}

      <EventEditor
        event={event}
        committees={visible}
        user={{ role: user.role, committee_id: user.committee_id }}
        images={images.map((i) => ({ id: i.id, caption: i.caption, image: i.image }))}
      />
    </>
  );
}

/** Ett uppdrag om affischen, ifyllt så långt det går: rubrik, evenemang, grafiskt ansvarig och en vecka före evenemanget som sista dag. */
async function posterRequestHref(event: EventItem) {
  const designer = await findDesignRecipient();
  const due = addDaysLocal(event.starts_at, -7).slice(0, 10);
  const query = new URLSearchParams({ evenemang: String(event.id), titel: `Affisch: ${event.title}` });
  if (designer) query.set("till", String(designer));
  if (due >= todayLocal()) query.set("datum", due);
  return `/admin/uppdrag/ny?${query}`;
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
      <InlineActionForm action={setEventChecked} className="shrink-0">
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
      </InlineActionForm>
    </div>
  );
}
