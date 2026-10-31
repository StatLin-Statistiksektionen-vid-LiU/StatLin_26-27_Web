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
  {
    label: "Studenter",
    href: "/studenter",
    children: [
      { href: "/studenter/kandidat", label: "Kandidat", description: "Statistik och dataanalys, 180 hp" },
      { href: "/studenter/master", label: "Master", description: "Statistics and Machine Learning, 120 hp" },
      { href: "/studenter/ny-student", label: "Nya studenter", description: "Mottagning, overall och vanliga frågor" },
    ],
  },
  { label: "Företag", href: "/foretag" },
  { label: "Kontakt", href: "/kontakt" },
];

/** Var de redigerbara sidorna (pages-tabellen) visas på sajten. */
export const PAGE_PATHS: Record<string, string> = {
  om: "/sektionen",
  utbildning: "/studenter/kandidat",
  master: "/studenter/master",
  "ny-student": "/studenter/ny-student",
  foretag: "/foretag",
  kontakt: "/kontakt",
  en: "/en",
  "en-masters": "/en/masters",
};

/** Engelska sidor ligger under /en – resten av sajten är på svenska. */
export const isEnglishPath = (pathname: string) => pathname === "/en" || pathname.startsWith("/en/");
