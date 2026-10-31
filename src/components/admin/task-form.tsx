import { saveTask } from "@/app/admin/_actions/tasks";
import { formatDate } from "@/lib/dates";
import type { EventItem, Task, TaskPerson } from "@/lib/types";
import { ActionForm } from "./action-form";
import { Field, FormSection, Select, TextArea, TextInput } from "./fields";

type Recipient = TaskPerson & { kind: string };

export function TaskForm({
  task,
  recipients,
  events,
  meId,
  defaults,
}: {
  task?: Task | null;
  recipients: Recipient[];
  events: Pick<EventItem, "id" | "title" | "starts_at">[];
  meId: number;
  defaults?: { to_user_id?: number | null; event_id?: number | null };
}) {
  const board = recipients.filter((r) => r.kind === "styrelse" && r.id !== meId);
  const others = recipients.filter((r) => r.kind !== "styrelse" && r.id !== meId);
  const simplify = (s: string) => s.toLowerCase().replace(/[^a-z0-9åäö]/g, "");
  const label = (r: Recipient) => (r.committee && simplify(r.committee) !== simplify(r.label) ? `${r.label} (${r.committee})` : r.label);
  const toDefault = task ? task.to_user_id : (defaults?.to_user_id ?? null);
  const eventDefault = task ? task.event_id : (defaults?.event_id ?? null);

  return (
    <ActionForm action={saveTask} submitLabel={task ? "Spara ändringar" : "Skicka uppdraget"} stickyFooter={!task}>
      {task && <input type="hidden" name="id" value={task.id} />}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <FormSection title="Uppdraget">
            <Field label="Vad behöver göras?" name="title" required>
              <TextInput name="title" defaultValue={task?.title} maxLength={140} required placeholder="Affisch till höstsittningen" />
            </Field>
            <Field label="Beskrivning" name="description" hint="Länka gärna till utkast i Canva eller Drive. **Fet text** och listor fungerar.">
              <TextArea name="description" defaultValue={task?.description} rows={6} maxLength={4000} placeholder="Format, text som ska med, deadline …" />
            </Field>
          </FormSection>
        </div>
        <div className="space-y-6">
          <FormSection title="Till vem?">
            <Field label="Mottagare" name="to_user_id">
              <Select name="to_user_id" defaultValue={toDefault === null ? "" : String(toDefault)}>
                <option value="">Öppet – vem som helst kan ta det</option>
                {board.length > 0 && (
                  <optgroup label="Styrelsen">
                    {board.map((r) => (
                      <option key={r.id} value={r.id}>
                        {label(r)}
                      </option>
                    ))}
                  </optgroup>
                )}
                {others.length > 0 && (
                  <optgroup label="Utskott och övriga">
                    {others.map((r) => (
                      <option key={r.id} value={r.id}>
                        {label(r)}
                      </option>
                    ))}
                  </optgroup>
                )}
              </Select>
            </Field>
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">Vem ser uppdraget?</legend>
              <div className="space-y-2">
                {[
                  { value: "alla", title: "Hela styrelsen", hint: "Visas på den gemensamma tavlan." },
                  { value: "privat", title: "Bara vi och mottagaren", hint: "Ordförande, vice och info ser alltid allt." },
                ].map((o) => (
                  <label key={o.value} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-ink/10 p-3 has-[:checked]:border-ink has-[:checked]:bg-paper/60">
                    <input
                      type="radio"
                      name="visibility"
                      value={o.value}
                      defaultChecked={(task ? (task.shared ? "alla" : "privat") : "alla") === o.value}
                      className="mt-1 accent-red"
                    />
                    <span>
                      <span className="block text-sm font-semibold">{o.title}</span>
                      <span className="block text-[0.8rem] text-stone">{o.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </FormSection>
          <FormSection title="Detaljer">
            <Field label="Klart senast" name="due_date" hint="Valfritt.">
              <TextInput type="date" name="due_date" defaultValue={task?.due_date ?? ""} />
            </Field>
            <Field label="Gäller evenemang" name="event_id" hint="Valfritt.">
              <Select name="event_id" defaultValue={eventDefault === null ? "" : String(eventDefault)}>
                <option value="">Inget särskilt</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {formatDate(e.starts_at)} · {e.title}
                  </option>
                ))}
              </Select>
            </Field>
          </FormSection>
        </div>
      </div>
    </ActionForm>
  );
}
