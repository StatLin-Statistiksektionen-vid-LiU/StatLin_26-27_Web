import type { ImageRef } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Responsiv bild från mediebiblioteket med dominant färg som platshållare. */
export function SmartImage({
  image,
  sizes = "(min-width: 1024px) 50vw, 100vw",
  className,
  priority,
  alt,
}: {
  image: ImageRef;
  sizes?: string;
  className?: string;
  priority?: boolean;
  alt?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.src}
      srcSet={image.srcSet}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={alt ?? image.alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      className={cn("object-cover", className)}
      style={{ backgroundColor: image.color }}
    />
  );
}
