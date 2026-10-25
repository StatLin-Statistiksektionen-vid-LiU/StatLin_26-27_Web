"use client";

import { useState } from "react";
import { saveUser } from "@/app/admin/_actions/users";
import { ActionForm } from "./action-form";
import { Field, FormSection, Select, TextInput, Toggle } from "./fields";
import type { UserListItem } from "@/lib/data/admin";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, type Committee, type Role } from "@/lib/types";
import { cn } from "@/lib/utils";

export function UserForm({ user, committees }: { user?: UserListItem | null; committees: Pick<Committee, "id" | "short_name" | "name">[] }) {
  const [role, setRole] = useState<Role>(user?.role ?? "committee");
  return (
    <ActionForm action={saveUser} submitLabel={user ? "Spara konto" : "Skapa konto"} resetOnSuccess={!user} stickyFooter={false}>
      {user && <input type="hidden" name="id" value={user.id} />}
      <FormSection title={user ? "Konto" : "Nytt konto"} description={user ? undefined : "Ett tillfälligt lösenord genereras och visas när kontot skapats."}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Namn" name="name" required>
            <TextInput name="name" defaultValue={user?.name} maxLength={120} />
          </Field>
          <Field label="E-post" name="email" required hint="Använd postens adress, t.ex. kassor@statlin.se.">
            <TextInput name="email" type="email" defaultValue={user?.email} />
          </Field>
        </div>
        <Field label="Post" name="post">
          <TextInput name="post" defaultValue={user?.post} placeholder="Informationsansvarig" maxLength={120} />
        </Field>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Roll</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
              <label
                key={r}
                className={cn(
                  "cursor-pointer rounded-2xl border p-3.5 transition-colors",
                  role === r ? "border-ink bg-ink text-white" : "border-ink/15 bg-white hover:border-ink/40",
                )}
              >
                <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="sr-only" />
                <span className="block text-sm font-bold">{ROLE_LABELS[r]}</span>
                <span className={cn("mt-1 block text-xs leading-snug", role === r ? "text-white/70" : "text-stone")}>{ROLE_DESCRIPTIONS[r]}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <Field label="Utskott" name="committee_id" hint={role === "committee" ? "Kontot kan bara hantera innehåll för det här utskottet." : "Valfritt för administratörer och redaktörer."}>
          <Select name="committee_id" defaultValue={String(user?.committee_id ?? "")}>
            <option value="">{role === "committee" ? "Välj utskott…" : "Inget"}</option>
            {committees.map((c) => (
              <option key={c.id} value={c.id}>
                {c.short_name} – {c.name}
              </option>
            ))}
          </Select>
        </Field>
        {user && <Toggle name="active" label="Aktivt konto" defaultChecked={!!user.active} hint="Inaktiva konton kan inte logga in." />}
      </FormSection>
    </ActionForm>
  );
}
