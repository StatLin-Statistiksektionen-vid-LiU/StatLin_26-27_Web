import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo/standard.css";
import "@fontsource-variable/jetbrains-mono/index.css";
import "./globals.css";
import { SITE_ALTERNATES, SITE_OG } from "@/lib/site-metadata";
import { SCROLL_RESTORE_SCRIPT } from "@/lib/scroll-restore";

// Läses vid bygget för förrenderade sidor – se Dockerfile (ARG SITE_URL).
const SITE_URL = process.env.SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "StatLin · Statistiksektionen i Linköping",
    template: "%s · StatLin",
  },
  description:
    "StatLin är sektionen för dig som läser statistik och dataanalys eller Statistics and Machine Learning vid Linköpings universitet. Evenemang, nytt, utskott, studiebevakning och kontakt med arbetslivet.",
  applicationName: "StatLin",
  openGraph: SITE_OG,
  twitter: { card: "summary_large_image" },
  // När icons sätts här lägger Next inte till src/app/icon.svg själv – därför står den med.
  icons: { icon: { url: "/icon.svg", type: "image/svg+xml" }, apple: "/apple-touch-icon.png" },
  alternates: SITE_ALTERNATES,
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <head>
        {/* Markerar att JS körs. Utan klassen döljs skeletten i globals.css, eftersom innehållet aldrig kommer i deras ställe. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <script dangerouslySetInnerHTML={{ __html: SCROLL_RESTORE_SCRIPT }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
