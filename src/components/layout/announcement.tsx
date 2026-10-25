import { AnnouncementPill } from "./announcement-pill";
import { getSettings } from "@/lib/data/content";
import { safeExternalUrl } from "@/lib/utils";

/** Meddelande från Inställningar, t.ex. inför årsmötet. */
export async function Announcement() {
  const s = await getSettings();
  if (!s.announcement.trim()) return null;
  return <AnnouncementPill text={s.announcement} href={safeExternalUrl(s.announcement_url)} />;
}
