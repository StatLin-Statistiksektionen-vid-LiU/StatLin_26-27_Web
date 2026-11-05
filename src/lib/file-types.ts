/** Tillåtna dokumenttyper för uppladdning (filändelse → MIME-typ). */
export const FILE_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  odt: "application/vnd.oasis.opendocument.text",
  txt: "text/plain; charset=utf-8",
  zip: "application/zip",
  // Bara som nedladdning: /media skickar alltid SVG med attachment, eftersom en SVG kan bära skript.
  svg: "image/svg+xml",
};

/**
 * MIME-typen för en tillåten filändelse, annars undefined. Bara listans egna nycklar räknas – FILE_TYPES["constructor"]
 * eller ["__proto__"] ger annars något från Object.prototype, och filen x.constructor släpptes igenom.
 */
export function fileMime(ext: string): string | undefined {
  return Object.hasOwn(FILE_TYPES, ext) ? FILE_TYPES[ext] : undefined;
}
