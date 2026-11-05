/**
 * Håller kvar besökarens plats vid omladdning och när hela sidan laddas om efter bakåt från en annan webbplats.
 *
 * Sidorna strömmas in: först kommer ett kort skal, sedan innehållet. Webbläsaren lägger tillbaka platsen medan skalet är allt som finns, fastnar
 * i dess botten och följer sedan med sidfoten ner när innehållet kommer, så besökaren hamnar någon helt annanstans. Här sparar sajten platsen
 * själv och lägger tillbaka den när sidan är lång nog, och igen om den växer ovanför.
 *
 * history.scrollRestoration står på "manual" bara medan det pågår. Nya poster i historiken ärver läget, och bakåt inom sajten sköter webbläsaren
 * bra själv. Skriptet ligger i head för att hinna före webbläsarens första försök.
 */
export const SCROLL_RESTORE_SCRIPT = `(function () {
  try {
    var store = sessionStorage;
    var key = function () { return "statlin-plats:" + location.pathname + location.search; };
    var restoring = false;
    var save = function () {
      if (restoring) return;
      try { store.setItem(key(), String(Math.round(scrollY))); } catch (e) {}
    };
    var timer = 0;
    addEventListener("scroll", function () {
      if (!timer) timer = setTimeout(function () { timer = 0; save(); }, 200);
    }, { passive: true });
    addEventListener("pagehide", save);

    var nav = performance.getEntriesByType("navigation")[0];
    if (!nav || (nav.type !== "reload" && nav.type !== "back_forward")) return;
    var saved = store.getItem(key());
    if (saved === null) return;
    var target = Number(saved);
    var takeover = ["wheel", "touchstart", "keydown", "mousedown"];
    var root = document.documentElement;
    var start = performance.now();
    var height = -1, changed = start, parsed = 0, applied = -1, over = false;
    var finish = function () {
      if (over) return;
      over = true;
      restoring = false;
      history.scrollRestoration = "auto";
      takeover.forEach(function (e) { removeEventListener(e, finish, true); });
    };
    restoring = true;
    history.scrollRestoration = "manual";
    takeover.forEach(function (e) { addEventListener(e, finish, { capture: true, passive: true }); });
    var step = function () {
      if (over) return;
      var now = performance.now();
      var h = root.scrollHeight;
      if (h !== height) { height = h; changed = now; }
      if (!parsed && document.readyState !== "loading") parsed = now;
      var settled = (parsed && now - parsed > 500 && now - changed > 300) || now - start > 8000;
      var max = h - innerHeight;
      if ((max >= target || settled) && applied !== h) {
        applied = h;
        scrollTo(0, Math.min(target, max));
      }
      if (settled) finish();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  } catch (e) {}
})();`;
