import type { TaskPerson } from "@/lib/types";
import { simplify } from "@/lib/utils";

/** Posten med utskottet inom parentes, om det inte är samma sak. */
export const recipientLabel = (r: TaskPerson) => (r.committee && simplify(r.committee) !== simplify(r.label) ? `${r.label} (${r.committee})` : r.label);

/** Valen i en lista över mottagare: öppet först, sedan styrelsens poster och sist utskotten. */
export function RecipientOptions({ recipients, inactive, openLabel = "Öppet, vem som helst kan ta det" }: { recipients: (TaskPerson & { kind: string })[]; inactive?: TaskPerson | null; openLabel?: string }) {
  const board = recipients.filter((r) => r.kind === "styrelse");
  const others = recipients.filter((r) => r.kind !== "styrelse");
  return (
    <>
      <option value="">{openLabel}</option>
      {inactive && <option value={inactive.id}>{recipientLabel(inactive)} (inaktiv)</option>}
      {board.length > 0 && (
        <optgroup label="Styrelsen">
          {board.map((r) => (
            <option key={r.id} value={r.id}>
              {recipientLabel(r)}
            </option>
          ))}
        </optgroup>
      )}
      {others.length > 0 && (
        <optgroup label="Utskott och övriga">
          {others.map((r) => (
            <option key={r.id} value={r.id}>
              {recipientLabel(r)}
            </option>
          ))}
        </optgroup>
      )}
    </>
  );
}
