"use client";

import * as React from "react";
import Image from "next/image";

import { Eyebrow } from "@/components/ui";
import { gsap, useGSAP, SplitText, MQ } from "@/lib/gsap";
import { useReveal } from "@/hooks/use-reveal";
import { MANIFESTO_PHOTO } from "./media";

const LINE =
  "We are not in the transformation business. We coach the boring middle — the fourth set, the Tuesday you did not feel like it, the shoulder that clicks on the way up. Everyone here gets a written plan, a coach who watches every rep, and numbers that go in a log instead of a story. Do that for two years and the before-and-after takes care of itself.";

export function Manifesto() {
  const root = useReveal<HTMLElement>({ start: "top 85%" });
  const copy = React.useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const el = copy.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      let split: SplitText | null = null;
      let cancelled = false;

      const build = () => {
        if (cancelled) return;

        mm.add(MQ.motionOk, () => {
          split = SplitText.create(el, { type: "words" });

          // Each word lights from faint to full as the block crosses the
          // screen. Opacity only — no reflow, no repaint of the layout box.
          gsap.fromTo(
            split.words,
            { opacity: 0.14 },
            {
              opacity: 1,
              ease: "none",
              stagger: { each: 0.4 },
              scrollTrigger: {
                trigger: el,
                start: "top 80%",
                end: "bottom 55%",
                scrub: 0.4,
              },
            },
          );

          return () => {
            split?.revert();
            split = null;
          };
        });
      };

      mm.add(MQ.reduced, () => {
        gsap.set(el, { opacity: 1 });
      });

      const fontsReady = document.fonts?.ready ?? Promise.resolve();
      Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1200))]).then(build, build);

      return () => {
        cancelled = true;
        mm.revert();
      };
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="manifesto"
      aria-labelledby="manifesto-title"
      className="container-edge py-20 md:py-28 lg:py-36"
    >
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-3">
          <Eyebrow className="js-reveal">
            <span className="inline-block size-1.5 rounded-full bg-brand" aria-hidden />
            The short version
          </Eyebrow>
          <h2
            id="manifesto-title"
            className="js-reveal mt-4 text-display-sm leading-[1.02] font-extrabold tracking-[-0.04em] text-ink"
          >
            Coaching first.
            <br />
            Everything else second.
          </h2>

          <div className="js-reveal mt-8 hidden overflow-hidden rounded-[var(--radius-card)] border border-border lg:block">
            <div className="relative aspect-[4/5] w-full bg-bg-subtle">
              <Image
                src={MANIFESTO_PHOTO}
                alt="A coach chalking a set of numbers onto the whiteboard beside the lifting platforms"
                fill
                sizes="24vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-9">
          <p
            ref={copy}
            className="text-[clamp(1.35rem,3.6vw,2.6rem)] leading-[1.28] font-medium tracking-[-0.025em] text-ink text-balance"
          >
            {LINE}
          </p>

          <figure className="js-reveal mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-6">
            <figcaption className="text-sm text-ink-muted">
              <span className="font-semibold text-ink">Maya Rathore</span> · founder, head of
              coaching
            </figcaption>
            <span className="text-sm text-ink-faint">
              Coached at Ember since the first bar was loaded in 2016.
            </span>
          </figure>
        </div>
      </div>
    </section>
  );
}
