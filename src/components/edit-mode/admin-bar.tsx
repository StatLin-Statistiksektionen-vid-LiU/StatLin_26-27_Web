"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { logout } from "@/app/admin/_actions/auth";
import { Check, Edit, Logout, Settings } from "@/components/icons";
import { cn } from "@/lib/utils";
import { EditDrawer } from "./edit-drawer";
import { editStore, useEditState, type EditUser } from "./store";

/** Flytande list för inloggade: slå på redigeringsläget, gå till adminpanelen eller logga ut. */
export function AdminBar({ user }: { user: EditUser }) {
  const { editing, flash } = useEditState();
  const pathname = usePathname();

  useEffect(() => {
    editStore.setUser(user);
    return () => editStore.setUser(null);
  }, [user]);

  // Panelen hör till sidan den öppnades på.
  useEffect(() => {
    editStore.close();
  }, [pathname]);

  return (
    <>
      <div id="admin-bar" className="fixed bottom-4 right-4 z-[70] flex flex-col items-end gap-2 print:hidden">
        {flash && (
          <p role="status" className="flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-lg [animation:fade-up_0.5s_var(--ease-out-expo)_both]">
            <Check size={16} /> {flash}
          </p>
        )}
        <div className="flex items-center gap-1 rounded-full bg-ink p-1.5 text-white shadow-[0_20px_50px_-15px_rgb(0_0_0/0.6)] ring-1 ring-white/10">
          <span className="hidden max-w-48 truncate px-3 text-xs text-white/60 md:block">
            Inloggad som <span className="font-semibold text-white">{user.post || user.name}</span>
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={editing}
            onClick={() => editStore.setEditing(!editing)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
              editing ? "bg-red text-white" : "text-white/80 hover:bg-white/10",
            )}
          >
            <Edit size={15} />
            Redigeringsläge
            <span className={cn("relative h-4 w-7 rounded-full transition-colors", editing ? "bg-white/35" : "bg-white/20")} aria-hidden>
              <span className={cn("absolute top-0.5 size-3 rounded-full bg-white transition-[left]", editing ? "left-3.5" : "left-0.5")} />
            </span>
          </button>
          <Link href="/admin" aria-label="Adminpanel" className="grid size-9 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white">
            <Settings size={17} />
          </Link>
          <form action={logout}>
            <button type="submit" aria-label="Logga ut" className="grid size-9 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white">
              <Logout size={17} />
            </button>
          </form>
        </div>
      </div>
      <EditDrawer />
    </>
  );
}
