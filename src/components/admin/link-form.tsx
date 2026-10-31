import { saveCourse, saveLink } from "@/app/admin/_actions/links";
import { LINK_CATEGORIES, LINK_ICONS, PROGRAMS, formatCredits } from "@/lib/links";
import type { Course, LinkItem } from "@/lib/types";
import { ActionForm } from "./action-form";
import { Field, FormSection, Select, TextInput, Toggle } from "./fields";

export function LinkForm({ link, nextOrder = 0 }: { link?: LinkItem | null; nextOrder?: number }) {
  return (
    <ActionForm action={saveLink} submitLabel={link ? "Spara" : "Lägg till länk"} stickyFooter={false}>
      {link && <input type="hidden" name="id" value={link.id} />}
      <FormSection title={link ? "Länk" : "Ny länk"}>
        <Field label="Namn" name="label" required>
          <TextInput name="label" defaultValue={link?.label} maxLength={80} />
        </Field>
        <Field label="Adress" name="url" required hint="En hel adress (https://…) eller en sida på sajten, till exempel /tentastatistik.">
          <TextInput name="url" defaultValue={link?.url} placeholder="https://" maxLength={500} />
        </Field>
        <Field label="Beskrivning" name="description" hint="En kort rad under namnet.">
          <TextInput name="description" defaultValue={link?.description} maxLength={160} />
        </Field>
        <Field label="Sökord" name="keywords" hint="Andra ord som ska hitta länken, till exempel timeedit kalender.">
          <TextInput name="keywords" defaultValue={link?.keywords} maxLength={200} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Grupp" name="category">
            <Select name="category" defaultValue={link?.category ?? "studier"}>
              {LINK_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Ikon" name="icon" hint="Syns när länken är en genväg.">
            <Select name="icon" defaultValue={link?.icon ?? "link"}>
              {LINK_ICONS.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Sortering" name="sort_order" hint="Lägre nummer visas först.">
          <TextInput name="sort_order" type="number" min={0} defaultValue={link?.sort_order ?? nextOrder} />
        </Field>
        <Toggle
          name="featured"
          label="Genväg"
          hint="Visas som en stor knapp överst på länksidan och i raden Genvägar på startsidan och studentsidorna."
          defaultChecked={!!link?.featured}
        />
        <Toggle name="active" label="Visas på sajten" defaultChecked={link ? !!link.active : true} />
      </FormSection>
    </ActionForm>
  );
}

export function CourseForm({ course, nextOrder = 0 }: { course?: Course | null; nextOrder?: number }) {
  return (
    <ActionForm action={saveCourse} submitLabel={course ? "Spara" : "Lägg till kurs"} stickyFooter={false}>
      {course && <input type="hidden" name="id" value={course.id} />}
      <FormSection title={course ? "Kurs" : "Ny kurs"}>
        <div className="grid gap-5 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <Field label="Kurskod" name="code" required>
            <TextInput name="code" defaultValue={course?.code} maxLength={6} placeholder="732G33" className="font-mono uppercase" />
          </Field>
          <Field label="Kursnamn" name="name" required>
            <TextInput name="name" defaultValue={course?.name} maxLength={140} />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Program" name="program">
            <Select name="program" defaultValue={course?.program ?? "kandidat"}>
              {PROGRAMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Termin" name="term">
            <TextInput name="term" type="number" min={1} max={10} defaultValue={course?.term ?? 1} />
          </Field>
          <Field label="Högskolepoäng" name="credits">
            <TextInput name="credits" inputMode="decimal" defaultValue={course ? formatCredits(course.credits).replace(" hp", "") : "7,5"} />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Period" name="period" hint="Till exempel 1, 2 eller 1–2.">
            <TextInput name="period" defaultValue={course?.period} maxLength={20} />
          </Field>
          <Field label="Sortering" name="sort_order" hint="Inom terminen. Lägre nummer visas först.">
            <TextInput name="sort_order" type="number" min={0} defaultValue={course?.sort_order ?? nextOrder} />
          </Field>
        </div>
        <Field label="Egen kurslänk" name="url" hint="Valfri, till exempel kursens webbsida. Kursplanen hos LiU länkas alltid.">
          <TextInput name="url" type="url" defaultValue={course?.url} placeholder="https://" />
        </Field>
        <Toggle name="elective" label="Valbar kurs" defaultChecked={!!course?.elective} />
        <Toggle name="active" label="Visas på sajten" defaultChecked={course ? !!course.active : true} />
      </FormSection>
    </ActionForm>
  );
}
