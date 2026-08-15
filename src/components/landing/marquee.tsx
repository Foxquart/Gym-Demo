"use client";

import * as React from "react";

import { gsap, useGSAP, ScrollTrigger, MQ } from "@/lib/gsap";

const ROW_ONE = [
  "Barbell Strength",
  "Conditioning",
  "Olympic Lifting",
  "Mobility",
  "Sled & Carries",
  "Hypertrophy",
];

const ROW_TWO = [
  "Movement Screens",
  "Sauna & Plunge",
  "Sprint Work",
  "Deadlift Clinic",
  "Breathwork",
  "Return to Sport",
];

/**
 * Four identical copies so the strip still covers a 2560px viewport at the
 * far end of a one-copy translation. The tween shifts by exactly 1/4 of the
 * track, which is one copy — the seam is never visible.
 */
const COPIES = [0, 1, 2, 3];

function Row({ items, textClass }: { items: string[]; textClass: string }) {
  return (
    <>
      {COPIES.map((copy) => (
        <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy > 0}>
          {items.map((item) => (
            <span key={item} className={`flex shrink-0 items-center ${textClass}`}>
              <span className="px-5 sm:px-7">{item}</span>
              <span className="size-1.5 shrink-0 rounded-full bg-current opacity-50" aria-hidden />
            </span>
          ))}
        </div>
      ))}
    </>
  );
}

/**
 * Two counter-running tickers. Base speed is constant; scrolling speeds them
 * up and flips their direction, so the strip reads as part of the scroll.
 */
export function DisciplineMarquee() {
  const root = React.useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(MQ.motionOk, () => {
        const one = gsap.fromTo(
          ".js-marquee-a",
          { xPercent: 0 },
          { xPercent: -25, duration: 26, ease: "none", repeat: -1 },
        );
        const two = gsap.fromTo(
          ".js-marquee-b",
          { xPercent: -25 },
          { xPercent: 0, duration: 34, ease: "none", repeat: -1 },
        );

        let direction = 1;
        const settle = gsap
          .delayedCall(0.4, () => {
            gsap.to([one, two], { timeScale: direction, duration: 0.9, overwrite: true });
          })
          .pause();

        const st = ScrollTrigger.create({
          start: 0,
          end: () => ScrollTrigger.maxScroll(window),
          onUpdate: (self) => {
            direction = self.direction;
            const boost = 1 + gsap.utils.clamp(0, 3.5, Math.abs(self.getVelocity()) / 650);
            gsap.to([one, two], { timeScale: direction * boost, duration: 0.25, overwrite: true });
            settle.restart(true);
          },
        });

        return () => {
          settle.kill();
          st.kill();
          one.kill();
          two.kill();
        };
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      aria-label="What we coach"
      className="relative w-full border-y border-border"
    >
      <div className="w-full overflow-hidden bg-brand py-4 text-brand-ink sm:py-5">
        <div className="js-marquee-a flex w-max">
          <Row
            items={ROW_ONE}
            textClass="font-display text-[clamp(1.5rem,4.4vw,3rem)] leading-none font-extrabold tracking-[-0.03em] uppercase"
          />
        </div>
      </div>

      <div className="w-full overflow-hidden border-t border-border bg-bg-subtle py-3 text-ink-muted sm:py-4">
        <div className="js-marquee-b flex w-max">
          <Row
            items={ROW_TWO}
            textClass="font-display text-[clamp(0.95rem,2.2vw,1.5rem)] leading-none font-semibold tracking-[-0.02em] uppercase"
          />
        </div>
      </div>
    </section>
  );
}
