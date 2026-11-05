import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { deleteBox, deleteQuestion, emptyBox, setBoxClosed, setQuestionHandled } from "@/app/admin/_actions/fragelada";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { AdminHeader, EmptyState, Notice } from "@/components/admin/ui";
import { BoxForm } from "@/components/fragelada/box-form";
import { MarkBoxSeen } from "@/components/fragelada/mark-box-seen";
import { ShareCode } from "@/components/fragelada/share-code";
import { Check, Eye } from "@/components/icons";
import { CopyButton } from "@/components/ui/copy-button";
import { requireUser } from "@/lib/auth/session";
import { boxStateLabel, getOwnBox, listOwnQuestions } from "@/lib/data/fragelada";
import { todayLocal } from "@/lib/dates";
import { siteUrl } from "@/lib/site-url";
import { cn } from "@/lib/utils";

export const metadata = { title: "Låda" };

export default function BoxPage(props: PageProps<"/admin/fragelada/[id]">) {
  return (
    <Suspense>
      <Box params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

const monthLabel = (month: string) => {
  const names = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];
  const [y, m] = month.split("-").map(Number);
  return `${names[m - 1] ?? month} ${y}`;
};

async function Box({ params, searchParams }: { params: PageProps<"/admin/fragelada/[id]">["params"]; searchParams: PageProps<"/admin/fragelada/[id]">["searchParams"] }) {
  const user = await requireUser();
  const { id: raw } = await params;
  const sp = await searchParams;
  if (!/^\d+$/.test(raw)) notFound();
  const id = Number(raw);
  const box = await getOwnBox(id, user.id);
  // Samma svar oavsett om lådan finns: administratörer ser titlar och antal i listan, men kommer inte in här.
  if (!box) redirect("/admin/fragelada?nekad=1");
  const questions = await listOwnQuestions(box.id, user.id);
  const base = await siteUrl();
  const link = box.slug ? `${base}/fragelada/${box.slug}` : `${base}/fragelada?kod=${box.code}`;
  const state = boxStateLabel(box, todayLocal());

  return (
    <>
      {box.unseen > 0 && <MarkBoxSeen boxId={box.id} />}
      {sp.skapad && <Notice>Lådan är skapad. Här under finns färdiga texter för att skicka koden i ett mejl eller via läraren.</Notice>}
      {sp.borttagen && <Notice>Frågan är borttagen.</Notice>}
      {sp.tomd && <Notice>Lådan är tom.</Notice>}
      <AdminHeader back={{ href: "/admin/fragelada", label: "Frågelådan" }} kicker={state.label} title={<span className="break-words">{box.title}</span>} description={box.description || undefined} />

      <section aria-label="Kod och länk" className="rounded-[1.6rem] bg-ink p-5 text-white md:p-7">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="kicker text-white/50">{box.code ? "Koden" : "Adressen"}</p>
            {box.code ? (
              <p className="mt-2 font-mono text-[clamp(2.4rem,9vw,4.2rem)] font-bold leading-none tracking-[0.08em]">{box.code}</p>
            ) : (
              <p className="mt-2 break-all font-mono text-xl font-bold">/fragelada/{box.slug}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/fragelada/${box.id}/skarm`} className="btn btn-light btn-sm">
              <Eye size={15} /> Visa på skärm
            </Link>
            <CopyButton value={link} label="Kopiera länk" className="btn btn-ghost-dark btn-sm font-sans" />
          </div>
        </div>
      </section>

      <ShareCode boxId={box.id} title={box.title} code={box.code} link={link} base={base} sender={user.name} />

      <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-xl font-extrabold tracking-tight">
          Frågor <span className="font-mono text-base font-normal text-stone tabular">{box.total}</span>
        </h2>
        {box.total > 0 && (
          <ConfirmButton action={emptyBox} id={box.id} message={`Radera alla ${box.total} frågor i lådan? Det går inte att ångra.`}>
            Töm lådan
          </ConfirmButton>
        )}
      </div>
      <p className="mt-1 text-[0.95rem] text-stone">Frågorna har inget namn och inget klockslag, bara månaden. De raderas av sig själva efter ungefär ett år.</p>

      {questions.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="Inga frågor än">När någon skriver dyker frågan upp här, och du får en siffra i menyn. Inget mejl skickas.</EmptyState>
        </div>
      ) : (
        <ul className="mt-5 grid gap-4 md:grid-cols-2">
          {questions.map((q) => (
            <li key={q.id} className={cn("flex flex-col rounded-md bg-white p-5 shadow-[0_10px_26px_-22px_rgb(10_10_10/0.6),0_0_0_1px_rgb(10_10_10/0.07)]", q.handled === 1 && "bg-paper-2/70 shadow-none")}>
              <p className="flex items-center justify-between gap-3 font-mono text-xs uppercase tracking-wider text-stone">
                {monthLabel(q.month)}
                {q.handled === 1 && (
                  <span className="inline-flex items-center gap-1 font-semibold text-ink">
                    <Check size={13} /> Hanterad
                  </span>
                )}
              </p>
              {/* Ren text: React escapar innehållet, och det går aldrig genom markdown. */}
              <p className={cn("mt-3 flex-1 whitespace-pre-wrap break-words font-serif text-[1.05rem] leading-relaxed", q.handled === 1 && "text-ink/70")}>{q.body}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <form action={setQuestionHandled}>
                  <input type="hidden" name="id" value={q.id} />
                  <input type="hidden" name="handled" value={q.handled ? "0" : "1"} />
                  <button type="submit" className="btn btn-sm btn-ghost bg-white">
                    {q.handled ? "Ångra hanterad" : "Markera som hanterad"}
                  </button>
                </form>
                <ConfirmButton action={deleteQuestion} id={q.id} message="Ta bort den här frågan? Det går inte att ångra.">
                  Ta bort
                </ConfirmButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <details className="mt-12 rounded-2xl border border-ink/10 bg-white p-5">
        <summary className="tryck cursor-pointer font-bold">Inställningar för lådan</summary>
        <div className="mt-5 space-y-6">
          <BoxForm box={box} />
          {box.slug === null && (
            <div className="flex flex-wrap gap-2 border-t border-ink/10 pt-5">
              <form action={setBoxClosed}>
                <input type="hidden" name="id" value={box.id} />
                <input type="hidden" name="closed" value={box.closed ? "0" : "1"} />
                <button type="submit" className="btn btn-sm btn-ghost bg-white">
                  {box.closed ? "Öppna lådan" : "Stäng lådan"}
                </button>
              </form>
              <ConfirmButton action={deleteBox} id={box.id} message={`Ta bort lådan "${box.title}" och alla ${box.total} frågor i den? Det går inte att ångra.`}>
                Ta bort lådan
              </ConfirmButton>
            </div>
          )}
        </div>
      </details>
    </>
  );
}
