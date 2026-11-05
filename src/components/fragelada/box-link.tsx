import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { findOpenBox } from "@/lib/data/fragelada";
import { readDb } from "@/lib/data/db";

async function OpenBoxLink({ slug, className, children }: { slug: "ubu" | "amo"; className?: string; children: ReactNode }) {
  const db = await readDb();
  if (!findOpenBox(db, { slug })) return null;
  return (
    <Link href={`/fragelada/${slug}`} className={className}>
      {children}
    </Link>
  );
}

/** Länk till en fast låda. Syns bara när funktionen är på och lådan har en ägare, annars ser sidan ut som vanligt. */
export function FixedBoxLink(props: { slug: "ubu" | "amo"; className?: string; children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <OpenBoxLink {...props} />
    </Suspense>
  );
}
