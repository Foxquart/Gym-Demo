"use client";

import { useEffect } from "react";
import { useLenis } from "lenis/react";

import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Marries Lenis to GSAP: ScrollTrigger has to be told about every Lenis frame,
 * and Lenis has to be driven by GSAP's ticker rather than its own rAF loop or
 * the two run a frame apart and pinned sections jitter.
 *
 * Mounted once, inside the `<ReactLenis>` provider.
 */
export function useLenisGsapSync() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    const raf = (time: number) => lenis.raf(time * 1000); // GSAP ticker is in seconds
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Fonts and remote images settle after hydration; measure once they have.
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh).catch(() => {});
    window.addEventListener("load", refresh);

    return () => {
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      window.removeEventListener("load", refresh);
    };
  }, [lenis]);

  return lenis;
}

export { useLenis };
