import Link from "next/link";
import { CoverArt } from "./cover-art";
import { SmartImage } from "./smart-image";
import { ArrowUpRight, Clock, MapPin } from "@/components/icons";
import { formatTimeRange, parts, relativeDay } from "@/lib/dates";
import type { EventItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DateBlock({ date, className, dark }: { date: string; className?: string; dark?: boolean }) {
  const p = parts(date);
  return (
    <div
      className={cn(
        "flex w-[4.25rem] shrink-0 flex-col items-center rounded-2xl border py-2.5 tabular",
        dark ? "border-white/15 bg-white/[0.04] text-white" : "border-ink/10 bg-white text-ink",
        className,
      )}
    >
      <span className="kicker text-[0.62rem] text-red">{p.monthShort}</span>
      <span className="display-tight text-[1.9rem] leading-none">{p.day}</span>
      <span className={cn("mt-0.5 font-mono text-[0.62rem] uppercase", dark ? "text-white/45" : "text-stone")}>{p.weekdayShort}</span>
    </div>
  );
}

export function EventCard({ event, priority, className }: { event: EventItem; priority?: boolean; className?: string }) {
  const p = parts(event.starts_at);
  return (
    <Link
      href={`/evenemang/${event.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-[0_1px_0_rgba(0,0,0,0.04)] ring-1 ring-ink/[0.07] transition-all duration-500 ease-[var(--ease-out-expo)] hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.35)]",
        className,
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {event.cover ? (
          <SmartImage
            image={event.cover}
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="h-full w-full transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
            alt=""
          />
        ) : (
          <CoverArt
            seed={event.slug}
            accent={event.committee?.accent}
            logo={event.committee?.logo_url}
            className="h-full w-full transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.05]"
          />
        )}
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="chip bg-white/95 text-ink backdrop-blur">{relativeDay(event.starts_at)}</span>
        </div>
        <div className="absolute bottom-4 left-4 flex flex-col items-center rounded-2xl bg-ink/85 px-3.5 py-2 text-white backdrop-blur-md tabular">
          <span className="kicker text-[0.6rem] text-red">{p.monthShort}</span>
          <span className="display-tight text-[1.65rem] leading-none">{p.day}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        {event.committee && (
          <p className="kicker flex items-center gap-2 text-stone">
            <span className="size-1.5 rounded-full" style={{ background: event.committee.accent }} aria-hidden />
            {event.committee.short_name}
          </p>
        )}
        <h3 className="mt-2.5 text-[1.3rem] font-bold leading-snug tracking-tight [font-stretch:105%]">{event.title}</h3>
        {event.summary && <p className="mt-2 line-clamp-2 text-[0.95rem] leading-relaxed text-stone">{event.summary}</p>}
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-5 text-[0.85rem] text-ink/70">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={15} className="text-red" />
            {capitalizeFirst(p.weekday)} {formatTimeRange(event.starts_at, event.ends_at, !!event.all_day)}
          </span>
          {event.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} className="text-red" />
              {event.location}
            </span>
          )}
        </div>
      </div>
      <span className="absolute right-5 top-5 grid size-10 translate-y-2 place-items-center rounded-full bg-red text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
        <ArrowUpRight size={18} />
      </span>
    </Link>
  );
}

/** Kompakt rad för listor och kalendervyer. */
export function EventRow({ event, dark }: { event: EventItem; dark?: boolean }) {
  return (
    <Link
      href={`/evenemang/${event.slug}`}
      className={cn(
        "group flex items-center gap-5 border-b py-5 transition-colors",
        dark ? "border-white/10 hover:bg-white/[0.03]" : "border-ink/10 hover:bg-white/60",
      )}
    >
      <DateBlock date={event.starts_at} dark={dark} />
      <div className="min-w-0 flex-1">
        <p className={cn("kicker", dark ? "text-white/45" : "text-stone")}>
          {event.committee?.short_name ?? "StatLin"} · {formatTimeRange(event.starts_at, event.ends_at, !!event.all_day)}
        </p>
        <p className="mt-1 truncate text-lg font-bold tracking-tight">{event.title}</p>
        {event.location && <p className={cn("truncate text-sm", dark ? "text-white/55" : "text-stone")}>{event.location}</p>}
      </div>
      <ArrowUpRight size={20} className="shrink-0 text-red opacity-40 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
    </Link>
  );
}

function capitalizeFirst(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
