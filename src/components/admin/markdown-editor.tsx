"use client";

import { useRef, useState, useTransition } from "react";
import { previewMarkdown } from "@/app/admin/_actions/content";
import { Image as ImageIcon } from "@/components/icons";
import { FieldError, useFormCtx } from "./action-form";
import { isImageFile, uploadFile } from "./upload";
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
  max,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  rows?: number;
  hint?: string;
  /** Samma tak som servern har, se TEXT_LIMITS. */
  max: number;
}) {
  const { beginUpload, markDirty, state } = useFormCtx();
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
    markDirty();
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(a + text.length, a + text.length);
    });
  };

  const insertText = (text: string) => {
    const ta = ref.current;
    const pos = ta?.selectionStart ?? value.length;
    setValue((v) => v.slice(0, pos) + text + v.slice(pos));
    markDirty();
    // Markören ska stå efter texten, så att flera bilder hamnar efter varandra.
    requestAnimationFrame(() => ta?.setSelectionRange(pos + text.length, pos + text.length));
  };

  /** En i taget: bilderna hamnar i den ordning de valdes, och servern slipper optimera flera samtidigt. */
  const onImages = async (files: File[]) => {
    const images = files.filter(isImageFile);
    const problems = images.length < files.length ? ["Bara bilder kan infogas här. De andra filerna hoppades över."] : [];
    setError(problems[0] ?? null);
    if (images.length === 0) return;
    setUploading(true);
    // Formuläret kan inte sparas förrän bilden är uppladdad – annars sparades texten utan bildlänken.
    const done = beginUpload();
    try {
      for (const file of images) {
        try {
          const res = await uploadFile(file, { purpose: "image" });
          if (res.image) insertText(`\n\n![${file.name.replace(/\.[^.]+$/, "")}](${res.image.src})\n\n`);
        } catch (e) {
          problems.push(images.length > 1 ? `${file.name}: ${(e as Error).message}` : (e as Error).message);
          setError(problems.join(" "));
        }
      }
    } finally {
      done();
      setUploading(false);
    }
  };

  const showPreview = () => {
    setTab("preview");
    startPreview(async () => setHtml(await previewMarkdown(value)));
  };

  const full = value.length >= max;
  const invalid = full || !!state.fieldErrors?.[name];
  const format = (n: number) => n.toLocaleString("sv-SE");

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor={name} className="text-sm font-semibold">
          {label}
        </label>
        <span className={cn("font-mono text-[0.7rem] tabular", full ? "font-bold text-red-deep" : "text-stone")}>
          {format(value.length)} / {format(max)}
        </span>
      </div>
      <div className={cn("overflow-hidden rounded-xl border bg-white focus-within:ring-4 focus-within:ring-ink/[0.06]", invalid ? "border-red" : "border-ink/15 focus-within:border-ink")}>
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
                aria-label={/^[\p{L}\p{N}]/u.test(t.label) ? `${t.label} ${t.title}` : t.title}
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
            multiple
            className="hidden"
            onChange={(e) => {
              onImages([...(e.target.files ?? [])]);
              e.target.value = "";
            }}
          />
        </div>
        <textarea
          ref={ref}
          id={name}
          name={name}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (e.target.value.length < max) setError(null);
          }}
          rows={rows}
          maxLength={max}
          aria-invalid={invalid || undefined}
          aria-describedby={`${name}-error`}
          className={cn("block w-full resize-y px-4 py-3 font-mono text-[0.88rem] leading-relaxed outline-none", tab !== "write" && "hidden")}
          onDrop={(e) => {
            if (e.dataTransfer.files.length === 0) return;
            e.preventDefault();
            onImages([...e.dataTransfer.files]);
          }}
          onPaste={(e) => {
            const images = [...e.clipboardData.files].filter(isImageFile);
            if (images.length > 0) {
              e.preventDefault();
              onImages(images);
              return;
            }
            // Webbläsaren klipper en för lång text utan att säga något, och slutet av texten är borta.
            const ta = e.currentTarget;
            const room = max - (ta.value.length - (ta.selectionEnd - ta.selectionStart));
            const over = e.clipboardData.getData("text").replace(/\r\n?/g, "\n").length - room;
            if (over > 0) setError(`Texten får vara högst ${format(max)} tecken. De sista ${format(over)} tecknen klistrades inte in.`);
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
      <FieldError name={name} />
      <p className="mt-1.5 text-[0.82rem] text-stone">
        {hint ?? "Formatera med Markdown: **fet**, *kursiv*, ## Rubrik, - lista. Dra in eller klistra in bilder direkt i textrutan."}
      </p>
    </div>
  );
}
