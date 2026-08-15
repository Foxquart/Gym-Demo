"use client";

/**
 * Central GSAP registration. Import `gsap`, `ScrollTrigger`, `SplitText` and
 * `useGSAP` from HERE and nowhere else — registering a plugin twice is
 * harmless but importing the raw module in several places makes it easy to
 * forget the `registerPlugin` call and ship a silently dead animation.
 */
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

// House style: everything eases out of the gate unless told otherwise.
gsap.defaults({ ease: "power3.out", duration: 0.9 });

// Pinned sections read better when ScrollTrigger ignores the mobile URL-bar
// resize; otherwise every address-bar collapse re-runs a full refresh.
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, useGSAP, ScrollTrigger, SplitText };

/** Matches GSAP's own expo-out — mirrors `--ease-out-expo` in globals.css. */
export const EASE_EXPO = "expo.out";

/** Shared media-query map for `gsap.matchMedia()`. */
export const MQ = {
  isDesktop: "(min-width: 1024px)",
  isMobile: "(max-width: 1023px)",
  reduced: "(prefers-reduced-motion: reduce)",
  motionOk: "(prefers-reduced-motion: no-preference)",
} as const;
