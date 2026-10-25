"use client";

import { useRef, useState, useTransition } from "react";
import { previewMarkdown } from "@/app/admin/_actions/content";
import { Image as ImageIcon } from "@/components/icons";
import { uploadFile } from "./upload";
import { cn } from "@/lib/utils";

type Tool = { label: string; title: string; apply: (sel: string) => { text: string; cursorOffset?: number }; block?: boolean };

const TOOLS: Tool[] = [
  { label: "H2", title: "Rubrik", apply: (s) => ({ text: `## ${s || "Rubrik"}` }), block: true },
  { label: "B", title: "Fetstil", apply: (s) => ({ text: `**${s || "fet text"}**` }) },
  { label: "I", title: "Kursiv", apply: (s) => ({ text: `*${s || "kursiv text"}*` }) },
  { label: "🔗", title: "Länk", apply: (s) => ({ text: `[${s || "länktext"}](https://)` }) },
  { label: "•", title: "Punktlista", apply: (s) => ({ text: (s || "Punkt").split("\n").map((l) => `- ${l}`).join("\n") }), block: true },
  { label: "1.", title: "Numrerad lista", apply: (s) => ({ text: (s || "Punkt").split("\n").map((l, i) => `${i + 1}. ${l}`).join("\n") }), block: true },
  { label: "❝", title: "Citat", apply: (s) => ({ text: `> ${s || "Citat"}` }), block: true },
  { label: "▸", title: "Fråga/svar (utfällbar)", apply: (s) => ({ text: `<details><summary>${s || "Fråga"}</summary>\n\nSvar\n</details>` }), block: true },
];

export function MarkdownEditor({
  name,
  label,
  defaultValue = "",
  rows = 14,
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  rows?: number;
  hint?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [html, setHtml] = useState("");
  const [loading, startPreview] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const insert = (tool: Tool) => {
    const ta = ref.current;
    if (!ta) return;
    const { selectionStart: a, selectionEnd: b } = ta;
    const sel = value.slice(a, b);
    let { text } = tool.apply(sel);
    if (tool.block && a > 0 && value[a - 1] !== "\n") text = `\n\n${text}`;
    const next = value.slice(0, a) + text + value.slice(b);
    setValue(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(a + text.length, a + text.length);
    });
  };

  const insertText = (text: string) => {
    const ta = ref.current;
    const pos = ta?.selectionStart ?? value.length;
    setValue((v) => v.slice(0, pos) + text + v.slice(pos));
  };

  const onImage = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const res = await uploadFile(file, { purpose: "image" });
      if (res.image) insertText(`\n\n![${file.name.replace(/\.[^.]+$/, "")}](${res.image.src})\n\n`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const showPreview = () => {
    setTab("preview");
    startPreview(async () => setHtml(await previewMarkdown(value)));
  };

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor={name} className="text-sm font-semibold">
          {label}
        </label>
        <span className="font-mono text-[0.7rem] text-stone tabular">{value.length} tecken</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-ink/15 bg-white focus-within:border-ink focus-within:ring-4 focus-within:ring-ink/[0.06]">
        <div className="flex flex-wrap items-center gap-1 border-b border-ink/10 bg-paper/60 px-2 py-1.5">
          <div className="mr-2 inline-flex rounded-lg bg-ink/[0.06] p-0.5 text-xs font-semibold">
            <button type="button" onClick={() => setTab("write")} className={cn("rounded-md px-3 py-1.5", tab === "write" ? "bg-white shadow-sm" : "text-ink/60")}>
              Skriv
            </button>
            <button type="button" onClick={showPreview} className={cn("rounded-md px-3 py-1.5", tab === "preview" ? "bg-white shadow-sm" : "text-ink/60")}>
              Förhandsgranska
            </button>
          </div>
          {tab === "write" &&
            TOOLS.map((t) => (
              <button
                key={t.title}
                type="button"
                title={t.title}
                aria-label={t.title}
                onClick={() => insert(t)}
                className={cn("grid h-8 min-w-8 place-items-center rounded-md px-1.5 text-sm text-ink/75 hover:bg-white hover:text-ink", t.label === "B" && "font-bold", t.label === "I" && "italic")}
              >
                {t.label}
              </button>
            ))}
          {tab === "write" && (
            <button
              type="button"
              title="Infoga bild"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-ink/75 hover:bg-white hover:text-ink"
            >
              <ImageIcon size={15} /> {uploading ? "Laddar upp…" : "Bild"}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImage(f);
              e.target.value = "";
            }}
          />
        </div>
        <textarea
          ref={ref}
          id={name}
          name={name}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={rows}
          className={cn("block w-full resize-y px-4 py-3 font-mono text-[0.88rem] leading-relaxed outline-none", tab !== "write" && "hidden")}
          onDrop={(e) => {
            const f = e.dataTransfer.files?.[0];
            if (f?.type.startsWith("image/")) {
              e.preventDefault();
              onImage(f);
            }
          }}
          onPaste={(e) => {
            const f = [...e.clipboardData.files].find((x) => x.type.startsWith("image/"));
            if (f) {
              e.preventDefault();
              onImage(f);
            }
          }}
        />
        {tab === "preview" && (
          <div className="min-h-48 px-5 py-4">
            {loading ? (
              <p className="text-sm text-stone">Laddar förhandsvisning…</p>
            ) : html ? (
              <div className="prose-statlin" dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <p className="text-sm text-stone">Inget att visa ännu.</p>
            )}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-red-deep">{error}</p>}
      <p className="mt-1.5 text-[0.82rem] text-stone">
        {hint ?? "Formatera med Markdown: **fet**, *kursiv*, ## Rubrik, - lista. Dra in eller klistra in bilder direkt i textrutan."}
      </p>
    </div>
  );
}
