import type { MetadataRoute } from "next";
import { getSettings, listCommittees } from "@/lib/data/content";
import { listAllPublishedEvents } from "@/lib/data/events";
import { listNews } from "@/lib/data/news";
import { starIsLive } from "@/lib/naringsliv";
import { siteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await siteUrl();
  const [events, news, committees, settings] = await Promise.all([listAllPublishedEvents(), listNews(500), listCommittees({ visibleOnly: true }), getSettings()]);
  const staticPaths = ["", "/evenemang", "/nyheter", "/sektionen", "/sektionen/styrelsen", "/utskott", "/studenter/kandidat", "/studenter/master", "/studenter/ny-student", "/studenter/lankar", "/studenter/hjalpmedel", "/tentastatistik", "/foretag", "/star", "/lunchforelasningar", "/kontakt", "/dokument", "/galleri", "/grafisk-profil", "/en", "/en/masters", "/integritet"];
  return [
    ...staticPaths.filter((p) => p !== "/star" || starIsLive(settings)).map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...events.map((e) => ({ url: `${base}/evenemang/${e.slug}`, lastModified: e.updated_at, priority: 0.6 })),
    ...news.map((n) => ({ url: `${base}/nyheter/${n.slug}`, lastModified: n.updated_at, priority: 0.5 })),
    ...committees.filter((c) => c.kind !== "styrelse").map((c) => ({ url: `${base}/utskott/${c.slug}`, lastModified: c.updated_at, priority: 0.6 })),
  ];
}
