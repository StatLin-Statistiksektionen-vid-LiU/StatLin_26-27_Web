"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ArrowRight, ArrowUpRight, Close, Search } from "@/components/icons";
import { highlight, KIND_LABELS, makeSnippet, MAX_HITS, MAX_QUERY_LENGTH, queryTerms, search, type PreparedIndex, type SearchHit, type SearchResult } from "@/lib/search";
import { loadCourseCodes, loadSearchIndex } from "@/lib/search-client";
import { FOCUS_SEARCH_EVENT } from "@/lib/search-prefetch";
import { cn } from "@/lib/utils";

/** Visas innan man skrivit något. Ett tryck fyller i sökrutan. */
const SUGGESTIONS = ["Tentastatistik", "Sittning", "Styrelsen", "Mottagning", "Hjälpmedel", "Kontakt"];
const FIRST_PAGE = 20;
const NO_RESULT: SearchResult = { hits: [], terms: [], corrected: [] };

const subscribeNothing = () => () => {};
const readUrlQuery = () => (new URLSearchParams(window.location.search).get("q") ?? "").slice(0, MAX_QUERY_LENGTH);

/** Sidor och poster öppnas i appen. Filer, API och andra webbplatser är vanliga länkar. */
const isPageHref = (href: string) => href.startsWith("/") && !href.startsWith("/api/") && !/\.[a-z0-9]{2,5}(?:$|[?#])/i.test(href);

/**
 * Sökfliken: träffar medan man skriver, i hela sajten, med rättning av stavfel. Indexet hämtas en gång och söks i webbläsaren
 * (src/lib/search.ts), så varje tangenttryck svarar direkt även på en långsam telefon. Frågan står i adressen (?q=), så en sökning
 * går att dela och ladda om.
 */
export function SiteSearch() {
  // Frågan i adressen tills man skriver själv. Servern känner inte till den, så sidan kan vara statisk och rutan byts aldrig ut.
  const urlQuery = useSyncExternalStore(subscribeNothing, readUrlQuery, () => "");
  const [typed, setTyped] = useState<string | null>(null);
  const query = typed ?? urlQuery;
  const [index, setIndex] = useState<PreparedIndex | null>(null);
  const [failed, setFailed] = useState(false);
  const [codes, setCodes] = useState<string[]>([]);
  const [showAll, setShowAll] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const statusId = useId();

  const setQuery = (value: string) => {
    setTyped(value.slice(0, MAX_QUERY_LENGTH));
    setShowAll(false);
  };

  // Indexet hämtas direkt: den som kommer hit ska söka.
  useEffect(() => {
    loadSearchIndex().then((loaded) => (loaded ? setIndex(loaded) : setFailed(true)));
  }, []);

  // Sökknappen i sidhuvudet och snabbtangenten / lägger markören i rutan.
  useEffect(() => {
    const focus = () => {
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && !target.closest("input, textarea, select, [contenteditable]")) {
        e.preventDefault();
        focus();
      }
    };
    window.addEventListener(FOCUS_SEARCH_EVENT, focus);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(FOCUS_SEARCH_EVENT, focus);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // Adressen följer frågan, utan att lägga till steg i historiken.
  useEffect(() => {
    const t = setTimeout(() => {
      const url = query.trim() ? `/sok?q=${encodeURIComponent(query.trim())}` : "/sok";
      if (window.location.pathname === "/sok" && window.location.pathname + window.location.search !== url) window.history.replaceState(null, "", url);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Kurskoderna behövs först när frågan innehåller en siffra.
  const wantsCodes = /\d/.test(query);
  useEffect(() => {
    if (wantsCodes && codes.length === 0) loadCourseCodes().then(setCodes);
  }, [wantsCodes, codes.length]);

  const deferred = useDeferredValue(query);
  const result = useMemo(() => (index ? search(index, deferred, codes) : NO_RESULT), [index, deferred, codes]);
  const { hits, terms, corrected, suggestion } = result;
  const searching = queryTerms(query).length > 0;
  const loading = searching && !index && !failed;
  const shown = showAll ? hits : hits.slice(0, FIRST_PAGE);

  const status = !searching
    ? ""
    : loading
      ? "Söker…"
      : failed
        ? "Sökningen svarar inte just nu."
        : hits.length === 0
          ? "Inga träffar"
          : hits.length === 1
            ? "1 träff"
            : `${hits.length >= MAX_HITS ? `Minst ${MAX_HITS}` : hits.length} träffar`;

  const focusResult = (i: number) => {
    const links = listRef.current?.querySelectorAll<HTMLAnchorElement>("a[data-traff]");
    if (!links?.length) return;
    links[Math.max(0, Math.min(i, links.length - 1))].focus();
  };

  return (
    <>
      <section className="bg-ink pb-7 pt-[calc(var(--header-h)+1.5rem)] text-white md:pb-9 md:pt-[calc(var(--header-h)+2.75rem)]">
        <div className="container-site">
          <form
            action="/sok"
            method="get"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              // Enter går till träffarna: på telefonen fälls tangentbordet ner, och nästa Enter öppnar den första.
              if (hits.length) focusResult(0);
              else inputRef.current?.blur();
            }}
            className="mx-auto max-w-2xl"
          >
            <div className="flex items-center gap-3 border-b-2 border-white/20 transition-colors focus-within:border-red">
              <Search size={22} className="shrink-0 text-white/45" />
              <input
                ref={inputRef}
                name="q"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown" && hits.length) {
                    e.preventDefault();
                    focusResult(0);
                  } else if (e.key === "Escape" && query) {
                    e.preventDefault();
                    setQuery("");
                  }
                }}
                aria-label="Sök på StatLin"
                aria-describedby={statusId}
                placeholder="Sök på StatLin"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="search"
                maxLength={MAX_QUERY_LENGTH}
                autoFocus
                className="h-16 min-w-0 flex-1 bg-transparent text-[1.6rem] font-medium tracking-tight text-white outline-none placeholder:text-white/35 focus-visible:outline-none md:h-20 md:text-[2.1rem] [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="grid size-11 shrink-0 place-items-center rounded-full text-white/55 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Töm sökrutan"
                >
                  <Close size={20} />
                </button>
              )}
            </div>
          </form>
        </div>
      </section>

      <div className="container-site pb-24 pt-6 md:pb-32 md:pt-8">
        <div className="mx-auto max-w-2xl">
          <p id={statusId} aria-live="polite" className={cn("text-sm text-stone", !status && "sr-only")}>
            {status}
            {suggestion && hits.length > 0 && (
              <>
                {" · "}Visar träffar för{" "}
                <button
                  type="button"
                  onClick={() => {
                    setQuery(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="font-semibold text-ink underline decoration-ink/25 underline-offset-4 transition-colors hover:decoration-red"
                >
                  {suggestion}
                </button>
              </>
            )}
          </p>

          {!searching ? (
            <Suggestions onPick={(q) => setQuery(q)} />
          ) : loading ? (
            <ul aria-hidden className="mt-4 space-y-6">
              {[0, 1, 2].map((i) => (
                <li key={i} className="space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-ink/[0.06]" />
                  <div className="h-5 w-3/4 animate-pulse rounded bg-ink/[0.08]" />
                </li>
              ))}
            </ul>
          ) : hits.length === 0 ? (
            <NoHits query={query} failed={failed} />
          ) : (
            <>
              <ol
                ref={listRef}
                className="mt-2 divide-y divide-ink/[0.08]"
                onKeyDown={(e) => {
                  const links = [...(listRef.current?.querySelectorAll<HTMLAnchorElement>("a[data-traff]") ?? [])];
                  const at = links.indexOf(document.activeElement as HTMLAnchorElement);
                  if (at === -1) return;
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    focusResult(at + 1);
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    if (at === 0) inputRef.current?.focus();
                    else focusResult(at - 1);
                  } else if (e.key === "Escape") {
                    inputRef.current?.focus();
                  }
                }}
              >
                {shown.map((hit, i) => (
                  <HitRow key={`${i}:${hit.entry.kind}:${hit.entry.href}`} hit={hit} terms={terms} corrected={corrected} />
                ))}
              </ol>
              {hits.length > shown.length && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="mt-4 h-11 text-[0.95rem] font-semibold text-ink underline decoration-ink/25 underline-offset-4 transition-colors hover:decoration-red"
                >
                  Visa alla {hits.length} träffar
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Marked({ text, terms, corrected }: { text: string; terms: string[]; corrected: string[] }) {
  return (
    <>
      {highlight(text, terms, corrected).map((part, i) =>
        part.hit ? (
          <mark key={i} className="rounded-[0.2em] bg-red/[0.12] px-[0.08em] text-inherit">
            {part.text}
          </mark>
        ) : (
          part.text
        ),
      )}
    </>
  );
}

function HitRow({ hit, terms, corrected }: { hit: SearchHit; terms: string[]; corrected: string[] }) {
  const { entry } = hit;
  // Utdraget räknas bara för raderna som visas, inte för alla träffar.
  const snippet = useMemo(
    () => (hit.inText && entry.text ? makeSnippet(entry.text, [...terms, ...corrected]) : undefined),
    [hit.inText, entry.text, terms, corrected],
  );
  const body = (
    <>
      <span className="block text-[0.8rem] text-stone">
        <span className="font-semibold uppercase tracking-[0.12em] text-[0.7rem]">{KIND_LABELS[entry.kind]}</span>
        {entry.meta && (
          <>
            <span aria-hidden> · </span>
            <Marked text={entry.meta} terms={terms} corrected={corrected} />
          </>
        )}
      </span>
      <span
        className={cn(
          "mt-1 flex items-start gap-2 text-[1.12rem] font-semibold leading-snug text-ink transition-colors group-hover:text-red",
          entry.kind === "kurs" && "font-mono",
        )}
      >
        <span className="min-w-0">
          <Marked text={entry.title} terms={terms} corrected={corrected} />
        </span>
        {entry.external && <ArrowUpRight size={15} className="mt-1 shrink-0 text-stone" />}
      </span>
      {snippet && (
        <span className="mt-1.5 line-clamp-2 block text-[0.95rem] leading-relaxed text-stone">
          <Marked text={snippet} terms={terms} corrected={corrected} />
        </span>
      )}
    </>
  );
  const className = "group -mx-3 block rounded-xl px-3 py-4 outline-none transition-colors hover:bg-ink/[0.025] focus-visible:bg-ink/[0.04] focus-visible:ring-2 focus-visible:ring-red/40";
  return (
    <li>
      {isPageHref(entry.href) ? (
        <Link href={entry.href} data-traff className={className}>
          {body}
        </Link>
      ) : (
        <a href={entry.href} data-traff className={className} {...(entry.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {body}
          {entry.external && <span className="sr-only"> (öppnas i en ny flik)</span>}
        </a>
      )}
    </li>
  );
}

function Suggestions({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="mt-2">
      <p className="text-sm text-stone">Förslag</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((q) => (
          <li key={q}>
            <button
              type="button"
              onClick={() => onPick(q)}
              className="inline-flex h-10 items-center rounded-full border border-ink/10 px-4 text-[0.95rem] transition-colors hover:border-ink/40"
            >
              {q}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-10 hidden text-sm text-stone md:block">
        Tryck <kbd className="rounded border border-ink/15 px-1.5 py-0.5 font-mono text-[0.8rem] text-ink">/</kbd> var som helst på
        sajten för att söka.
      </p>
    </div>
  );
}

function NoHits({ query, failed }: { query: string; failed: boolean }) {
  const code = query.replace(/[\s-]+/g, "").toUpperCase();
  const looksLikeCode = /^[A-Z0-9]{6}$/.test(code) && /\d/.test(code);
  return (
    <div className="mt-4">
      <p className="text-lg font-semibold">{failed ? "Sökningen svarar inte just nu." : <>Inga träffar på ”{query.trim()}”</>}</p>
      <p className="mt-1 text-stone">
        {failed ? "Ladda om sidan och försök igen, eller gå direkt till en sida i menyn." : "Prova ett annat ord, färre ord eller början av ett ord."}
      </p>
      {looksLikeCode && (
        <Link href={`/tentastatistik/${code}`} className="mt-4 inline-flex h-11 items-center gap-2 font-semibold text-red hover:underline">
          Tentastatistik för {code} <ArrowRight size={18} />
        </Link>
      )}
    </div>
  );
}
