"use client";

import * as React from "react";
import { ReactLenis } from "lenis/react";

import { useLenisGsapSync } from "@/hooks/use-lenis";

/** Lives inside the provider so it can grab the Lenis instance. */
function LenisGsapBridge() {
  useLenisGsapSync();
  return null;
}

/**
 * Smooth scroll for the marketing routes only — the dashboard and admin
 * shells scroll natively. `root` puts Lenis on the document, which also adds
 * the `lenis` class to <html> that globals.css already accounts for.
 *
 * Under `prefers-reduced-motion` Lenis is not mounted at all: hijacked
 * scrolling is exactly the kind of motion that setting is asking us to drop.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const [smooth, setSmooth] = React.useState(true);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setSmooth(!mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  if (!smooth) return <>{children}</>;

  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        duration: 1.1,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.6,
        autoRaf: false, // gsap.ticker drives it — see useLenisGsapSync
      }}
    >
      <LenisGsapBridge />
      {children}
    </ReactLenis>
  );
}
