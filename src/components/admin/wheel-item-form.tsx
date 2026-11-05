"use client";

import { saveWheelItem } from "@/app/admin/_actions/arshjul";
import { ActionForm } from "@/components/admin/action-form";
import { Field, Select, TextArea, TextInput } from "@/components/admin/fields";
import { MONTHS, type WheelItem } from "@/lib/arshjul";
import { PLAN_TEMPLATES } from "@/lib/projektplan-mallar";

export function WheelItemForm({ item, responsibleOptions, defaultMonth }: { item?: WheelItem | null; responsibleOptions: string[]; defaultMonth?: number | null }) {
  return (
    <ActionForm
      action={saveWheelItem}
      version={item?.updated_at}
      submitLabel={item ? "Spara" : "Lägg till punkten"}
      className="max-w-2xl"
    >
      {item && <input type="hidden" name="id" value={item.id} />}
      <Field label="Rubrik" name="title" required>
        <TextInput name="title" defaultValue={item?.title} maxLength={140} />
      </Field>
      <Field label="Beskrivning" name="description" hint="Vad är det som ska hända, och vad behöver nästa års post veta?">
        <TextArea name="description" defaultValue={item?.description} maxLength={2000} />
      </Field>
      <Field label="Ansvarig" name="responsible" hint="En post eller ett utskott. Hittas kontot går uppdrag från punkten dit, annars blir de öppna för vem som helst.">
        <TextInput name="responsible" defaultValue={item?.responsible} maxLength={80} list="ansvariga" autoComplete="off" />
        <datalist id="ansvariga">
          {responsibleOptions.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      </Field>
      <div className="grid gap-5 @lg:grid-cols-2">
        <Field label="Månad" name="month" hint="Vet ni inte exakt, välj bara en termin.">
          <Select name="month" defaultValue={item?.month ?? defaultMonth ?? ""}>
            <option value="">Ingen bestämd månad</option>
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Termin" name="term" hint="Januari–juni är VT, juli–december HT.">
          <Select name="term" defaultValue={item?.month ? "" : (item?.term ?? "")}>
            <option value="">Följer månaden</option>
            <option value="vt">VT</option>
            <option value="ht">HT</option>
          </Select>
        </Field>
      </div>
      <Field label="Beror på andra" name="depends_on" hint="Till exempel en gästföreläsare eller ett företag som måste bokas i god tid. Punkten hamnar då på kortet Att planera in denna termin.">
        <TextInput name="depends_on" defaultValue={item?.depends_on} maxLength={200} />
      </Field>
      <Field label="Mall för projektplan" name="template" hint="Valfritt. Planer från punkten börjar med den här mallen.">
        <Select name="template" defaultValue={item?.template ?? ""}>
          <option value="">Ingen särskild</option>
          {PLAN_TEMPLATES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.name}
            </option>
          ))}
        </Select>
      </Field>
    </ActionForm>
  );
}
