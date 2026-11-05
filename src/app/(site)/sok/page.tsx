import type { Metadata } from "next";
import { SiteSearch } from "@/components/search/site-search";
import { SITE_ALTERNATES } from "@/lib/site-metadata";

export const metadata: Metadata = {
  title: "Sök",
  description: "Sök bland evenemang, nyheter, sidor, utskott, styrelsen, dokument, länkar, hjälpmedel och tentastatistik på StatLin.",
  alternates: { ...SITE_ALTERNATES, canonical: "/sok" },
  // Sökträffar är inga egna sidor för sökmotorerna. Länkarna härifrån får de gärna följa.
  robots: { index: false, follow: true },
};

/** Sökfliken. Sidan är statisk och laddas direkt; frågan i adressen (?q=) läses i webbläsaren, så rutan aldrig byts ut medan man skriver. */
export default function SearchPage() {
  return (
    <>
      <h1 className="sr-only">Sök på StatLin</h1>
      <SiteSearch />
    </>
  );
}
