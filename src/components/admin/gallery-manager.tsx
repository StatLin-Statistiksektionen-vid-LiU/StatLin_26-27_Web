"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { deleteEventImage, reorderEventImages, setEventCover, updateImageCaption } from "@/app/admin/_actions/events";
import { Check, Grip, Image as ImageIcon, Star, Trash, Upload } from "@/components/icons";
import { uploadFile } from "./upload";
import type { ImageRef } from "@/lib/types";
import { cn } from "@/lib/utils";

type Item = { id: number; caption: string; image: ImageRef };
type Pending = { key: string; name: string; preview: string; progress: number; error?: string };

const PARALLEL = 3;

/**
 * Bildgalleri för ett evenemang. Flera bilder kan dras in samtidigt; de laddas upp
 * parallellt med förlopp, optimeras på servern och dyker upp direkt på evenemangssidan.
 */
export function GalleryManager({ eventId, initial, coverMediaId }: { eventId: number; initial: Item[]; coverMediaId: number | null }) {
  const [items, setItems] = useState<Item[]>(initial);
  const [pending, setPending] = useState<Pending[]>([]);
  const [cover, setCover] = useState<number | null>(coverMediaId);
  const [over, setOver] = useState(false);
  const [dragId, setDragId] = useState<number | null>(null);
  const [saved, setSaved] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const addFiles = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/") || /\.(heic|heif|avif)$/i.test(f.name));
    if (images.length === 0) return;
    const queue = images.map((f) => ({ file: f, key: `${f.name}-${f.size}-${Math.random().toString(36).slice(2)}` }));
    setPending((p) => [...p, ...queue.map((q) => ({ key: q.key, name: q.file.name, preview: URL.createObjectURL(q.file), progress: 0 }))]);

    // Bilderna blir klara i olika takt – rangordna efteråt så att galleriet får urvalsordningen.
    const before = itemsRef.current.map((x) => x.id);
    const rank = new Map<number, number>();
    let cursor = 0;
    const worker = async () => {
      while (cursor < queue.length) {
        const index = cursor++;
        const { file, key } = queue[index];
        try {
          const res = await uploadFile(file, { purpose: "gallery", eventId: String(eventId) }, (progress) =>
            setPending((p) => p.map((x) => (x.key === key ? { ...x, progress } : x))),
          );
          rank.set(res.id, index);
          if (res.image) {
            setItems((list) => {
              const next = [...list, { id: res.id, caption: "", image: res.image! }];
              const fresh = next.filter((x) => rank.has(x.id)).sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
              return [...next.filter((x) => !rank.has(x.id)), ...fresh];
            });
          }
          setPending((p) => {
            const done = p.find((x) => x.key === key);
            if (done) URL.revokeObjectURL(done.preview);
            return p.filter((x) => x.key !== key);
          });
        } catch (e) {
          setPending((p) => p.map((x) => (x.key === key ? { ...x, error: (e as Error).message } : x)));
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(PARALLEL, queue.length) }, worker));
    if (rank.size > 1) {
      const fresh = [...rank.keys()].sort((a, b) => rank.get(a)! - rank.get(b)!);
      const ids = [...before, ...fresh];
      startTransition(() => reorderEventImages(eventId, ids));
    }
  };

  const remove = (item: Item) => {
    if (!confirm("Ta bort bilden från galleriet?")) return;
    setItems((list) => list.filter((x) => x.id !== item.id));
    if (cover === item.image.id) setCover(null);
    startTransition(() => deleteEventImage(item.id));
  };

  const makeCover = (item: Item) => {
    const next = cover === item.image.id ? null : item.image.id;
    setCover(next);
    startTransition(() => setEventCover(eventId, next));
  };

  const saveCaption = (item: Item, caption: string) => {
    if (caption === item.caption) return;
    setItems((list) => list.map((x) => (x.id === item.id ? { ...x, caption } : x)));
    startTransition(async () => {
      await updateImageCaption(item.id, caption);
      setSaved(item.id);
      setTimeout(() => setSaved((s) => (s === item.id ? null : s)), 1500);
    });
  };

  const onDropReorder = (targetId: number) => {
    if (dragId === null || dragId === targetId) return;
    const list = [...items];
    const from = list.findIndex((x) => x.id === dragId);
    const to = list.findIndex((x) => x.id === targetId);
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    setItems(list);
    setDragId(null);
    startTransition(() => reorderEventImages(eventId, list.map((x) => x.id)));
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          if (dragId !== null) return;
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          if (dragId !== null) return;
          e.preventDefault();
          setOver(false);
          addFiles([...e.dataTransfer.files]);
        }}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          over ? "border-red bg-red/5" : "border-ink/15 bg-paper/50",
        )}
      >
        <span className="grid size-12 place-items-center rounded-full bg-ink text-white">
          <Upload size={20} />
        </span>
        <div>
          <p className="font-semibold">Dra in bilder här</p>
          <p className="text-sm text-stone">eller välj flera på en gång – de optimeras automatiskt och platsdata tas bort.</p>
        </div>
        <button type="button" onClick={() => inputRef.current?.click()} className="btn btn-ink btn-sm">
          <ImageIcon size={15} /> Välj bilder
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles([...(e.target.files ?? [])]);
            e.target.value = "";
          }}
        />
      </div>

      {(items.length > 0 || pending.length > 0) && (
        <>
          <p className="mt-6 text-sm text-stone">
            {items.length} {items.length === 1 ? "bild" : "bilder"} · dra för att ändra ordning · ★ = omslagsbild
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <li
                key={item.id}
                draggable
                onDragStart={() => setDragId(item.id)}
                onDragEnd={() => setDragId(null)}
                onDragOver={(e) => dragId !== null && e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  onDropReorder(item.id);
                }}
                className={cn(
                  "group overflow-hidden rounded-2xl border bg-white transition-all",
                  dragId === item.id ? "scale-95 opacity-40" : "border-ink/10",
                  cover === item.image.id && "ring-2 ring-red",
                )}
              >
                <div className="relative aspect-[4/3] cursor-grab active:cursor-grabbing">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image.thumb} alt="" className="h-full w-full object-cover" style={{ backgroundColor: item.image.color }} draggable={false} />
                  <span className="absolute left-2 top-2 grid size-7 place-items-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <Grip size={14} />
                  </span>
                  <div className="absolute right-2 top-2 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => makeCover(item)}
                      title={cover === item.image.id ? "Omslagsbild (klicka för att ta bort)" : "Använd som omslagsbild"}
                      className={cn("grid size-8 place-items-center rounded-full shadow", cover === item.image.id ? "bg-red text-white" : "bg-white/90 text-ink hover:bg-white")}
                    >
                      <Star size={15} fill={cover === item.image.id ? "currentColor" : "none"} />
                    </button>
                    <button type="button" onClick={() => remove(item)} title="Ta bort" className="grid size-8 place-items-center rounded-full bg-white/90 text-red-deep shadow hover:bg-white">
                      <Trash size={15} />
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <input
                    defaultValue={item.caption}
                    placeholder="Bildtext…"
                    aria-label="Bildtext"
                    maxLength={300}
                    onBlur={(e) => saveCaption(item, e.target.value.trim())}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), (e.target as HTMLInputElement).blur())}
                    className="w-full border-t border-ink/10 px-3 py-2 pr-8 text-sm outline-none focus:bg-paper/60"
                  />
                  {saved === item.id && <Check size={15} className="absolute right-2.5 top-2.5 text-emerald-600" />}
                </div>
              </li>
            ))}
            {pending.map((p) => (
              <li key={p.key} className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
                <div className="relative aspect-[4/3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.preview} alt="" className="h-full w-full object-cover opacity-50" />
                  <div className="absolute inset-x-3 bottom-3">
                    {p.error ? (
                      <p className="rounded-lg bg-white px-2 py-1 text-xs font-semibold text-red-deep">{p.error}</p>
                    ) : (
                      <div className="h-1.5 overflow-hidden rounded-full bg-white/70">
                        <div className="h-full bg-red transition-[width]" style={{ width: `${Math.max(4, Math.round(p.progress * 100))}%` }} />
                      </div>
                    )}
                  </div>
                </div>
                <p className="truncate border-t border-ink/10 px-3 py-2 text-xs text-stone">
                  {p.error ? p.name : p.progress < 1 ? `Laddar upp ${p.name}` : "Optimerar…"}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
