import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";
import { FrageladaHeader, FrageladaLayout, FrageladaWaiting, NotOpenYet, TrustNotes } from "@/components/fragelada/public-parts";
import { QuestionFlow } from "@/components/fragelada/question-flow";
import { clientIp, hashedIp, rateLimitHit, rateLimitReached } from "@/lib/auth/rate-limit";
import { readDb } from "@/lib/data/db";
import { findOpenBox, frageladaIsOpen, listOpenFixedBoxes } from "@/lib/data/fragelada";
import { CODE_LENGTH, normalizeCode, type PublicBox } from "@/lib/fragelada";

export const metadata: Metadata = {
  title: "Frågelådan",
  description: "Ställ en anonym fråga med koden du har fått.",
  // Lådan nås med en kod eller en länk från sidorna som hör till. Den ska inte hittas via sökmotorer, varken stängd eller öppen.
  robots: { index: false, follow: false },
};

export default function FrageladaPage(props: PageProps<"/fragelada">) {
  return (
    <>
      <FrageladaHeader />
      <Suspense fallback={<FrageladaWaiting />}>
        <Content searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function Content({ searchParams }: { searchParams: PageProps<"/fragelada">["searchParams"] }) {
  const db = await readDb();
  if (!frageladaIsOpen(db)) {
    return (
      <FrageladaLayout>
        <NotOpenYet />
      </FrageladaLayout>
    );
  }
  const sp = await searchParams;
  const initialCode = normalizeCode(Array.isArray(sp.kod) ? sp.kod[0] : sp.kod);
  let initialBox: PublicBox | null = null;
  let initialError: string | undefined;
  // En länk med ?kod= öppnar lådan direkt. Fel kod i länken kostar samma försök som i formuläret, annars gick spärren att kringgå här.
  if (initialCode.length === CODE_LENGTH) {
    const key = `fragelada-kod:${hashedIp(clientIp(await headers()))}`;
    if (rateLimitReached(key)) {
      initialError = "Du har försökt för många gånger. Vänta en kvart och försök igen.";
    } else {
      const box = findOpenBox(db, { code: initialCode });
      if (box) {
        initialBox = { slug: box.slug, code: box.code, title: box.title, description: box.description };
      } else {
        rateLimitHit(key);
        initialError = "Koden fungerar inte. Kontrollera den, eller så är lådan stängd.";
      }
    }
  }
  const fixedBoxes = await listOpenFixedBoxes();
  return (
    <FrageladaLayout aside={<TrustNotes />}>
      <QuestionFlow initialBox={initialBox} initialCode={initialBox ? "" : initialCode} initialError={initialError} fixedBoxes={fixedBoxes} />
    </FrageladaLayout>
  );
}
