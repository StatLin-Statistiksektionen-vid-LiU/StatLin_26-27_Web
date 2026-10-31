"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BoardMemberForm, CommitteeForm, FooterSettingsForm, HomeTextsForm, PageForm } from "@/components/admin/content-forms";
import { EventForm } from "@/components/admin/event-form";
import { NewsForm } from "@/components/admin/news-form";
import { ArrowUpRight, Close } from "@/components/icons";
import type { BoardMember, Committee, EventItem, NewsItem, Page, SessionUser, SiteSettings } from "@/lib/types";
import { editStore, targetQuery, useEditState, type EditTarget } from "./store";

const TITLES: Record<EditTarget["type"], string> = {
  page: "Sidans text",
  home: "Startsidans texter",
  footer: "Sidfot och meddelande",
  committee: "Utskottssidan",
  event: "Evenemanget",
  news: "Nyheten",
  board: "Styrelseposten",
  courses: "Kurslistan",
};

function adminHref(t: EditTarget): string {
  switch (t.type) {
    case "page":
      return `/admin/sidor/${t.slug}`;
    case "home":
    case "footer":
      return "/admin/installningar";
    case "committee":
      return `/admin/utskott/${t.id}`;
    case "event":
      return `/admin/evenemang/${t.id}`;
    case "news":
      return `/admin/nyheter/${t.id}`;
    case "board":
      return `/admin/styrelsen/${t.id}`;
    case "courses":
      return "/admin/kurser";
  }
}

/** Sidopanelen som pennorna öppnar. Formulären är desamma som i adminpanelen. */
export function EditDrawer() {
  const { open } = useEditState();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && editStore.close();
    const overflow = document.body.style.overflow;
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={() => editStore.close()} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="redigera-rubrik"
        className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col bg-paper text-ink shadow-2xl [animation:drawer-in_0.45s_var(--ease-out-expo)_both]"
      >
        <header className="flex items-center justify-between gap-3 border-b border-ink/10 bg-white px-5 py-4">
          <div className="min-w-0">
            <p className="kicker text-red-deep">Redigera</p>
            <h2 id="redigera-rubrik" className="truncate text-lg font-bold">
              {TITLES[open.type]}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href={adminHref(open)} onClick={() => editStore.close()} className="btn btn-ghost btn-sm hidden bg-white sm:inline-flex">
              I adminpanelen <ArrowUpRight size={15} />
            </Link>
            <button ref={closeRef} type="button" onClick={() => editStore.close()} aria-label="Stäng" className="grid size-10 place-items-center rounded-full border border-ink/15 hover:border-ink">
              <Close size={18} />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-4 pt-5 sm:px-6">
          <DrawerBody key={targetQuery(open)} target={open} />
        </div>
      </div>
    </div>
  );
}

type Data = {
  page?: Page;
  settings?: SiteSettings;
  committee?: Committee;
  editor?: boolean;
  event?: EventItem;
  item?: NewsItem;
  member?: BoardMember;
  committees?: Committee[];
  user?: Pick<SessionUser, "role" | "committee_id">;
};

function DrawerBody({ target }: { target: EditTarget }) {
  const router = useRouter();
  const [result, setResult] = useState<{ data: Data } | { error: string } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/redigera?${targetQuery(target)}`, { signal: controller.signal, cache: "no-store" })
      .then(async (res) => {
        const body = await res.json();
        setResult(res.ok ? { data: body as Data } : { error: body.error ?? "Kunde inte hämta innehållet." });
      })
      .catch(() => {
        if (!controller.signal.aborted) setResult({ error: "Kunde inte hämta innehållet. Kontrollera anslutningen och försök igen." });
      });
    return () => controller.abort();
  }, [target]);

  if (!result) {
    return (
      <div className="grid h-48 place-items-center">
        <div className="size-8 animate-spin rounded-full border-2 border-ink/15 border-t-red" aria-label="Laddar" />
      </div>
    );
  }
  if ("error" in result) {
    return (
      <p role="alert" className="rounded-2xl border border-red/30 bg-red/[0.06] px-4 py-3 text-sm font-semibold text-red-dark">
        {result.error}
      </p>
    );
  }

  const d = result.data;
  const onSaved = () => {
    editStore.close("Sparat! Sidan visar nu ändringen.");
    router.refresh();
  };
  switch (target.type) {
    case "page":
      return d.page ? <PageForm page={d.page} onSaved={onSaved} /> : null;
    case "home":
      return d.settings ? <HomeTextsForm s={d.settings} onSaved={onSaved} /> : null;
    case "footer":
      return d.settings ? <FooterSettingsForm s={d.settings} onSaved={onSaved} /> : null;
    case "committee":
      return d.committee ? <CommitteeForm committee={d.committee} editor={!!d.editor} onSaved={onSaved} /> : null;
    case "event":
      return d.event && d.committees && d.user ? (
        <EventForm event={d.event} committees={d.committees} user={d.user} defaultStart={d.event.starts_at} onSaved={onSaved} />
      ) : null;
    case "news":
      return d.item && d.committees && d.user ? <NewsForm item={d.item} committees={d.committees} user={d.user} onSaved={onSaved} /> : null;
    case "board":
      return d.member && d.committees ? <BoardMemberForm member={d.member} committees={d.committees} nextOrder={d.member.sort_order} onSaved={onSaved} /> : null;
    case "courses":
      return null;
  }
}
