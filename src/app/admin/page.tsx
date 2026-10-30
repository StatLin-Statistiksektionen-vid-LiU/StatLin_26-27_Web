import Link from "next/link";
import { Suspense } from "react";
import { AdminHeader, Card, Notice } from "@/components/admin/ui";
import { ArrowUpRight, Calendar, Check, Image as ImageIcon, Newspaper, Plus } from "@/components/icons";
import { canReviewEvents } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { dashboardStats, listAudit } from "@/lib/data/admin";
import { listEventsForAdmin } from "@/lib/data/events";
import { formatDate, formatTimestamp, nowLocal, parts } from "@/lib/dates";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/types";

const ENTITY_LABELS: Record<string, string> = {
  event: "evenemang",
  event_image: "bild",
  news: "nyhet",
  board: "styrelsepost",
  committee: "utskott",
  page: "sida",
  document: "dokument",
  partner: "partner",
  user: "konto",
  settings: "inställningar",
};
const ACTION_LABELS: Record<string, string> = {
  create: "skapade",
  update: "uppdaterade",
  delete: "tog bort",
  upload: "laddade upp",
  check: "granskade",
  uncheck: "ångrade granskningen av",
};

export default function Dashboard(props: PageProps<"/admin">) {
  return (
    <Suspense>
      <DashboardContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function DashboardContent({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  const user = await requireUser();
  const sp = await searchParams;
  const scope = user.role === "committee" ? user.committee_id : null;
  const [stats, events, audit] = await Promise.all([dashboardStats(scope), listEventsForAdmin(scope), listAudit(10, user.role === "committee" ? user.id : undefined)]);
  const now = nowLocal();
  const upcoming = events.filter((e) => e.starts_at >= now.slice(0, 10)).reverse().slice(0, 5);
  const needsImages = events.filter((e) => e.starts_at < now && e.image_count === 0 && e.published).slice(0, 4);
  const toReview = canReviewEvents(user) ? events.filter((e) => !e.checked_at).sort((a, b) => b.updated_at.localeCompare(a.updated_at)) : null;
  const first = user.name.split(" ")[0];

  const cards = [
    { label: "Kommande evenemang", value: stats.upcoming, href: "/admin/evenemang", Icon: Calendar },
    { label: "Publicerade nyheter", value: stats.news, href: "/admin/nyheter", Icon: Newspaper },
    { label: "Bilder i gallerier", value: stats.images, href: "/admin/evenemang", Icon: ImageIcon },
    { label: "Utkast", value: stats.drafts, href: "/admin/evenemang", Icon: Plus },
  ];

  return (
    <>
      {sp.nekad && <Notice tone="warning">Du har inte behörighet till den sidan.</Notice>}
      <AdminHeader
        kicker={`${ROLE_LABELS[user.role]}${user.committee_name && user.role === "committee" ? ` · ${user.committee_name}` : ""}`}
        title={
          <>
            Hej {first} <span className="inline-block origin-[70%_70%] animate-[wave_2.4s_ease-in-out_1]">👋</span>
          </>
        }
        description={ROLE_DESCRIPTIONS[user.role]}
        actions={
          <>
            <Link href="/admin/nyheter/ny" className="btn btn-ghost bg-white">
              <Plus size={18} /> Ny nyhet
            </Link>
            <Link href="/admin/evenemang/ny" className="btn btn-red">
              <Plus size={18} /> Nytt evenemang
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map(({ label, value, href, Icon }) => (
          <Link key={label} href={href} className="group rounded-[1.5rem] border border-ink/10 bg-white p-5 transition-colors hover:border-ink/30">
            <div className="flex items-center justify-between">
              <span className="kicker text-stone">{label}</span>
              <Icon size={18} className="text-red" />
            </div>
            <p className="display mt-4 text-[2.6rem] tabular">{value}</p>
          </Link>
        ))}
      </div>

      {toReview && (
        <section aria-labelledby="att-granska" className="mt-8 rounded-[1.5rem] border border-ink/10 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 id="att-granska" className="font-bold">
              Att granska
            </h2>
            {toReview.length > 0 && (
              <Link href="/admin/evenemang?visa=ogranskade" className="text-sm font-semibold text-red-deep hover:underline">
                Alla {toReview.length}
              </Link>
            )}
          </div>
          {toReview.length === 0 ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-stone">
              <Check size={16} className="text-emerald-700" /> Allt är granskat.
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-stone">Nya och ändrade evenemang från utskotten och info. Granskningen påverkar inte vad som visas på sajten.</p>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {toReview.slice(0, 6).map((e) => (
                  <li key={e.id}>
                    <Link href={`/admin/evenemang/${e.id}`} className="flex items-center gap-3 rounded-2xl border border-ink/10 p-4 hover:border-ink/30">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{e.title}</span>
                        <span className="block text-xs text-stone">
                          {e.committee?.short_name ?? "Hela sektionen"} · {formatDate(e.starts_at)} {!e.published && "· Utkast"}
                        </span>
                      </span>
                      <ArrowUpRight size={16} className="shrink-0 text-stone" />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Kommande evenemang</h2>
            <Link href="/admin/evenemang" className="text-sm font-semibold text-red-deep hover:underline">
              Alla
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="mt-6 text-sm text-stone">Inga kommande evenemang. Dags att planera något?</p>
          ) : (
            <ul className="mt-4 divide-y divide-ink/10">
              {upcoming.map((e) => {
                const p = parts(e.starts_at);
                return (
                  <li key={e.id}>
                    <Link href={`/admin/evenemang/${e.id}`} className="flex items-center gap-4 py-3 hover:opacity-80">
                      <span className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-paper py-1.5 tabular">
                        <span className="kicker text-[0.55rem] text-red">{p.monthShort}</span>
                        <span className="text-lg font-bold leading-none">{p.day}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">{e.title}</span>
                        <span className="block text-xs text-stone">
                          {e.committee?.short_name ?? "—"} · {e.starts_at.slice(11)} {!e.published && "· Utkast"}
                        </span>
                      </span>
                      <ArrowUpRight size={16} className="text-stone" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h2 className="font-bold">Senaste ändringar</h2>
          {audit.length === 0 ? (
            <p className="mt-6 text-sm text-stone">Inget har ändrats ännu.</p>
          ) : (
            <ol className="mt-4 space-y-3.5">
              {audit.map((a) => (
                <li key={a.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-red" aria-hidden />
                  <span className="min-w-0">
                    <span className="font-semibold">{a.user_name ?? "Någon"}</span> {ACTION_LABELS[a.action] ?? a.action} {ENTITY_LABELS[a.entity] ?? a.entity}
                    {a.summary && <span className="block truncate text-stone">{a.summary}</span>}
                    <span className="block font-mono text-[0.7rem] text-stone-light">{formatTimestamp(a.created_at)}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      {needsImages.length > 0 && (
        <Card className="mt-6 p-6">
          <h2 className="font-bold">Saknar bilder</h2>
          <p className="mt-1 text-sm text-stone">De här evenemangen har varit – ladda upp bilder så hamnar de i galleriet.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {needsImages.map((e) => (
              <li key={e.id}>
                <Link href={`/admin/evenemang/${e.id}#galleri`} className="flex items-center gap-3 rounded-2xl border border-dashed border-ink/20 p-4 hover:border-red">
                  <ImageIcon size={20} className="shrink-0 text-red" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{e.title}</span>
                    <span className="block text-xs text-stone">{formatDate(e.starts_at)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
