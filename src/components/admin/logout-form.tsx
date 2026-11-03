"use client";

import type { ReactNode } from "react";
import { logout } from "@/app/admin/_actions/auth";

/**
 * Utloggningen laddar om hela sidan i stället för att navigera inom appen. Next gömmer besökta sidor (Activity) och
 * behåller deras formulärtext och annat klienttillstånd, också över en utloggning – den som trycker bakåt på en delad
 * dator såg annars det som stod i formuläret. preserving-ui-state.md rekommenderar window.location.href för
 * utloggning, eftersom en full sidladdning tömmer allt. Utan JavaScript skickas formuläret till actionen som förut.
 */
export function LogoutForm({ children }: { children: ReactNode }) {
  return (
    <form
      action={logout}
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await logout();
        } catch {
          // Actionens omdirigering kommer hit som ett fel – sidan laddas om här i stället.
        }
        // En full sidladdning med avsikt – router.push() skulle behålla de dolda sidorna.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/logga-in?utloggad=1";
      }}
    >
      {children}
    </form>
  );
}
