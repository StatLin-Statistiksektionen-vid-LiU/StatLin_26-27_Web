import Link from "next/link";
import { Mail } from "@/components/icons";
import type { Committee } from "@/lib/types";

/** UBU:s kontaktkort i sidokolumnen på Kandidat och Master. */
export function UbuCard({ ubu }: { ubu: Committee }) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] bg-ink p-7 text-white">
      <div className="flex items-center gap-4">
        {ubu.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ubu.logo_url} alt="" className="size-16 object-contain" />
        )}
        <div>
          <p className="kicker text-white/50">Studiebevakning</p>
          <p className="display-tight mt-1 text-2xl normal-case">{ubu.short_name}</p>
        </div>
      </div>
      <p className="mt-5 text-[0.95rem] leading-relaxed text-white/70">{ubu.tagline} Hör av dig om kurser, examination eller studiemiljö – anonymt om du vill.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {ubu.email && (
          <a href={`mailto:${ubu.email}`} className="btn btn-red btn-sm">
            <Mail size={15} /> Mejla UBU
          </a>
        )}
        <Link href={`/utskott/${ubu.slug}`} className="btn btn-ghost-dark btn-sm">
          Om UBU
        </Link>
      </div>
    </div>
  );
}
