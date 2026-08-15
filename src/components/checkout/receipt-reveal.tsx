"use client";

import * as React from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

/**
 * A small entrance for the confirmation screen — the seal pops, the receipt
 * lines settle in. Nothing is hidden by CSS, so if JS never runs the page is
 * still complete; `matchMedia` skips the whole thing under reduced motion.
 */
export function ReceiptReveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const scope = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const timeline = gsap.timeline({ defaults: { ease: "expo.out" } });

        timeline
          .from("[data-seal]", { scale: 0.6, opacity: 0, duration: 0.7, ease: "back.out(2)" })
          .from("[data-reveal]", { y: 18, opacity: 0, duration: 0.7, stagger: 0.07 }, "-=0.4")
          .from(
            "[data-line]",
            { opacity: 0, x: -10, duration: 0.5, stagger: 0.04 },
            "-=0.45",
          );
      });
      return () => mm.revert();
    },
    { scope },
  );

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}
