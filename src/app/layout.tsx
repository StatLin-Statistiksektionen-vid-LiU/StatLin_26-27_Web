import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo/standard.css";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/jetbrains-mono/index.css";
import "./globals.css";

// Läses vid bygget för förrenderade sidor – se Dockerfile (ARG SITE_URL).
const SITE_URL = process.env.SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "StatLin – Statistiksektionen i Linköping",
    template: "%s · StatLin",
  },
  description:
    "StatLin är sektionen för dig som läser statistik och dataanalys vid Linköpings universitet. Evenemang, nyheter, utskott, studiebevakning och kontakt med arbetslivet.",
  applicationName: "StatLin",
  openGraph: {
    type: "website",
    locale: "sv_SE",
    siteName: "StatLin",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "StatLin – Statistiksektionen i Linköping" }],
  },
  twitter: { card: "summary_large_image" },
  // När icons sätts här lägger Next inte till src/app/icon.svg själv – därför står den med.
  icons: { icon: { url: "/icon.svg", type: "image/svg+xml" }, apple: "/apple-touch-icon.png" },
  alternates: { types: { "text/calendar": "/kalender.ics" } },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <head>
        {/* Markerar att JS körs, så att scroll-animationer inte döljer innehåll utan JS. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
