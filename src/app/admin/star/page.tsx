import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { setStarLive } from "@/app/admin/_actions/naringsliv";
import { StarCompanyForm } from "@/components/admin/star-company-form";
import { StarPageForm } from "@/components/admin/star-page-form";
import { AdminHeader, EmptyState, JumpToForm, Notice, StatusBadge } from "@/components/admin/ui";
import { ArrowUpRight, Check, ChevronDown, Edit } from "@/components/icons";
import { requireUser } from "@/lib/auth/session";
import { getSettings } from "@/lib/data/content";
import { getStarEvent, listUpcomingEvents } from "@/lib/data/events";
import { canManageNaringsliv, listStarCompanies } from "@/lib/data/naringsliv";
import { formatDate } from "@/lib/dates";
import { COMPANY_ROLE_LABELS, parseProgram, parseSeeks, SEEK_LABELS, starIsLive } from "@/lib/naringsliv";
import { cn } from "@/lib/utils";

export const metadata = { title: "STAR" };

export default function AdminStar(props: PageProps<"/admin/star">) {
  return (
    <Suspense>
      <StarAdmin searchParams={props.searchParams} />
    </Suspense>
  );
}

async function StarAdmin({ searchParams }: { searchParams: PageProps<"/admin/star">["searchParams"] }) {
  const user = await requireUser();
  if (!canManageNaringsliv(user)) redirect("/admin?nekad=1");
  const [companies, settings, events, sp] = await Promise.all([listStarCompanies(), getSettings(), listUpcomingEvents(200), searchParams]);
  const event = await getStarEvent(Number(settings.star_event_id) || null);
  const live = starIsLive(settings);
  const visible = companies.filter((c) => c.active);
  const sponsors = visible.filter((c) => c.role !== "utstallare");
  const program = event ? parseProgram(event.body_md) : [];
  return (
    <>
      {sp.sparad && <Notice>Företaget är tillagt.</Notice>}
      {sp.raderad && <Notice>Företaget är borttaget.</Notice>}
      <AdminHeader
        title="STAR"
        description="Datum, plats och program kommer från evenemanget. Resten sköts här."
        actions={
          <Link href="/star" target="_blank" className="btn btn-ghost btn-sm">
            {live ? "Visa sidan" : "Förhandsvisa"} <ArrowUpRight size={15} />
          </Link>
        }
      />

      <section aria-labelledby="star-laget" className="rounded-[1.6rem] bg-star-navy p-5 text-white md:p-7">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="kicker flex items-center gap-2 text-white/70">
              <span aria-hidden className={cn("size-2.5 rounded-full", live ? "bg-[#7dffb0]" : "bg-[#ff5a5a]")} />
              {live ? "Live" : "Dold"}
            </p>
            <h2 id="star-laget" className="mt-2 text-2xl font-extrabold tracking-tight">
              {live ? "Sidan syns för alla" : "Sidan är dold för besökare"}
            </h2>
            <p className="mt-2 max-w-2xl text-white/75">
              {live
                ? "Den finns i menyn och på startsidan, och sökmotorer får hitta den. Dölj den om ni behöver göra om något i lugn och ro."
                : "Besökare ser bara att sidan kommer snart, och menyn och startsidan länkar inte hit. Du som är inloggad ser hela sidan, så gör klart den och tryck på knappen när ni är nöjda."}
            </p>
          </div>
          <form action={setStarLive} className="shrink-0">
            <input type="hidden" name="live" value={live ? "0" : "1"} />
            <button type="submit" className={live ? "btn btn-ghost-dark" : "btn btn-red"}>
              {live ? "Dölj sidan" : "Gör sidan live"}
            </button>
          </form>
        </div>
        <ul className="mt-6 grid gap-3 border-t border-white/15 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <Ready ok={!!event} label="Evenemang" text={event ? `${event.title}, ${formatDate(event.starts_at, true)}` : "Inget kommande. Sidan säger att datum kommer snart."} href={event ? `/admin/evenemang/${event.id}` : "/admin/evenemang"} />
          <Ready ok={program.length > 0} label="Program" text={program.length > 0 ? `${program.length} punkter från evenemanget` : "Skrivs i evenemangets text, under rubriken Program."} href={event ? `/admin/evenemang/${event.id}` : "/admin/evenemang"} />
          <Ready ok={visible.length > 0} label="Företag" text={visible.length > 0 ? `${visible.length} syns på sidan` : "Inga än. Sidan säger att de presenteras snart."} href="#foretagen" />
          <Ready ok={sponsors.length > 0} label="Sponsorer" text={sponsors.length > 0 ? `${sponsors.length} syns på sidan` : "Inga än. Avsnittet syns inte förrän det finns någon."} href="#foretagen" />
        </ul>
      </section>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <h2 id="foretagen" className="scroll-mt-24 text-xl font-extrabold tracking-tight">
          Företag och sponsorer
        </h2>
        {/* På telefon ligger formuläret under hela listan. */}
        <JumpToForm href="#nytt-foretag">Nytt företag</JumpToForm>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          {companies.length === 0 ? (
            <EmptyState title="Inga företag ännu">Lägg till det första med formuläret. Tills dess står det att företagen presenteras snart.</EmptyState>
          ) : (
            <ul className="@container divide-y divide-ink/10 overflow-hidden rounded-[1.5rem] border border-ink/10 bg-white">
              {companies.map((c) => (
                <li key={c.id} className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-x-2.5 gap-y-1 px-3.5 py-3.5 @lg:flex @lg:gap-4 @lg:px-5 @lg:py-4">
                  <span className="row-span-2 grid h-10 w-12 shrink-0 place-items-center @lg:w-20">
                    {c.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.logo.thumb} alt="" className="max-h-10 max-w-12 object-contain @lg:max-w-20" />
                    ) : (
                      <span className="text-center text-xs leading-tight text-stone">Ingen logga</span>
                    )}
                  </span>
                  <Link href={`/admin/star/${c.id}`} className="min-w-0 flex-1">
                    <span className="block truncate font-semibold leading-snug @max-lg:whitespace-normal @max-lg:[overflow-wrap:anywhere]">{c.name}</span>
                    <span className="block truncate text-xs text-stone">
                      {[COMPANY_ROLE_LABELS[c.role], ...parseSeeks(c.seeks).map((k) => SEEK_LABELS[k])].join(" · ")}
                    </span>
                  </Link>
                  {/* Bara undantaget syns: alla andra rader är på sidan. */}
                  {!c.active && (
                    <span className="col-start-2 row-start-2 justify-self-start @lg:contents">
                      <StatusBadge published={false} label="Dold" />
                    </span>
                  )}
                  <Link href={`/admin/star/${c.id}`} className="col-start-3 row-span-2 row-start-1 grid size-9 place-items-center rounded-full hover:bg-paper pointer-coarse:size-11" aria-label={`Redigera ${c.name}`}>
                    <Edit size={16} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div id="nytt-foretag" className="scroll-mt-24 lg:col-span-2">
          <StarCompanyForm nextOrder={(companies.length + 1) * 10} />
        </div>
      </div>

      {/* Texterna ändras sällan och är långa, och samma texter går att ändra med pennorna på sidan. */}
      <details id="texterna" className="group mt-8 scroll-mt-24">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-[1.5rem] border border-ink/10 bg-white p-5 outline-none focus-visible:ring-4 focus-visible:ring-ink/10 md:px-7 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block text-base font-bold">Evenemang och texter på sidan</span>
            <span className="mt-1 block text-sm text-stone">Samma texter går att ändra med pennorna på sidan när du är inloggad. Ett tomt fält tar bort texten.</span>
          </span>
          <ChevronDown size={18} className="shrink-0 text-stone transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-5">
          <StarPageForm s={settings} events={events} />
        </div>
      </details>
    </>
  );
}

function Ready({ ok, label, text, href }: { ok: boolean; label: string; text: string; href: string }) {
  return (
    <li>
      <Link href={href} className="group block rounded-xl p-2 -m-2 transition-colors hover:bg-white/[0.06]">
        <span className="flex items-center gap-2 font-semibold">
          <span aria-hidden className={cn("grid size-5 shrink-0 place-items-center rounded-full", ok ? "bg-white text-star-navy" : "border border-white/40")}>
            {ok && <Check size={13} />}
          </span>
          {label}
          <span className="sr-only">{ok ? ": klart" : ": inte klart"}</span>
        </span>
        <span className="mt-1 block text-sm text-white/70 [overflow-wrap:anywhere]">{text}</span>
      </Link>
    </li>
  );
}
