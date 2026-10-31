"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, Trash, Upload } from "@/components/icons";
import { uploadFile } from "./upload";
import type { ImageRef } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Enskild bild (omslag, porträtt, logga). Laddas upp direkt; id:t sparas när formuläret skickas. */
export function ImageField({
  name,
  label,
  defaultImage,
  hint,
  aspect = "aspect-[16/9]",
  fit = "cover",
  onChange,
}: {
  name: string;
  label: string;
  defaultImage: ImageRef | null;
  hint?: string;
  aspect?: string;
  fit?: "cover" | "contain";
  /** Körs när en ny bild laddats upp eller bilden tagits bort, t.ex. för att spara direkt. */
  onChange?: (image: ImageRef | null) => void;
}) {
  const [image, setImageState] = useState<ImageRef | null>(defaultImage);
  const [changed, setChanged] = useState(false);
  const setImage = (img: ImageRef | null) => {
    setImageState(img);
    setChanged(true);
    onChange?.(img);
  };
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setError(null);
    setProgress(0);
    try {
      const res = await uploadFile(file, { purpose: "image" }, setProgress);
      if (res.image) setImage(res.image);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProgress(null);
    }
  };

  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold">{label}</p>
      <input type="hidden" name={name} value={image?.id ?? ""} />
      {/* Talar om för servern att fältet faktiskt ändrats (omslaget kan även sättas från galleriet). */}
      {changed && <input type="hidden" name={`${name}__changed`} value="1" />}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) upload(f);
        }}
        className={cn(
          "group relative overflow-hidden rounded-2xl border-2 border-dashed transition-colors",
          aspect,
          over ? "border-red bg-red/5" : image ? "border-transparent" : "border-ink/15 bg-paper/60 hover:border-ink/30",
        )}
      >
        {image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.thumb}
              srcSet={image.srcSet}
              sizes="400px"
              alt=""
              className={cn("absolute inset-0 h-full w-full", fit === "cover" ? "object-cover" : "object-contain p-4")}
              style={{ backgroundColor: fit === "cover" ? image.color : undefined }}
            />
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
              <button type="button" onClick={() => inputRef.current?.click()} className="btn btn-light btn-sm">
                <Upload size={15} /> Byt
              </button>
              <button type="button" onClick={() => setImage(null)} className="btn btn-sm bg-white/90 text-red-deep hover:bg-white" aria-label="Ta bort bild">
                <Trash size={15} />
              </button>
            </div>
          </>
        ) : (
          <button type="button" onClick={() => inputRef.current?.click()} className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-stone">
            <ImageIcon size={26} />
            <span className="text-sm font-semibold text-ink">Välj bild eller dra hit</span>
            <span className="text-xs">JPG, PNG, WebP · max 25 MB</span>
          </button>
        )}
        {progress !== null && (
          <div className="absolute inset-0 grid place-items-center bg-white/80 backdrop-blur-sm">
            <div className="w-2/3">
              <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
                <div className="h-full bg-red transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
              <p className="mt-2 text-center text-xs font-semibold">{progress < 1 ? `Laddar upp… ${Math.round(progress * 100)} %` : "Optimerar bilden…"}</p>
            </div>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      {error && <p className="mt-1.5 text-sm font-medium text-red-deep">{error}</p>}
      {hint && <p className="mt-1.5 text-[0.82rem] text-stone">{hint}</p>}
    </div>
  );
}
