import { Fragment } from "react";

/**
 * Text från adminpanelen där *ord* får accentstil och radbrytningar behålls.
 * Används för redigerbara rubriker, t.ex. hero och "Om sektionen" på startsidan.
 */
export function AccentText({ text, accentClassName = "mono-accent text-red" }: { text: string; accentClassName?: string }) {
  return (
    <>
      {text
        .trim()
        .split(/\r?\n/)
        .map((line, i) => (
          <Fragment key={i}>
            {i > 0 && <br />}
            {line.split(/\*([^*]+)\*/g).map((part, j) =>
              j % 2 === 1 ? (
                <span key={j} className={accentClassName}>
                  {part}
                </span>
              ) : (
                part
              ),
            )}
          </Fragment>
        ))}
    </>
  );
}

/** Samma text utan markeringar – för title-taggar och skärmläsare. */
export function stripAccent(text: string): string {
  return text.replace(/\*([^*]+)\*/g, "$1").replace(/\s*\r?\n\s*/g, " ").trim();
}
