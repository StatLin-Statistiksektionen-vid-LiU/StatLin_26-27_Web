"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/admin/_actions/auth";
import {
  ArrowUpRight,
  Calendar,
  Close,
  FileText,
  Handshake,
  Home,
  Key,
  Layers,
  Logout,
  Menu,
  Newspaper,
  Settings,
  Users,
} from "@/components/icons";
import { ROLE_LABELS, type Role } from "@/lib/types";
import { cn, initials } from "@/lib/utils";

type SidebarUser = { name: string; post: string; role: Role; committee_name: string | null; committee_id: number | null };

export function AdminSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const editor = user.role !== "committee";
  const admin = user.role === "admin";

  const groups = [
    {
      label: "Innehåll",
      items: [
        { href: "/admin", label: "Översikt", Icon: Home, exact: true },
        { href: "/admin/evenemang", label: "Evenemang", Icon: Calendar },
        { href: "/admin/nyheter", label: "Nyheter", Icon: Newspaper },
        editor
          ? { href: "/admin/utskott", label: "Utskott", Icon: Layers }
          : user.committee_id
            ? { href: `/admin/utskott/${user.committee_id}`, label: `Utskottssidan`, Icon: Layers }
            : null,
      ],
    },
    {
      label: "Sektionen",
      show: editor,
      items: [
        { href: "/admin/styrelsen", label: "Styrelsen", Icon: Users },
        { href: "/admin/sidor", label: "Sidor", Icon: FileText },
        { href: "/admin/dokument", label: "Dokument", Icon: FileText },
        { href: "/admin/partners", label: "Partners", Icon: Handshake },
      ],
    },
    {
      label: "Administration",
      show: admin,
      items: [
        { href: "/admin/konton", label: "Konton", Icon: Key },
        { href: "/admin/installningar", label: "Inställningar", Icon: Settings },
      ],
    },
  ];

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname === href || pathname.startsWith(href + "/"));

  const nav = (
    <nav aria-label="Adminmeny" className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-5">
      {groups
        .filter((g) => g.show !== false)
        .map((g) => (
          <div key={g.label}>
            <p className="kicker px-3 text-[0.62rem] text-white/35">{g.label}</p>
            <ul className="mt-2 space-y-0.5">
              {g.items.filter(Boolean).map((item) => {
                const { href, label, Icon, exact } = item as { href: string; label: string; Icon: typeof Home; exact?: boolean };
                const active = isActive(href, exact);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.92rem] font-medium transition-colors",
                        active ? "bg-white text-ink" : "text-white/70 hover:bg-white/[0.06] hover:text-white",
                      )}
                    >
                      <Icon size={18} className={active ? "text-red" : ""} />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      <div className="mt-auto space-y-0.5 border-t border-white/10 pt-4">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.92rem] text-white/70 hover:bg-white/[0.06] hover:text-white">
          <ArrowUpRight size={18} /> Visa sajten
        </Link>
        <form action={logout}>
          <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[0.92rem] text-white/70 hover:bg-white/[0.06] hover:text-white">
            <Logout size={18} /> Logga ut
          </button>
        </form>
      </div>
    </nav>
  );

  const profile = (
    <Link href="/admin/konto" onClick={() => setOpen(false)} className="mx-3 mb-4 flex items-center gap-3 rounded-2xl bg-white/[0.05] p-3 transition-colors hover:bg-white/[0.09]">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-red text-sm font-bold text-white">{initials(user.name)}</span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-white">{user.name}</span>
        <span className="block truncate text-xs text-white/50">
          {user.post || ROLE_LABELS[user.role]}
          {user.committee_name && user.role === "committee" ? ` · ${user.committee_name}` : ""}
        </span>
      </span>
    </Link>
  );

  return (
    <>
      {/* Mobil topbar */}
      <div className="sticky top-0 z-40 flex items-center justify-between bg-ink px-4 py-3 text-white lg:hidden">
        <Link href="/admin" className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/statlin-inverterad.svg" alt="" className="size-8" />
          <span className="display-tight text-sm">
            Stat<span className="text-red">Lin</span> admin
          </span>
        </Link>
        <button type="button" onClick={() => setOpen((o) => !o)} className="grid size-10 place-items-center rounded-full border border-white/15" aria-label="Meny" aria-expanded={open}>
          {open ? <Close size={18} /> : <Menu size={18} />}
        </button>
      </div>
      <div className={cn("fixed inset-0 top-[64px] z-30 flex flex-col bg-ink lg:hidden", open ? "flex" : "hidden")}>
        {nav}
        {profile}
      </div>

      {/* Desktop */}
      <aside className="sticky top-0 hidden h-dvh flex-col bg-ink lg:flex">
        <Link href="/admin" className="flex items-center gap-3 px-6 pb-2 pt-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/statlin-inverterad.svg" alt="" className="size-10 transition-transform duration-700 hover:rotate-[-12deg]" />
          <span>
            <span className="display-tight block text-white">
              Stat<span className="text-red">Lin</span>
            </span>
            <span className="kicker block text-[0.6rem] text-white/40">Adminpanel</span>
          </span>
        </Link>
        {nav}
        {profile}
      </aside>
    </>
  );
}
