import Link from "next/link";
import { Suspense } from "react";
import { readDb } from "@/lib/data/db";
import { findOpenBox, frageladaIsOpen } from "@/lib/data/fragelada";
import { FrageladaHeader, FrageladaLayout, FrageladaWaiting, NotOpenYet, TrustNotes } from "./public-parts";
import { QuestionFlow } from "./question-flow";

/** De fasta lådorna, /fragelada/ubu och /fragelada/amo: samma väg som med kod, men lappen är framme direkt. */
export function FixedBoxPage({ slug }: { slug: "ubu" | "amo" }) {
  return (
    <>
      <FrageladaHeader />
      <Suspense fallback={<FrageladaWaiting />}>
        <Content slug={slug} />
      </Suspense>
    </>
  );
}

async function Content({ slug }: { slug: "ubu" | "amo" }) {
  const db = await readDb();
  if (!frageladaIsOpen(db)) {
    return (
      <FrageladaLayout>
        <NotOpenYet />
      </FrageladaLayout>
    );
  }
  const box = findOpenBox(db, { slug });
  // En låda utan ägare läses inte av någon, så den tar inte emot något (U-04).
  if (!box) {
    return (
      <FrageladaLayout>
        <NotOpenYet title="Den här lådan är inte öppen just nu">
          Vill du nå oss hittar du alla adresser under{" "}
          <Link href="/kontakt" className="font-semibold text-ink underline underline-offset-2">
            Kontakt
          </Link>
          .
        </NotOpenYet>
      </FrageladaLayout>
    );
  }
  return (
    <FrageladaLayout aside={<TrustNotes />}>
      <QuestionFlow initialBox={{ slug: box.slug, code: box.code, title: box.title, description: box.description }} />
    </FrageladaLayout>
  );
}
