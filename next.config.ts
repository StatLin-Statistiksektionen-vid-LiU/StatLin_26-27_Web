import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// Extra värdar som får anropa server actions – se src/lib/allowed-origins.ts.
const allowedOrigins = [
  ...(process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  ...(process.env.CODESPACES === "true" ? ["*.app.github.dev"] : []),
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  output: "standalone",
  poweredByHeader: false,
  // bcryptjs måste ligga som eget paket i standalone-bygget: scripts/create-admin.mjs importerar det i Docker.
  serverExternalPackages: ["better-sqlite3", "sharp", "bcryptjs"],
  // Databasen och uppladdningar läses från DATA_DIR vid körning – de ska aldrig följa med i bygget.
  outputFileTracingExcludes: {
    "/*": ["./data/**/*", "./scripts/**/*", "./.git/**/*", "./README.md", "./AGENTS.md"],
  },
  experimental: {
    serverActions: {
      // Dokumentformuläret skickar med filen (max 30 MB, se MAX_FILE_BYTES) plus övriga fält.
      bodySizeLimit: "32mb",
      allowedOrigins,
    },
    // src/proxy.ts körs för /admin och buffrar då request-kroppen – standard är bara 10 MB,
    // och en längre kropp kapas så att dokumentuppladdningen kraschar.
    proxyClientMaxBodySize: "32mb",
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
