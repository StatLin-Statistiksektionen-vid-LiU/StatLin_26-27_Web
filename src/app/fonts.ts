/**
 * Archivo serveras från public/fonts och deklareras här, i stället för med @fontsource-variable/archivo/standard.css. Då har den latinska
 * filen en fast adress som layout.tsx kan be webbläsaren hämta direkt, samtidigt som CSS:en. Den finns då oftast på plats när sidan ritas
 * första gången. Annars ritas texten först med reservtypsnittet och formas om när filen kommer, vilket på en telefon kostar en hel layout.
 *
 * Filerna är oförändrade kopior ur @fontsource-variable/archivo, med paketets version i namnet så att de kan cachas för alltid (next.config.ts).
 * Uppdateras paketet: kopiera filerna med den nya versionen i namnet och ändra VERSION. Reglerna nedan är desamma som i paketets standard.css.
 */
const VERSION = "5.3.0";

/** Den latinska delen, som täcker svenska och engelska. Den laddas i förväg; övriga delar hämtas bara om en sida har sådana tecken. */
export const ARCHIVO_LATIN = `/fonts/archivo-latin-${VERSION}.woff2`;

const face = (src: string, unicodeRange: string) =>
  `@font-face{font-family:"Archivo Variable";font-style:normal;font-display:swap;font-weight:100 900;font-stretch:62% 125%;` +
  `src:url(${src}) format("woff2-variations");unicode-range:${unicodeRange}}`;

export const ARCHIVO_FONT_FACES = [
  face(
    `/fonts/archivo-vietnamese-${VERSION}.woff2`,
    "U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB",
  ),
  face(
    `/fonts/archivo-latin-ext-${VERSION}.woff2`,
    "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF",
  ),
  face(
    ARCHIVO_LATIN,
    "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
  ),
].join("");
