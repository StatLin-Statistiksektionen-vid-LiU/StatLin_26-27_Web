import Link from "next/link";
import type { ReactNode } from "react";
import { isFileUrl } from "@/lib/links";

/** Länk inom sajten. En fil är ingen sida: med Link hämtar Next den först som en sida (?_rsc=) och laddar sedan om. */
export function SiteLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  if (isFileUrl(href)) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
