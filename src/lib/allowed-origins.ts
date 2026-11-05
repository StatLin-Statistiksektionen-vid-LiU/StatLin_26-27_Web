/**
 * Extra värdar som får skicka formulär och uppladdningar till sajten, utöver sajtens egen.
 * Behövs bakom en proxy som inte skickar vidare rätt host, och i GitHub Codespaces där
 * förhandsvisningen ligger på *.app.github.dev. next.config.ts läser samma lista för server actions.
 *
 *   ALLOWED_ORIGINS=statlin.se,*.statlin.se
 */
export function allowedOriginPatterns(): string[] {
  return [
    ...(process.env.ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    ...(process.env.CODESPACES === "true" ? ["*.app.github.dev"] : []),
  ];
}

/** `*` matchar exakt en del av värdnamnet, `**` en eller flera (som Next.js allowedOrigins). */
function hostMatches(host: string, pattern: string): boolean {
  const re = pattern
    .split(".")
    .map((part) => (part === "**" ? ".+" : part === "*" ? "[^.]+" : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
    .join("\\.");
  return new RegExp(`^${re}$`, "i").test(host);
}

function isAllowedOrigin(originHost: string, requestHost: string | null): boolean {
  if (requestHost && originHost === requestHost) return true;
  return allowedOriginPatterns().some((p) => hostMatches(originHost, p));
}

function originHost(origin: string): string {
  try {
    return new URL(origin).host;
  } catch {
    return "";
  }
}

/**
 * CSRF-skydd för route handlers som tar emot POST, utöver SameSite-kakan (SD-20). Med Origin måste den vara sajten själv
 * (eller en tillåten värd) – ett ogiltigt ursprung som "null" från en sandlådad sida nekas. Utan Origin krävs att
 * webbläsaren intygar samma ursprung med Sec-Fetch-Site; ett anrop utan någon av rubrikerna (ett skript, en äldre klient)
 * släpps inte längre igenom.
 */
export function isSameOriginRequest(headers: Headers): boolean {
  const origin = headers.get("origin");
  if (origin) return isAllowedOrigin(originHost(origin), headers.get("x-forwarded-host") ?? headers.get("host"));
  return headers.get("sec-fetch-site") === "same-origin";
}
