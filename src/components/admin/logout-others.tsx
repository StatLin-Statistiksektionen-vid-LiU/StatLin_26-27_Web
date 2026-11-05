"use client";

import { useState, useTransition } from "react";
import { logoutOtherSessions } from "@/app/admin/_actions/auth";

export function LogoutOthersButton() {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button
        type="button"
        disabled={pending || done}
        onClick={() =>
          start(async () => {
            setError(null);
            // Svaret läses: utan giltig session loggades inget ut, och knappen får inte påstå det.
            const res = await logoutOtherSessions();
            if (res.ok) setDone(true);
            else setError(res.error ?? "Det gick inte. Försök igen.");
          })
        }
        className="btn btn-ghost btn-sm mt-4 bg-white disabled:opacity-60"
      >
        {done ? "Utloggad från andra enheter" : pending ? "Loggar ut…" : "Logga ut andra enheter"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-red-deep">
          {error}
        </p>
      )}
    </>
  );
}
