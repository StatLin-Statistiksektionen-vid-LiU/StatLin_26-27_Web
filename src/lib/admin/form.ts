import { z } from "zod";

export type FormState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Fri data tillbaka till klienten, t.ex. ett genererat lösenord. */
  data?: Record<string, string>;
};

export const initialFormState: FormState = {};

/** Plattar ut zod-fel till { fält: första felmeddelandet }. */
export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function invalid(error: z.ZodError): FormState {
  return { error: "Kontrollera fälten som är markerade.", fieldErrors: zodFieldErrors(error) };
}

export function formObject(fd: FormData): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") obj[k] = v;
  return obj;
}

/* Återanvändbara zod-delar med svenska felmeddelanden */
export const zText = (max: number, label = "Fältet") =>
  z.string().trim().max(max, `${label} får vara högst ${max} tecken.`).default("");
export const zRequired = (max: number, label = "Fältet") =>
  z.string().trim().min(1, `${label} måste fyllas i.`).max(max, `${label} får vara högst ${max} tecken.`);
export const zCheckbox = z
  .string()
  .optional()
  .transform((v) => (v === "on" || v === "1" || v === "true" ? 1 : 0));
export const zOptionalId = z
  .string()
  .optional()
  .transform((v) => (v && /^\d+$/.test(v) ? Number(v) : null));
export const zLocalDateTime = (label: string) =>
  z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, `${label} måste vara ett giltigt datum och klockslag.`);
export const zOptionalLocalDateTime = z
  .string()
  .optional()
  .transform((v) => (v && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) ? v : null));
export const zUrl = z
  .string()
  .trim()
  .max(500)
  .default("")
  .refine((v) => v === "" || /^(https?:\/\/|mailto:|\/)/i.test(v), "Ange en giltig länk (börjar med https://).");
export const zEmail = z.string().trim().toLowerCase().email("Ange en giltig e-postadress.").max(200);
export const zOptionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .max(200)
  .default("")
  .refine((v) => v === "" || z.string().email().safeParse(v).success, "Ange en giltig e-postadress.");
