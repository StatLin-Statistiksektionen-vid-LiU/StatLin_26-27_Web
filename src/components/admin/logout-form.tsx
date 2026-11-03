"use client";

import { unstable_rethrow } from "next/navigation";
import type { ReactNode } from "react";
import { logout } from "@/app/admin/_actions/auth";

const LOGGED_OUT = "/logga-in?utloggad=1";

/**
 * Utloggningen laddar om hela sidan i stället för att navigera inom appen. Next gömmer besökta sidor (Activity) och
 * behåller deras formulärtext och annat klienttillstånd, också över en utloggning – den som trycker bakåt på en delad
 * dator såg annars det som stod i formuläret. preserving-ui-state.md rekommenderar window.location för utloggning,
 * eftersom en full sidladdning tömmer allt. replace(): ingen extra historikpost för inloggningssidan. Utan JavaScript
 * skickas formuläret till actionen som förut.
 */
export function LogoutForm({ children }: { children: ReactNode }) {
  return (
    <form
      action={logout}
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await logout();
        } catch (err) {
          // Actionens omdirigering till inloggningen kommer hit som Nexts eget fel – då är man utloggad. Andra fel
          // (nätverk, en action som inte finns efter en deploy) betyder att sessionen finns kvar.
          try {
            unstable_rethrow(err);
          } catch {
            window.location.replace(LOGGED_OUT);
            return;
          }
          window.alert("Det gick inte att logga ut – försök igen.");
          return;
        }
        window.location.replace(LOGGED_OUT);
      }}
    >
      {children}
    </form>
  );
}
