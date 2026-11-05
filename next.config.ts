import type { NextConfig } from "next";
import { allowedOriginPatterns } from "./src/lib/allowed-origins";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Webbläsaren går direkt till https i två år efter första besöket (Fly omdirigerar redan http, fly.toml: force_https).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

// Läses när konfigurationen laddas: next dev kör development, next build (och därmed standalone-bygget) production.
const isDev = process.env.NODE_ENV !== "production";

/**
 * CSP utan nonce enligt Nexts vägledning (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md, "Without
 * Nonces"; nonce kräver dynamisk rendering av varje sida, R-26). 'unsafe-inline' behövs för Nexts egna inline-skript och skriptet i
 * src/app/layout.tsx, blob: för galleriets förhandsvisningar. I utvecklingsläget behöver React 'unsafe-eval' (samma sida,
 * "Development Environment"), och upgrade-insecure-requests utelämnas: dev-servern körs över http.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  output: "standalone",
  poweredByHeader: false,
  // bcryptjs måste ligga som eget paket i standalone-bygget: scripts/create-admin.mjs importerar det i Docker.
  serverExternalPackages: ["better-sqlite3", "sharp", "bcryptjs"],
  // Databasen och uppladdningar läses från DATA_DIR vid körning – de ska aldrig följa med i bygget. Inte heller projektets källkod,
  // dokument och prov: spårningen tar i dag med hela projektet (Turbopack-varningen om media-store.ts), men servern läser inga av
  // de filerna när den kör – den kör det som byggts till .next/.
  outputFileTracingExcludes: {
    "/*": [
      "./data/**/*",
      "./scripts/**/*",
      "./.git/**/*",
      "./README.md",
      "./AGENTS.md",
      "./docs/**/*",
      "./tests/**/*",
      "./src/**/*",
      "./.superpowers/**/*",
    ],
  },
  experimental: {
    serverActions: {
      // Dokumentformuläret skickar med filen (max 30 MB, se MAX_FILE_BYTES) plus övriga fält.
      bodySizeLimit: "32mb",
      allowedOrigins: allowedOriginPatterns(),
    },
    // src/proxy.ts körs för /admin och buffrar då request-kroppen – standard är bara 10 MB,
    // och en längre kropp kapas så att dokumentuppladdningen kraschar.
    proxyClientMaxBodySize: "32mb",
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // /media/ har en egen, strängare CSP med sandbox (src/app/media/[...path]/route.ts). Den här regeln får inte gälla där: Next
      // skriver inte över en rubrik som redan är satt (next/dist/server/send-response.js), så ruttens CSP skulle försvinna.
      { source: "/((?!media(?:/|$)).*)", headers: [{ key: "Content-Security-Policy", value: contentSecurityPolicy }] },
      // Sitemapen läser tre tabeller per anrop; Nexts standard för en dynamisk metadatarutt är max-age=0 (ST-22). Rubriken härifrån
      // vinner: Next lägger inte på ruttens egen Cache-Control när rubriken redan är satt (next/dist/server/send-response.js).
      { source: "/sitemap.xml", headers: [{ key: "Cache-Control", value: "public, max-age=3600" }] },
    ];
  },
  // Utbildning och Ny student flyttade under Studenter – gamla länkar ska fortsätta fungera.
  async redirects() {
    return [
      { source: "/utbildning", destination: "/studenter/kandidat", permanent: true },
      { source: "/ny-student", destination: "/studenter/ny-student", permanent: true },
      { source: "/studenter", destination: "/studenter/kandidat", permanent: false },
      // Menyn säger Nytt och kalendern är en vy av evenemangen, så det här är adresserna man gissar.
      { source: "/nytt", destination: "/nyheter", permanent: false },
      { source: "/kalender", destination: "/evenemang?vy=kalender", permanent: false },
      // PDF-visaren i Chrome och Edge frågar efter /favicon.ico, eftersom en PDF inte kan säga var ikonen finns. Annars blir det ett 404-fel i konsolen.
      { source: "/favicon.ico", destination: "/icon.svg", permanent: true },
    ];
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
