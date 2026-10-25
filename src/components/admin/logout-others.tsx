"use client";

import { useState, useTransition } from "react";
import { logoutOtherSessions } from "@/app/admin/_actions/auth";

export function LogoutOthersButton() {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      disabled={pending || done}
      onClick={() =>
        start(async () => {
          await logoutOtherSessions();
          setDone(true);
        })
      }
      className="btn btn-ghost btn-sm mt-4 bg-white disabled:opacity-60"
    >
      {done ? "Utloggad från andra enheter" : pending ? "Loggar ut…" : "Logga ut andra enheter"}
    </button>
  );
}
