"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { EditModeLink } from "@/components/edit-mode/editable";
import { ArrowUpRight, Chain, Download, FileText, Image as ImageIcon } from "@/components/icons";
import { PROGRAMS } from "@/lib/links";
import { fileLabel, groupResources, linkHost, RESOURCE_CATEGORIES, termSeason } from "@/lib/resources";
import type { Program, ResourceItem } from "@/lib/types";
import { cn, safeExternalUrl } from "@/lib/utils";

/** Hjälpmedlen under flikarna Kandidat och Master, per årskurs och termin. */
export function ResourceBoard({ resources, initialProgram }: { resources: ResourceItem[]; initialProgram: Program }) {
  const [program, setProgram] = useState(initialProgram);
  const { years, whole } = groupResources(resources, program);

  function chooseProgram(p: Program) {
    setProgram(p);
    // Fliken hamnar i adressen, så att länken till Master-fliken går att dela och överlever en omladdning.
    const url = new URL(window.location.href);
    if (p === "master") url.searchParams.set("program", "master");
    else url.searchParams.delete("program");
    window.history.replaceState(null, "", url);
  }

  return (
    <section aria-label="Hjälpmedel per program" className="container-site py-12 md:py-20">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div role="tablist" aria-label="Program" className="inline-flex rounded-full border border-ink/10 bg-white p-1">
          {PROGRAMS.map((p) => (
            <button
              key={p.value}
              type="button"
              role="tab"
              id={`flik-${p.value}`}
              aria-selected={program === p.value}
              aria-controls="hjalpmedel-lista"
              tabIndex={program === p.value ? 0 : -1}
              onClick={() => chooseProgram(p.value)}
              onKeyDown={(e) => {
                if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
                const next = PROGRAMS[(PROGRAMS.indexOf(p) + 1) % PROGRAMS.length];
                chooseProgram(next.value);
                document.getElementById(`flik-${next.value}`)?.focus();
              }}
              className={cn("h-10 rounded-full px-5 text-sm font-semibold transition-colors", program === p.value ? "bg-ink text-white" : "text-stone hover:text-ink")}
            >
              {p.label}
            </button>
          ))}
        </div>
        <EditModeLink target={{ type: "resources" }} href="/admin/hjalpmedel" icon="edit">
          Hantera hjälpmedel
        </EditModeLink>
      </div>

      <div id="hjalpmedel-lista" role="tabpanel" aria-labelledby={`flik-${program}`} className="mt-10 space-y-14 md:space-y-16">
        {years.length === 0 && whole.length === 0 && (
          <p className="max-w-xl leading-relaxed text-stone">
            Det finns inga hjälpmedel här ännu. Har du något som kan hjälpa andra?{" "}
            <Link href="/kontakt" className="font-semibold text-ink underline underline-offset-4 hover:text-red-deep">
              Hör av dig till styrelsen
            </Link>
            .
          </p>
        )}
        {years.map(({ year, terms }) => (
          <Group key={year} title={`År ${year}`}>
            <div className="space-y-10">
              {terms.map(({ term, items }) => (
                <div key={term}>
                  <h3 className="flex items-baseline justify-between gap-4 border-b border-ink/10 pb-3">
                    <span className="display-tight text-lg">Termin {term}</span>
                    <span className="kicker text-stone-light">{termSeason(term)}</span>
                  </h3>
                  <ResourceList items={items} />
                </div>
              ))}
            </div>
          </Group>
        ))}
        {whole.length > 0 && (
          <Group title="Hela programmet">
            <div className="border-t border-ink/10">
              <ResourceList items={whole} />
            </div>
          </Group>
        )}
      </div>
    </section>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <h2 className="display-tight text-2xl lg:col-span-3">{title}</h2>
      <div className="min-w-0 lg:col-span-9">{children}</div>
    </div>
  );
}

function ResourceList({ items }: { items: ResourceItem[] }) {
  return (
    <ul>
      {items.map((r) => {
        const href = r.file?.href ?? safeExternalUrl(r.url);
        const Icon = !r.file ? Chain : r.file.image ? ImageIcon : FileText;
        const Action = r.file ? Download : ArrowUpRight;
        const meta = r.file ? fileLabel(r.file) : linkHost(r.url);
        return (
          <li key={r.id} className="border-b border-ink/10">
            <a href={href ?? "#"} target={href ? "_blank" : undefined} rel="noopener noreferrer" className="group flex items-center gap-4 py-5 transition-colors hover:bg-white/70 sm:gap-5">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-ink text-white transition-colors group-hover:bg-red">
                <Icon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span className="min-w-0 font-bold tracking-tight [overflow-wrap:anywhere]">{r.title}</span>
                  <span className="rounded-full border border-ink/15 px-2.5 py-0.5 text-xs font-semibold text-stone">{RESOURCE_CATEGORIES[r.category]}</span>
                </span>
                {r.description && <span className="mt-1 block text-sm text-stone">{r.description}</span>}
                {meta && <span className="kicker mt-1.5 block text-stone-light">{meta}</span>}
              </span>
              <Action size={20} className="shrink-0 text-red opacity-60 transition-opacity group-hover:opacity-100" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
