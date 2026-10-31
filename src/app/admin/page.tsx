import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { DueLabel, PersonChip } from "@/components/admin/task-ui";
import { AdminHeader, Card, Notice, StatusBadge } from "@/components/admin/ui";
import { ArrowUpRight, Board, Calendar, Check, Image as ImageIcon, Layers, Newspaper, Plus } from "@/components/icons";
import { canReviewEvents } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { dashboardStats, listAudit } from "@/lib/data/admin";
import { getCommitteeById } from "@/lib/data/content";
import { listEventsForAdmin } from "@/lib/data/events";
import { listNewsForAdmin } from "@/lib/data/news";
import { listOpenTasksTo } from "@/lib/data/tasks";
import { formatDate, formatTimestamp, nowLocal, parts } from "@/lib/dates";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type EventItem, type SessionUser, type Task } from "@/lib/types";
import { cn, initials } from "@/lib/utils";

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
  task: "uppdraget",
};
const ACTION_LABELS: Record<string, string> = {
  create: "skapade",
  update: "uppdaterade",
  delete: "tog bort",
  upload: "laddade upp",
  check: "granskade",
  uncheck: "ångrade granskningen av",
  status: "ändrade status på",
  claim: "tog",
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
  return (
    <>
      {sp.nekad && <Notice tone="warning">Du har inte behörighet till den sidan.</Notice>}
      {user.role === "committee" ? <CommitteeDashboard user={user} /> : <EditorDashboard user={user} />}
    </>
  );
}

const upcomingOf = (events: EventItem[], now: string) => events.filter((e) => e.starts_at >= now.slice(0, 10)).reverse().slice(0, 5);
const needingImages = (events: EventItem[], now: string) => events.filter((e) => e.starts_at < now && e.image_count === 0 && e.published).slice(0, 4);
/** "e-STIG" och "eSTIG" är samma sak – används för att inte visa samma namn två gånger. */
const simplify = (s: string) => s.toLowerCase().replace(/[^a-z0-9åäö]/g, "");

/** Utskottens egen översikt: deras färg och logga, stora knappar för det vanligaste och bara deras eget innehåll. */
async function CommitteeDashboard({ user }: { user: SessionUser }) {
  const committee = user.committee_id ? await getCommitteeById(user.committee_id) : null;
  const [events, news, myTasks] = await Promise.all([
    committee ? listEventsForAdmin(committee.id) : [],
    committee ? listNewsForAdmin(committee.id) : [],
    listOpenTasksTo(user.id, 4),
  ]);
  const now = nowLocal();
  const nowIso = new Date().toISOString();
  const upcoming = upcomingOf(events, now);
  const needsImages = needingImages(events, now);
  const latestNews = news.slice(0, 4);

  // Styrelseposter utan eget utskott (kassör, grafiskt ansvarig …) visas med sin post och har ingen egen sida.
  const board = committee?.kind === "styrelse";
  const title = board ? user.post || user.name : (committee?.short_name ?? user.name);
  const subtitle = board
    ? "Lägg upp evenemang och nyheter i styrelsens namn."
    : committee && simplify(committee.name) !== simplify(title)
      ? committee.name
      : null;
  const postIsName = [committee?.short_name, committee?.name].some((n) => n && simplify(n) === simplify(user.post));
  const kicker = board ? "Styrelsen" : user.post && !postIsName ? user.post : committee?.kind === "utskott" ? "Utskott" : "Post";
  const publicHref = !committee ? null : board ? "/sektionen/styrelsen" : committee.visible ? `/utskott/${committee.slug}` : null;
  const accent = committee?.accent ?? "#ff0707";

  const actions = [
    { href: "/admin/evenemang/ny", label: "Nytt evenemang", hint: "Sittning, pub, turnering …", Icon: Calendar },
    { href: "/admin/nyheter/ny", label: "Ny nyhet", hint: "Berätta vad som är på gång.", Icon: Newspaper },
    board || !committee
      ? { href: "/admin/uppdrag/ny", label: "Nytt uppdrag", hint: "Be en annan post om hjälp.", Icon: Board }
      : { href: `/admin/utskott/${committee.id}`, label: "Redigera vår sida", hint: "Beskrivning, logga och färg.", Icon: Layers },
  ];

  return (
    <>
      {!committee && <Notice tone="warning">Ditt konto är inte kopplat till något utskott. Be en administratör koppla det under Konton.</Notice>}
      <header className="noise relative mb-6 overflow-hidden rounded-[2rem] bg-ink p-6 text-white md:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-40 size-[30rem] rounded-full opacity-60 blur-3xl"
          style={{ background: `radial-gradient(closest-side, ${accent}, transparent)` }}
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-5">
            <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white p-2 md:size-20">
              {committee?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={committee.logo_url} alt="" className="size-full object-contain" />
              ) : (
                <span className="display-tight text-xl" style={{ color: accent }}>
                  {initials(title)}
                </span>
              )}
            </span>
            <div className="min-w-0">
              <p className="kicker text-white/50">{kicker}</p>
              <h1 className="display-tight mt-1 truncate text-[clamp(2rem,5vw,3.25rem)] normal-case">{title}</h1>
              {subtitle && <p className="mt-1 text-white/60">{subtitle}</p>}
            </div>
          </div>
          {publicHref && (
            <Link href={publicHref} target="_blank" className="btn btn-ghost-dark btn-sm shrink-0 self-start sm:self-center">
              Visa vår sida <ArrowUpRight size={15} />
            </Link>
          )}
        </div>
      </header>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {actions.map(({ href, label, hint, Icon }, i) => (
          <li key={href}>
            <Link
              href={href}
              className={cn(
                "flex h-full items-center gap-4 rounded-[1.5rem] border p-5 transition-colors md:p-6",
                i === 0 ? "border-transparent bg-red text-white hover:bg-red-deep" : "border-ink/10 bg-white hover:border-ink/30",
              )}
            >
              <span className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", i === 0 ? "bg-white/15" : "bg-paper text-red")}>
                <Icon size={22} />
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-bold leading-tight">{label}</span>
                <span className={cn("mt-1 block text-sm", i === 0 ? "text-white/75" : "text-stone")}>{hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <MyTasks tasks={myTasks} />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Våra kommande evenemang</h2>
            <Link href="/admin/evenemang" className="text-sm font-semibold text-red-deep hover:underline">
              Alla
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="mt-6 text-sm text-stone">Inga kommande evenemang. Dags att planera något?</p>
          ) : (
            <EventList events={upcoming} side={(e) => <StatusBadge published={!!e.published} />} />
          )}
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Våra nyheter</h2>
            <Link href="/admin/nyheter" className="text-sm font-semibold text-red-deep hover:underline">
              Alla
            </Link>
          </div>
          {latestNews.length === 0 ? (
            <p className="mt-6 text-sm text-stone">Inga nyheter ännu.</p>
          ) : (
            <ul className="mt-4 divide-y divide-ink/10">
              {latestNews.map((n) => (
                <li key={n.id}>
                  <Link href={`/admin/nyheter/${n.id}`} className="flex items-center gap-3 py-3 hover:opacity-80">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{n.title}</span>
                      <span className="block text-xs text-stone">{formatTimestamp(n.published_at)}</span>
                    </span>
                    <StatusBadge
                      published={!!n.published && n.published_at <= nowIso}
                      label={!n.published ? "Utkast" : n.published_at > nowIso ? "Schemalagd" : "Publicerad"}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <NeedsImages events={needsImages} />
    </>
  );
}

async function EditorDashboard({ user }: { user: SessionUser }) {
  const [stats, events, audit, myTasks] = await Promise.all([dashboardStats(null), listEventsForAdmin(null), listAudit(10), listOpenTasksTo(user.id, 4)]);
  const now = nowLocal();
  const upcoming = upcomingOf(events, now);
  const needsImages = needingImages(events, now);
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
      <AdminHeader
        kicker={ROLE_LABELS[user.role]}
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

      <MyTasks tasks={myTasks} />

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
              <p className="mt-1 text-sm text-stone">Nya och ändrade evenemang från utskotten och övriga poster. Granskningen påverkar inte vad som visas på sajten.</p>
              <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
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
            <EventList events={upcoming} meta={(e) => e.committee?.short_name ?? "—"} />
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

      <NeedsImages events={needsImages} />
    </>
  );
}

function MyTasks({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) return null;
  return (
    <section aria-labelledby="uppdrag-till-dig" className="mt-8 rounded-[1.5rem] border border-ink/10 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 id="uppdrag-till-dig" className="flex items-center gap-2 font-bold">
          <Board size={18} className="text-red" /> Uppdrag till dig
        </h2>
        <Link href="/admin/uppdrag?visa=till" className="text-sm font-semibold text-red-deep hover:underline">
          Tavlan
        </Link>
      </div>
      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {tasks.map((t) => (
          <li key={t.id}>
            <Link href={`/admin/uppdrag/${t.id}`} className="flex items-center gap-3 rounded-2xl border border-ink/10 p-4 hover:border-ink/30">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{t.title}</span>
                <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone">
                  <span className="inline-flex min-w-0 items-center gap-1">
                    från <PersonChip person={t.from} className="font-medium text-ink" />
                  </span>
                  {t.due_date && <DueLabel date={t.due_date} />}
                </span>
              </span>
              <ArrowUpRight size={16} className="shrink-0 text-stone" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Kommande evenemang med datumbricka. meta hamnar på raden under titeln och side till höger,
 * så att översikterna kan visa utskott respektive publiceringsstatus.
 */
function EventList({ events, meta, side }: { events: EventItem[]; meta?: (e: EventItem) => ReactNode; side?: (e: EventItem) => ReactNode }) {
  return (
    <ul className="mt-4 divide-y divide-ink/10">
      {events.map((e) => {
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
                  {meta && <>{meta(e)} · </>}
                  {e.starts_at.slice(11)} {!side && !e.published && "· Utkast"}
                </span>
              </span>
              {side && <span className="shrink-0">{side(e)}</span>}
              <ArrowUpRight size={16} className="shrink-0 text-stone" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function NeedsImages({ events }: { events: EventItem[] }) {
  if (events.length === 0) return null;
  return (
    <Card className="mt-6 p-6">
      <h2 className="font-bold">Saknar bilder</h2>
      <p className="mt-1 text-sm text-stone">De här evenemangen har varit – ladda upp bilder så hamnar de i galleriet.</p>
      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {events.map((e) => (
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
  );
}
