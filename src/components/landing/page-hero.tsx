"use client";

import * as React from "react";

import { Eyebrow } from "@/components/ui";
import { useReveal } from "@/hooks/use-reveal";
import { useSplitReveal } from "@/hooks/use-split-reveal";

export function PageHero({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  children?: React.ReactNode;
}) {
  const root = useReveal<HTMLDivElement>({ start: "top 95%" });
  const heading = useSplitReveal<HTMLHeadingElement>({ start: "top 95%" });

  return (
    <section className="grain relative isolate overflow-hidden border-b border-border pt-28 pb-14 md:pt-36 md:pb-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-[40%] -right-[10%] h-[60vw] w-[60vw] max-h-[720px] max-w-[720px] rounded-full bg-brand/22 blur-[120px]" />
        <div className="absolute -bottom-[45%] -left-[15%] h-[55vw] w-[55vw] max-h-[640px] max-w-[640px] rounded-full bg-amber/18 blur-[120px]" />
      </div>

      <div ref={root} className="container-edge">
        <Eyebrow className="js-reveal">
          <span className="inline-block size-1.5 rounded-full bg-brand" aria-hidden />
          {eyebrow}
        </Eyebrow>

        <h1
          ref={heading}
          data-split
          className="js-reveal mt-5 max-w-5xl text-display-lg leading-[0.9] font-extrabold tracking-[-0.045em] text-ink"
        >
          {title}
        </h1>

        <p className="js-reveal mt-7 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
          {lead}
        </p>

        {children ? <div className="js-reveal mt-9">{children}</div> : null}
      </div>
    </section>
  );
}
