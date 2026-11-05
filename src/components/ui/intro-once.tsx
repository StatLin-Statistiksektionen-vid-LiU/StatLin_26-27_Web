"use client";

import { useLayoutEffect, useRef } from "react";

/** Två körningar så nära varandra är Reacts StrictMode, inte en sida som visas igen. */
const SAME_MOUNT_MS = 200;

/** Modulen lever tills sidan laddas om, så det gäller också när Next har kastat den dolda sidan och byggt upp den på nytt. */
let playedAt = 0;

/**
 * Next gömmer förra sidan med display: none, och när den visas igen startar webbläsaren om alla CSS-animationer i den.
 * Den här ligger direkt i heron och spolar fram det som bara ska spelas en gång innan sidan syns, så att introt inte börjar om vid bakåtnavigering. Det som går i en slinga får fortsätta.
 */
export function IntroOnce() {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const now = performance.now();
    if (!playedAt) {
      playedAt = now;
      return;
    }
    if (now - playedAt < SAME_MOUNT_MS) return;
    for (const animation of ref.current?.parentElement?.getAnimations({ subtree: true }) ?? []) {
      if (animation.effect?.getComputedTiming().iterations !== Infinity) animation.finish();
    }
  }, []);

  return <span ref={ref} hidden />;
}
