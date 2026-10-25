"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Close } from "@/components/icons";
import { hashString } from "@/lib/utils";

export function AnnouncementPill({ text, href }: { text: string; href: string | null }) {
  const key = `statlin-announcement-${hashString(text)}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(key) === "1";
    } catch {
      /* lagring blockerad */
    }
    const t = setTimeout(() => setVisible(!dismissed), 1200);
    return () => clearTimeout(t);
  }, [key]);

  if (!visible) return null;
  const close = () => {
    setVisible(false);
    try {
      localStorage.setItem(key, "1");
    } catch {
      /* lagring blockerad */
    }
  };
  const body = (
    <>
      <span className="relative flex size-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red opacity-70" />
        <span className="relative inline-flex size-2 rounded-full bg-red" />
      </span>
      <span className="text-sm font-semibold">{text}</span>
      {href && <ArrowRight size={16} className="shrink-0 text-red" />}
    </>
  );
  return (
    <div role="status" className="fixed inset-x-4 bottom-4 z-40 flex justify-center [animation:fade-up_0.7s_var(--ease-out-expo)_both] sm:inset-x-auto sm:left-6">
      <div className="flex max-w-xl items-center gap-2 rounded-full border border-white/10 bg-ink/95 py-2 pl-5 pr-2 text-white shadow-2xl shadow-black/30 backdrop-blur">
        {href ? (
          <Link href={href} className="flex items-center gap-3 hover:underline" onClick={close}>
            {body}
          </Link>
        ) : (
          <span className="flex items-center gap-3">{body}</span>
        )}
        <button type="button" onClick={close} className="ml-1 grid size-8 shrink-0 place-items-center rounded-full hover:bg-white/10" aria-label="Stäng meddelandet">
          <Close size={16} />
        </button>
      </div>
    </div>
  );
}
