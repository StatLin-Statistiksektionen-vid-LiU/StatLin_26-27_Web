export type NavItem = { href: string; label: string; description?: string };
export type NavGroup = { label: string; href: string; children?: NavItem[] };

export const NAV: NavGroup[] = [
  { label: "Evenemang", href: "/evenemang" },
  { label: "Nyheter", href: "/nyheter" },
  {
    label: "Sektionen",
    href: "/sektionen",
    children: [
      { href: "/sektionen", label: "Om StatLin", description: "Vilka vi är och vad vi gör" },
      { href: "/sektionen/styrelsen", label: "Styrelsen", description: "Poster och kontaktuppgifter" },
      { href: "/utskott", label: "Utskott", description: "SCB, UBU, SASU, StatPub, STIG, eSTIG" },
      { href: "/galleri", label: "Galleri", description: "Bilder från evenemang" },
      { href: "/dokument", label: "Dokument", description: "Stadgar, protokoll och styrdokument" },
      { href: "/grafisk-profil", label: "Grafisk profil", description: "Loggor, färger och typsnitt" },
    ],
  },
  { label: "Utbildning", href: "/utbildning" },
  { label: "Ny student", href: "/ny-student" },
  { label: "Företag", href: "/foretag" },
  { label: "Kontakt", href: "/kontakt" },
];

/** Var de redigerbara sidorna (pages-tabellen) visas på sajten. */
export const PAGE_PATHS: Record<string, string> = {
  om: "/sektionen",
  "ny-student": "/ny-student",
  utbildning: "/utbildning",
  foretag: "/foretag",
  kontakt: "/kontakt",
  en: "/en",
  "en-masters": "/en/masters",
};

/** Engelska sidor ligger under /en – resten av sajten är på svenska. */
export const isEnglishPath = (pathname: string) => pathname === "/en" || pathname.startsWith("/en/");
