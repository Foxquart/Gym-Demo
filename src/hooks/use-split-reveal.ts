"use client";

import { useRef } from "react";

import { gsap, useGSAP, SplitText, MQ } from "@/lib/gsap";

/**
 * Line-by-line reveal for a heading. Attach the returned ref to an element
 * carrying `.js-reveal` — this hook is what turns it visible again.
 *
 * The split is deferred until the display font has loaded (with a hard
 * timeout) because splitting against a fallback metric produces the wrong
 * line breaks and a visible reflow.
 */
export function useSplitReveal<T extends HTMLElement = HTMLHeadingElement>({
  start = "top 86%",
  stagger = 0.09,
}: { start?: string; stagger?: number } = {}) {
  const ref = useRef<T>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      let split: SplitText | null = null;
      let cancelled = false;

      mm.add(MQ.reduced, () => {
        gsap.set(el, { opacity: 1 });
      });

      const build = () => {
        if (cancelled) return;
        mm.add(MQ.motionOk, () => {
          split = SplitText.create(el, { type: "lines", mask: "lines" });
          gsap.set(el, { opacity: 1 });

          const tween = gsap.from(split.lines, {
            yPercent: 116,
            opacity: 0,
            duration: 1,
            stagger,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start, once: true },
          });

          return () => {
            tween.kill();
            split?.revert();
            split = null;
          };
        });
      };

      const fontsReady = document.fonts?.ready ?? Promise.resolve();
      Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1200))]).then(build, build);

      return () => {
        cancelled = true;
        mm.revert();
      };
    },
    { scope: ref },
  );

  return ref;
}
