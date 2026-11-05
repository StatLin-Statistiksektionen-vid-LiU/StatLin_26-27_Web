/**
 * Felen från inloggningen. Efter ett formulär utan JavaScript står koden i adressen och inte texten, så att en länk inte kan skriva
 * egen text på inloggningssidan.
 */
export const LOGIN_ERRORS = {
  uppgifter: "Fel e-postadress eller lösenord.",
  forsok: "För många inloggningsförsök. Vänta en stund och försök igen.",
  avstangt: "Kontot är avstängt – kontakta en administratör.",
} as const;

/** Koden för ett fel från inloggningen. Ett tomt fält har ingen egen kod: webbläsaren stoppar det innan formuläret skickas. */
export function loginErrorCode(text: string | undefined): string {
  return Object.entries(LOGIN_ERRORS).find(([, error]) => error === text)?.[0] ?? "uppgifter";
}

/** Texten till en kod ur adressen. Adressen kan innehålla vad som helst, också namn som alla objekt har, till exempel constructor. */
export function loginErrorText(code: unknown): string | undefined {
  return typeof code === "string" && Object.hasOwn(LOGIN_ERRORS, code) ? LOGIN_ERRORS[code as keyof typeof LOGIN_ERRORS] : undefined;
}
