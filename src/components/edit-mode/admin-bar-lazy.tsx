"use client";

import dynamic from "next/dynamic";

/**
 * Bubblan, redigeringslådan och alla adminformulär hämtas bara när någon är inloggad. Importerade admin-bar-loader.tsx AdminBar direkt
 * följde koden med i varje sidas JavaScript, även till besökare som aldrig ser den: Next delar inte upp klientkomponenter som en
 * serverkomponent importerar, bara sådana som en klientkomponent hämtar med next/dynamic
 * (node_modules/next/dist/docs/01-app/02-guides/lazy-loading.md).
 */
export const AdminBarLazy = dynamic(() => import("./admin-bar").then((m) => m.AdminBar));
