/**
 * Visas på de engelska sidorna: resten av sajten är på svenska, men webbläsarens inbyggda
 * översättning fungerar (inget på sajten blockerar den). Tas bort när hela sajten finns på engelska.
 */
export function TranslateTip() {
  return (
    <div className="rounded-[1.75rem] bg-ink p-7 text-white">
      <p className="kicker text-white/50">Reading the rest of the site</p>
      <p className="mt-3 text-[0.95rem] leading-relaxed text-white/75">Most pages are in Swedish for now, but your browser can translate them for you.</p>
      <ul className="mt-4 space-y-2.5 text-[0.95rem] leading-relaxed text-white/75">
        <li>
          <strong className="text-white">Computer:</strong> right-click the page and choose Translate (Chrome and Edge).
        </li>
        <li>
          <strong className="text-white">Android:</strong> open the ⋮ menu in Chrome and choose Translate.
        </li>
        <li>
          <strong className="text-white">iPhone:</strong> open the page in the Chrome app and choose Translate in the … menu.
        </li>
      </ul>
    </div>
  );
}
