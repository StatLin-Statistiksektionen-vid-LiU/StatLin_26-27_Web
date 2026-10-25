import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowUpRight, Download, FileText } from "@/components/icons";
import { PageHero } from "@/components/ui/page-hero";
import { PageSkeleton } from "@/components/ui/skeletons";
import { listDocuments } from "@/lib/data/content";
import { formatDate } from "@/lib/dates";
import { DOCUMENT_CATEGORIES, type DocumentCategory } from "@/lib/types";
import { formatBytes, safeExternalUrl } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dokument",
  description: "Stadgar, reglemente, protokoll och grafiskt styrdokument för StatLin.",
};

export default function DocumentsPage() {
  return (
    <>
      <PageHero
        kicker="Sektionen / Dokument"
        title={
          <>
            Doku<span className="text-red">ment</span>
          </>
        }
        lead="Stadgar, reglemente, mötesprotokoll och styrdokument. Allt som styr sektionen, samlat på ett ställe."
      />
      <Suspense fallback={<PageSkeleton />}>
        <Documents />
      </Suspense>
    </>
  );
}

async function Documents() {
  const docs = await listDocuments({ publishedOnly: true });
  const categories = Object.keys(DOCUMENT_CATEGORIES) as DocumentCategory[];
  const grouped = categories.map((c) => ({ c, docs: docs.filter((d) => d.category === c) })).filter((g) => g.docs.length > 0);

  return (
    <section className="container-site py-16 md:py-24">
      {grouped.length === 0 && <p className="text-center text-stone">Inga dokument uppladdade ännu.</p>}
      <div className="space-y-16">
        {grouped.map(({ c, docs }) => (
          <div key={c} className="grid gap-6 lg:grid-cols-12">
            <h2 className="display-tight text-2xl lg:col-span-3">{DOCUMENT_CATEGORIES[c]}</h2>
            <ul className="border-t border-ink/10 lg:col-span-9">
              {docs.map((d) => {
                const href = d.file?.href ?? safeExternalUrl(d.url);
                const isPdf = d.file?.ext === "pdf" || /\.pdf$/i.test(d.url);
                return (
                  <li key={d.id} className="border-b border-ink/10">
                    <a
                      href={href ?? "#"}
                      target={href ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="group flex items-center gap-5 py-5 transition-colors hover:bg-white/70"
                    >
                      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-ink text-white transition-colors group-hover:bg-red">
                        <FileText size={20} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold tracking-tight">{d.title}</span>
                        {d.description && <span className="mt-0.5 block text-sm text-stone">{d.description}</span>}
                        <span className="kicker mt-1.5 block text-stone-light">
                          {[d.doc_date && formatDate(d.doc_date, true), d.file && `${d.file.ext.toUpperCase()} · ${formatBytes(d.file.size)}`, !d.file && isPdf && "PDF"]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      {d.file ? (
                        <Download size={20} className="shrink-0 text-red opacity-60 transition-opacity group-hover:opacity-100" />
                      ) : (
                        <ArrowUpRight size={20} className="shrink-0 text-red opacity-60 transition-opacity group-hover:opacity-100" />
                      )}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
