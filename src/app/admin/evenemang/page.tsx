import Link from "next/link";
import { Suspense } from "react";
import { AdminHeader, EmptyState, Notice, ReviewBadge, StatusBadge } from "@/components/admin/ui";
import { ArrowUpRight, Edit, Image as ImageIcon, Plus } from "@/components/icons";
import { canReviewEvents } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { listEventsForAdmin } from "@/lib/data/events";
import { formatDate, nowLocal } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const metadata = { title: "Evenemang" };

export default function AdminEvents(props: PageProps<"/admin/evenemang">) {
  return (
    <Suspense>
      <Events searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Events({ searchParams }: { searchParams: PageProps<"/admin/evenemang">["searchParams"] }) {
  const user = await requireUser();
  const sp = await searchParams;
  const reviewer = canReviewEvents(user);
  const tab = sp.visa === "tidigare" ? "tidigare" : sp.visa === "ogranskade" && reviewer ? "ogranskade" : "kommande";
  const events = await listEventsForAdmin(user.role === "committee" ? user.committee_id : null);
  const now = nowLocal();
  const isUpcoming = (e: (typeof events)[number]) => (e.ends_at ?? `${e.starts_at.slice(0, 10)}T23:59`) >= now;
  const list =
    tab === "kommande"
      ? events.filter(isUpcoming).reverse()
      : tab === "tidigare"
        ? events.filter((e) => !isUpcoming(e))
        : events.filter((e) => !e.checked_at).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const tabs = [
    { key: "kommande", href: "/admin/evenemang" },
    { key: "tidigare", href: "/admin/evenemang?visa=tidigare" },
    ...(reviewer ? [{ key: "ogranskade", href: "/admin/evenemang?visa=ogranskade" }] : []),
  ];

  return (
    <>
      {sp.raderad && <Notice>Evenemanget är borttaget.</Notice>}
      <AdminHeader
        title="Evenemang"
        description={user.role === "committee" ? `Evenemang för ${user.committee_name}.` : "Alla sektionens evenemang."}
        actions={
          <Link href="/admin/evenemang/ny" className="btn btn-red">
            <Plus size={18} /> Nytt evenemang
          </Link>
        }
      />
      <div className="mb-5 inline-flex rounded-full border border-ink/15 bg-white p-1">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.href}
            className={cn("rounded-full px-5 py-2 text-sm font-semibold capitalize", tab === t.key ? "bg-ink text-white" : "text-ink/60 hover:text-ink")}
          >
            {t.key}
          </Link>
        ))}
      </div>
      {tab === "ogranskade" && (
        <p className="-mt-2 mb-5 text-sm text-stone">Senast ändrade först. Granskningen påverkar inte vad som visas på sajten.</p>
      )}

      {list.length === 0 ? (
        tab === "ogranskade" ? (
          <EmptyState title="Allt är granskat">Nya evenemang från utskotten och övriga poster hamnar här.</EmptyState>
        ) : (
          <EmptyState
            title={tab === "kommande" ? "Inga kommande evenemang" : "Inga tidigare evenemang"}
            action={
              <Link href="/admin/evenemang/ny" className="btn btn-ink">
                <Plus size={18} /> Skapa ett
              </Link>
            }
          />
        )
      ) : (
        <div className="overflow-hidden rounded-[1.5rem] border border-ink/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 bg-paper/60">
              <tr className="kicker text-stone">
                <th className="px-5 py-3 font-medium">Evenemang</th>
                <th className="hidden px-3 py-3 font-medium md:table-cell">Datum</th>
                <th className="hidden px-3 py-3 font-medium sm:table-cell">Status</th>
                <th className="hidden px-3 py-3 font-medium lg:table-cell">Bilder</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {list.map((e) => (
                <tr key={e.id} className="group hover:bg-paper/40">
                  <td className="px-5 py-4">
                    <Link href={`/admin/evenemang/${e.id}`} className="block">
                      <span className="block font-semibold group-hover:text-red-deep">{e.title}</span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs text-stone">
                        {e.committee && (
                          <>
                            <span className="size-1.5 rounded-full" style={{ background: e.committee.accent }} />
                            {e.committee.short_name}
                          </>
                        )}
                        <span className="md:hidden">· {formatDate(e.starts_at)}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="hidden whitespace-nowrap px-3 py-4 tabular md:table-cell">
                    {formatDate(e.starts_at, true)} <span className="text-stone">{e.all_day ? "" : e.starts_at.slice(11)}</span>
                  </td>
                  <td className="hidden px-3 py-4 sm:table-cell">
                    <span className="flex flex-wrap gap-1.5">
                      <StatusBadge published={!!e.published} />
                      <ReviewBadge checked={!!e.checked_at} />
                    </span>
                  </td>
                  <td className="hidden px-3 py-4 lg:table-cell">
                    <span className="inline-flex items-center gap-1.5 text-stone">
                      <ImageIcon size={15} /> {e.image_count}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right">
                    <Link href={`/admin/evenemang/${e.id}`} className="inline-grid size-9 place-items-center rounded-full hover:bg-paper" aria-label="Redigera">
                      <Edit size={16} />
                    </Link>
                    {!!e.published && (
                      <Link href={`/evenemang/${e.slug}`} target="_blank" className="inline-grid size-9 place-items-center rounded-full hover:bg-paper" aria-label="Visa på sajten">
                        <ArrowUpRight size={16} />
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
