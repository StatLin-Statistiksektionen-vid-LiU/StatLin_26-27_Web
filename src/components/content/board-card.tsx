import { Avatar } from "./avatar";
import { Mail } from "@/components/icons";
import type { BoardMember } from "@/lib/types";
import { Editable } from "@/components/edit-mode/editable";

export function BoardCard({ member }: { member: BoardMember }) {
  const name = member.name || "Vakant";
  return (
    <Editable target={{ type: "board", id: member.id }} className="group flex h-full flex-col">
      <div className="relative overflow-hidden rounded-[1.5rem]">
        <Avatar
          name={member.name || member.post}
          seed={`${member.id}-${member.post}`}
          photo={member.photo}
          className="aspect-[4/5] w-full transition-transform duration-[1.2s] ease-[var(--ease-out-expo)] group-hover:scale-[1.03]"
        />
        <span className="chip absolute left-3 top-3 bg-white/95 text-ink">{member.post}</span>
      </div>
      <div className="flex flex-1 flex-col pt-4">
        <p className="text-lg font-bold tracking-tight">{name}</p>
        {member.bio && <p className="mt-1.5 text-[0.93rem] leading-relaxed text-stone">{member.bio}</p>}
        {member.email && (
          <a href={`mailto:${member.email}`} className="mt-auto inline-flex items-center gap-2 pt-3 text-sm font-semibold text-red-deep">
            <Mail size={15} />
            <span className="link-underline">{member.email}</span>
          </a>
        )}
      </div>
    </Editable>
  );
}
