"use client";

import { useRef } from "react";

import { gsap, useGSAP, ScrollTrigger, MQ } from "@/lib/gsap";

type RevealOptions = {
  /** Distance in px the element travels up into place. */
  distance?: number;
  /** Seconds between siblings entering together. */
  stagger?: number;
  /** Viewport line the element has to cross, as a ScrollTrigger `start`. */
  start?: string;
};

/**
 * Batched fade-and-lift. Call it inside a `gsap.matchMedia()` block that has
 * already ruled out reduced motion — it hides the elements first, so the
 * caller owns the promise that something will show them again.
 */
export function batchReveal(els: HTMLElement[], options: RevealOptions = {}) {
  const { distance = 26, stagger = 0.08, start = "top 88%" } = options;
  if (!els.length) return;

  gsap.set(els, { opacity: 0, y: distance, willChange: "transform, opacity" });

  ScrollTrigger.batch(els, {
    start,
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.85,
        stagger,
        ease: "power3.out",
        overwrite: "auto",
        onComplete: () => gsap.set(batch, { willChange: "auto" }),
      }),
  });

  // Failsafe: anything sitting above the viewport on load never gets an enter
  // event. Nothing may stay invisible.
  requestAnimationFrame(() => {
    els.forEach((el) => {
      if (el.getBoundingClientRect().bottom < 0) {
        gsap.set(el, { opacity: 1, y: 0, willChange: "auto" });
      }
    });
  });
}

/**
 * Returns a scope ref. Every `.js-reveal` inside it fades and lifts into view
 * once, batched so elements that share a screenful enter as a group.
 *
 * `.js-reveal` starts at `opacity: 0` in CSS, so the contract is strict: if a
 * trigger never fires the content would be invisible. Two safety nets prevent
 * that — reduced-motion users get everything set visible immediately, and any
 * element already scrolled past on load (restored scroll position, anchor
 * link) is revealed without waiting for an enter event.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(options: RevealOptions = {}) {
  const { distance = 26, stagger = 0.08, start = "top 88%" } = options;
  const scope = useRef<T>(null);

  useGSAP(
    () => {
      const root = scope.current;
      if (!root) return;

      // `[data-split]` opts an element out — those headings are owned by
      // useSplitReveal, which reveals them line by line instead.
      const els = gsap.utils.toArray<HTMLElement>(".js-reveal:not([data-split])", root);
      if (!els.length) return;

      const mm = gsap.matchMedia();

      mm.add(MQ.reduced, () => {
        gsap.set(els, { opacity: 1, y: 0 });
      });

      mm.add(MQ.motionOk, () => {
        batchReveal(els, { distance, stagger, start });
      });

      return () => mm.revert();
    },
    { scope },
  );

  return scope;
}
