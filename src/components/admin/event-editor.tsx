"use client";

import { useState } from "react";
import { Image as ImageIcon } from "@/components/icons";
import type { Committee, EventItem, ImageRef, SessionUser } from "@/lib/types";
import { EventForm } from "./event-form";
import { GalleryManager } from "./gallery-manager";
import { Card } from "./ui";

type Item = { id: number; caption: string; image: ImageRef };

/**
 * Redigeringssidan för ett evenemang: formuläret och galleriet. Stjärnan i galleriet sparar omslaget direkt, och
 * omslagsfältet i formuläret visar då samma bild – annars skickade formuläret det gamla omslaget när det sparades.
 */
export function EventEditor({
  event,
  committees,
  user,
  images,
}: {
  event: EventItem;
  committees: Committee[];
  user: Pick<SessionUser, "role" | "committee_id">;
  images: Item[];
}) {
  const [cover, setCover] = useState(event.cover);
  // Följ med när sidan laddats om med ett annat omslag (formuläret sparat, eller omslaget bytt någon annanstans).
  const [savedCover, setSavedCover] = useState(event.cover?.id ?? null);
  if ((event.cover?.id ?? null) !== savedCover) {
    setSavedCover(event.cover?.id ?? null);
    setCover(event.cover);
  }

  return (
    <>
      <EventForm event={event} cover={cover} committees={committees} user={user} defaultStart={event.starts_at} />

      <Card className="mt-6 scroll-mt-24 p-5 md:p-7">
        <div id="galleri" className="mb-5 scroll-mt-24">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <ImageIcon size={20} className="text-red" /> Bildgalleri
          </h2>
          <p className="mt-1 text-sm text-stone">Bilderna publiceras direkt på evenemangssidan och i galleriet. Ändringar här sparas automatiskt.</p>
        </div>
        <GalleryManager eventId={event.id} initial={images} coverMediaId={cover?.id ?? null} onCoverChange={setCover} />
      </Card>
    </>
  );
}
