/**
 * Extra värdar som får skicka formulär och uppladdningar till sajten, utöver sajtens egen.
 * Behövs bakom en proxy som inte skickar vidare rätt host, och i GitHub Codespaces där
 * förhandsvisningen ligger på *.app.github.dev. Samma regler används i next.config.ts.
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
export function hostMatches(host: string, pattern: string): boolean {
  const re = pattern
    .split(".")
    .map((part) => (part === "**" ? ".+" : part === "*" ? "[^.]+" : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
    .join("\\.");
  return new RegExp(`^${re}$`, "i").test(host);
}

export function isAllowedOrigin(originHost: string, requestHost: string | null): boolean {
  if (requestHost && originHost === requestHost) return true;
  return allowedOriginPatterns().some((p) => hostMatches(originHost, p));
}
