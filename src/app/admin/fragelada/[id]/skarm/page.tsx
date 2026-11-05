import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import "@/components/fragelada/fragelada.css";
import { Close } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { getOwnBox } from "@/lib/data/fragelada";
import { siteUrl } from "@/lib/site-url";

export const metadata = { title: "Visa på skärm" };

export default function ScreenPage(props: PageProps<"/admin/fragelada/[id]/skarm">) {
  return (
    <Suspense>
      <Screen params={props.params} />
    </Suspense>
  );
}

/** Helsidan för föreläsningssalen: bara koden och adressen, stort nog att läsas från sista raden. */
async function Screen({ params }: { params: PageProps<"/admin/fragelada/[id]/skarm">["params"] }) {
  const user = await requireUser();
  const { id: raw } = await params;
  if (!/^\d+$/.test(raw)) notFound();
  const box = await getOwnBox(Number(raw), user.id);
  if (!box) redirect("/admin/fragelada?nekad=1");
  const host = (await siteUrl()).replace(/^https?:\/\//, "");

  return (
    <div className="fixed inset-0 z-[80] flex flex-col overflow-auto bg-paper p-6 text-ink md:p-10">
      <div className="flex items-start justify-between gap-6">
        <p className="min-w-0 text-[clamp(1.1rem,2.4vw,2rem)] font-bold break-words">{box.title}</p>
        <Link href={`/admin/fragelada/${box.id}`} aria-label="Stäng skärmvisningen" className="grid size-11 shrink-0 place-items-center rounded-full border border-ink/20 bg-white hover:border-ink">
          <Close size={20} />
        </Link>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-[clamp(1.5rem,5vh,3.5rem)] py-8 text-center">
        <p className="kicker text-[clamp(0.8rem,1.6vw,1.25rem)] text-stone">Ställ en anonym fråga</p>
        {box.code ? <p className="fl-screen-code">{box.code}</p> : null}
        <p className="break-all font-mono text-[clamp(1.2rem,3.6vw,3.2rem)] font-bold">
          {host}/fragelada{box.slug ? `/${box.slug}` : ""}
        </p>
        <p className="text-[clamp(1rem,2vw,1.6rem)] text-stone">{box.code ? "Gå till adressen och skriv koden. Inget namn behövs." : "Gå till adressen och skriv. Inget namn behövs."}</p>
      </div>
    </div>
  );
}
