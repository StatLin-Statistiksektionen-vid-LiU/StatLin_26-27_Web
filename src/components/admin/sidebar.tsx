"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Board,
  BookOpen,
  Calendar,
  Chain,
  ClipboardList,
  Close,
  FileText,
  Handshake,
  Home,
  Image as ImageIcon,
  Key,
  Layers,
  Logout,
  Mail,
  MapFold,
  Menu,
  MessageCircle,
  Newspaper,
  Settings,
  Star,
  Users,
  Wheel,
} from "@/components/icons";
import { hasDesign } from "@/lib/auth/permissions";
import { ROLE_LABELS, type SessionUser } from "@/lib/types";
import { closeWhenWider, useFocusLayer } from "@/lib/use-focus-layer";
import { cn, initials } from "@/lib/utils";
import { LogoutForm } from "./logout-form";

type SidebarUser = Pick<SessionUser, "name" | "post" | "role" | "committee_name" | "committee_id" | "committee_kind" | "design">;
type NavItem = { href: string; label: string; Icon: typeof Home; exact?: boolean; badge?: number };

export function AdminSidebar({
  user,
  unseenTasks = 0,
  questionBox,
  naringsliv = false,
  newWishes = 0,
}: {
  user: SidebarUser;
  unseenTasks?: number;
  questionBox?: { show: boolean; unseen: number };
  naringsliv?: boolean;
  newWishes?: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const topbarRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useFocusLayer({
    active: open,
    layers: () => [topbarRef.current, menuRef.current],
    initial: () => toggleRef.current,
    returnTo: () => toggleRef.current,
  });
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const stopWatching = closeWhenWider("(min-width: 1024px)", () => setOpen(false));
    return () => {
      document.removeEventListener("keydown", onKey);
      stopWatching();
    };
  }, [open]);
  const editor = user.role !== "committee";
  const admin = user.role === "admin";

  // Grafiskt ansvarig: alla bilder, och dokumenten under Grafisk profil.
  const design = hasDesign(user);
  const star: NavItem = { href: "/admin/star", label: "STAR", Icon: Star };
  const wishes: NavItem = { href: "/admin/lunchonskemal", label: "Lunchönskemål", Icon: Mail, badge: newWishes };
  const documents: NavItem = { href: "/admin/dokument", label: "Dokument", Icon: FileText };
  const editorGroups: { label: string; items: (NavItem | null)[] }[] = [
    {
      label: "Sektionen",
      items: [
        { href: "/admin/styrelsen", label: "Styrelsen", Icon: Users },
        { href: "/admin/sidor", label: "Sidor", Icon: MapFold },
        documents,
        { href: "/admin/lankar", label: "Länkar", Icon: Chain },
        { href: "/admin/partners", label: "Partners", Icon: Handshake },
        star,
        wishes,
      ],
    },
    {
      label: "Administration",
      items: [admin ? { href: "/admin/konton", label: "Konton", Icon: Key } : null, { href: "/admin/installningar", label: "Inställningar", Icon: Settings }],
    },
  ];
  // Samma ordning för alla: först det man arbetar med varje vecka, sedan det som syns på sajten och sist det som sällan ändras.
  const groups: { label?: string; items: (NavItem | null)[] }[] = [
    {
      items: [
        { href: "/admin", label: "Översikt", Icon: Home, exact: true },
        { href: "/admin/uppdrag", label: "Uppdragstavla", Icon: Board, badge: unseenTasks },
        { href: "/admin/projektplaner", label: "Projektplaner", Icon: ClipboardList },
        { href: "/admin/arshjul", label: "Årshjul", Icon: Wheel },
        questionBox?.show ? { href: "/admin/fragelada", label: "Frågelådan", Icon: MessageCircle, badge: questionBox.unseen } : null,
      ],
    },
    {
      label: "Publicera",
      items: [
        { href: "/admin/evenemang", label: "Evenemang", Icon: Calendar },
        { href: "/admin/nyheter", label: "Nytt", Icon: Newspaper },
        editor || design ? { href: "/admin/bilder", label: "Bilder", Icon: ImageIcon } : null,
        // Styrelseposter utan eget utskott (kassör, grafiskt ansvarig …) har ingen egen sida att redigera.
        editor
          ? { href: "/admin/utskott", label: "Utskott", Icon: Layers }
          : user.committee_id && user.committee_kind !== "styrelse"
            ? { href: `/admin/utskott/${user.committee_id}`, label: "Vår sida", Icon: Layers }
            : null,
        { href: "/admin/hjalpmedel", label: "Hjälpmedel", Icon: BookOpen },
        !editor && design ? documents : null,
      ],
    },
    ...(editor ? editorGroups : naringsliv ? [{ label: "Näringsliv", items: [star, wishes] }] : []),
  ];

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(href + "/"));

  const nav = (
    <nav aria-label="Adminmeny" className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-2">
      {groups.map((g) => (
        <div key={g.label ?? "arbete"}>
          {g.label && <p className="kicker px-3 pb-1 text-[0.6rem] text-white/60">{g.label}</p>}
          <ul className="space-y-px">
            {g.items.map((item) => {
              if (!item) return null;
              const { href, label, Icon, exact, badge } = item;
              const active = isActive(href, exact);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-1.5 text-[0.875rem] font-medium leading-5 transition-colors pointer-coarse:py-3 pointer-coarse:text-[0.95rem]",
                      active ? "bg-white text-ink" : "text-white/70 hover:bg-white/[0.06] hover:text-white",
                    )}
                  >
                    <Icon size={17} className={active ? "text-red" : ""} />
                    {label}
                    {!!badge && (
                      <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-red px-1.5 text-[0.7rem] font-bold leading-5 text-white tabular">
                        {badge}
                        <span className="sr-only"> nya</span>
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  // Står fast under menyn, så att kontot och utloggningen alltid syns även när menyn behöver scrollas.
  const footerLink = "flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[0.8rem] text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white pointer-coarse:py-2.5";
  const profile = (
    <div className="shrink-0 border-t border-white/10 px-3 pb-3 pt-2">
      <Link href="/admin/konto" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl p-2 transition-colors hover:bg-white/[0.07]">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-red text-xs font-bold text-white">{initials(user.name)}</span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold leading-tight text-white">{user.name}</span>
          <span className="block truncate text-xs text-white/50">
            {user.post || ROLE_LABELS[user.role]}
            {user.committee_name && user.role === "committee" ? ` · ${user.committee_name}` : ""}
          </span>
        </span>
      </Link>
      <div className="mt-0.5 grid grid-cols-2 gap-1">
        <Link href="/" target="_blank" className={footerLink}>
          <ArrowUpRight size={15} /> Visa sajten
        </Link>
        <LogoutForm>
          <button type="submit" className={footerLink}>
            <Logout size={15} /> Logga ut
          </button>
        </LogoutForm>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobil topbar */}
      <div ref={topbarRef} role="banner" className="sticky top-0 z-40 flex items-center justify-between bg-ink px-4 py-3 text-white lg:hidden print:hidden">
        <Link href="/admin" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/statlin.svg" alt="" className="logo-kant size-8 [--kant:1px]" />
          <span className="display-tight text-sm">
            Stat<span className="text-red">Lin</span> admin
          </span>
        </Link>
        <button ref={toggleRef} type="button" onClick={() => setOpen((o) => !o)} className="grid size-10 place-items-center rounded-full border border-white/15" aria-label={open ? "Stäng menyn" : "Öppna menyn"} aria-expanded={open} aria-controls="adminmeny">
          {open ? <Close size={18} /> : <Menu size={18} />}
        </button>
      </div>
      <div ref={menuRef} id="adminmeny" className={cn("fixed inset-0 top-[64px] z-30 flex flex-col bg-ink lg:hidden", open ? "flex" : "hidden")}>
        {nav}
        {profile}
      </div>

      {/* Desktop */}
      <aside className="sticky top-0 hidden h-dvh flex-col bg-ink lg:flex print:hidden">
        <Link href="/admin" className="flex shrink-0 items-center gap-3 px-6 pb-2 pt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/statlin.svg" alt="" className="logo-kant size-9 transition-transform duration-700 [--kant:1px] hover:rotate-[-12deg]" />
          <span>
            <span className="display-tight block text-white">
              Stat<span className="text-red">Lin</span>
            </span>
            <span className="kicker block text-[0.6rem] text-white/60">Adminpanel</span>
          </span>
        </Link>
        {nav}
        {profile}
      </aside>
    </>
  );
}
