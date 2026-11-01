"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { ArrowRight, Search } from "@/components/icons";
import { normalizeCourseCode } from "@/lib/exam-stats";
import { cn } from "@/lib/utils";

/** Kodlistan (drygt 4 000 koder) hämtas en gång per sidvisning, först när någon börjar skriva. */
let codesPromise: Promise<string[]> | null = null;
function loadCodes(): Promise<string[]> {
  codesPromise ??= fetch("/api/tentastatistik/koder")
    .then((r) => (r.ok ? (r.json() as Promise<string[]>) : []))
    .catch(() => {
      codesPromise = null;
      return [];
    });
  return codesPromise;
}

const MAX_SUGGESTIONS = 8;
const HINT = "Skriv en kurskod med sex tecken, till exempel 732G33 eller TATA24.";

/**
 * Sökfältet för tentastatistik: skriv en kurskod, få förslag medan du skriver och gå till kurssidan.
 * Formuläret fungerar även innan JavaScript har laddats – då skickas ?kod= till /tentastatistik,
 * och src/proxy.ts skickar vidare till kurssidan.
 */
export function CourseSearch({
  defaultValue = "",
  invalid,
}: {
  defaultValue?: string;
  /** Visa tipset om kurskoder direkt, när ?kod= inte var en kurskod. */
  invalid?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [codes, setCodes] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [message, setMessage] = useState(invalid ? HINT : "");
  const listId = useId();

  const query = value.replace(/\s+/g, "").toUpperCase();
  const suggestions = query.length < 2 ? [] : codes.filter((c) => c.startsWith(query)).slice(0, MAX_SUGGESTIONS);
  const expanded = open && suggestions.length > 0;

  function go(raw: string) {
    const code = normalizeCourseCode(raw);
    if (!code) {
      setMessage(HINT);
      return;
    }
    setOpen(false);
    router.push(`/tentastatistik/${code}`);
  }

  return (
    <form
      action="/tentastatistik"
      method="get"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        go(expanded && active >= 0 ? suggestions[active] : value);
      }}
      className="relative w-full max-w-xl"
    >
      <div className="flex h-16 items-center gap-2 rounded-full border border-ink/10 bg-white pl-6 pr-2 text-ink shadow-[0_24px_60px_-30px_rgb(10_10_10/0.45)] transition-[border-color,box-shadow] focus-within:border-ink focus-within:shadow-[0_0_0_4px_rgb(255_7_7/0.18)]">
        <Search size={20} className="shrink-0 text-stone" />
        <input
          name="kod"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setActive(-1);
            setMessage("");
          }}
          onFocus={() => {
            setOpen(true);
            loadCodes().then(setCodes);
          }}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && suggestions.length) {
              e.preventDefault();
              setOpen(true);
              setActive((a) => (a + 1) % suggestions.length);
            } else if (e.key === "ArrowUp" && suggestions.length) {
              e.preventDefault();
              setActive((a) => (a <= 0 ? suggestions.length - 1 : a - 1));
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          role="combobox"
          aria-label="Kurskod"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? `${listId}-fel` : undefined}
          placeholder="Kurskod, t.ex. 732G33"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          enterKeyHint="search"
          className="h-full min-w-0 flex-1 bg-transparent font-mono text-lg uppercase tracking-tight outline-none placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-stone-light focus-visible:outline-none"
        />
        <button type="submit" className="btn btn-red h-12 shrink-0 px-5">
          <span className="hidden sm:inline">Visa</span>
          <ArrowRight size={18} />
          <span className="sr-only sm:hidden">Visa statistiken</span>
        </button>
      </div>

      <ul
        id={listId}
        role="listbox"
        aria-label="Förslag på kurskoder"
        hidden={!expanded}
        className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-[1.25rem] border border-ink/10 bg-white py-2 text-ink shadow-[0_30px_60px_-30px_rgb(10_10_10/0.5)]"
      >
        {suggestions.map((code, i) => (
          <li
            key={code}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            // mousedown i stället för click: annars hinner fältet tappa fokus och listan stängas först.
            onMouseDown={(e) => {
              e.preventDefault();
              go(code);
            }}
            onMouseEnter={() => setActive(i)}
            className={cn("cursor-pointer px-5 py-2.5 font-mono text-sm font-semibold text-red-deep", i === active && "bg-paper")}
          >
            {code}
          </li>
        ))}
      </ul>

      <p id={`${listId}-fel`} aria-live="polite" className={cn("mt-3 px-6 text-sm font-semibold text-red-deep", !message && "sr-only")}>
        {message}
      </p>
    </form>
  );
}
