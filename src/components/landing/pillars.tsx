"use client";

import * as React from "react";
import Image from "next/image";
import { Check } from "lucide-react";

import { Eyebrow } from "@/components/ui";
import { gsap, useGSAP, MQ } from "@/lib/gsap";
import { batchReveal, useReveal } from "@/hooks/use-reveal";
import { PILLAR_PHOTOS } from "./media";

const PILLARS = [
  {
    index: "01",
    title: "Strength",
    lead: "Squat, hinge, press, pull — loaded slowly and tested on the calendar, not on a whim.",
    points: ["A written block, refreshed monthly", "Video review on the big three", "Testing week every eight weeks"],
    image: PILLAR_PHOTOS.strength,
    alt: "Two members working through a squat rack circuit under coaching",
  },
  {
    index: "02",
    title: "Conditioning",
    lead: "Rower, bike, sled and hills. Built so the last round is survivable and next month is easy.",
    points: ["Intervals scaled per person", "Heart-rate zones, not vibes", "No burpee punishment, ever"],
    image: PILLAR_PHOTOS.conditioning,
    alt: "A conditioning class mid-interval on rowing machines",
  },
  {
    index: "03",
    title: "Mobility",
    lead: "Screens before programmes. Loaded stretching, joint prep and the unglamorous work that keeps you lifting.",
    points: ["Movement screen on day one", "Loaded range, not passive holds", "A physiotherapist on the floor"],
    image: PILLAR_PHOTOS.mobility,
    alt: "A coach guiding a member through a loaded hip mobility drill",
  },
  {
    index: "04",
    title: "Recovery",
    lead: "Sauna at 92°, plunge at 11°, and a coach who will happily tell you to go home today.",
    points: ["Sauna and cold plunge on site", "Deload weeks written in", "Sleep and load reviewed monthly"],
    image: PILLAR_PHOTOS.recovery,
    alt: "The recovery suite with sauna and cold plunge",
  },
];

/**
 * Pinned horizontal progression on desktop; a plain vertical stack under
 * 1024px, where pinning fights with mobile scroll physics. Both variants are
 * declared inside `gsap.matchMedia()` so switching breakpoints reverts one
 * and builds the other cleanly.
 */
export function Pillars() {
  const root = useReveal<HTMLElement>({ start: "top 85%" });
  const track = React.useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = root.current;
      const el = track.current;
      if (!section || !el) return;

      const mm = gsap.matchMedia();

      mm.add(`${MQ.isDesktop} and ${MQ.motionOk}`, () => {
        const distance = () => Math.max(0, el.scrollWidth - window.innerWidth);

        const tl = gsap.timeline({
          defaults: { duration: 1, ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${distance() + window.innerHeight * 0.5}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        tl.to(el, { x: () => -distance() }, 0).fromTo(
          ".js-pillar-progress",
          { scaleX: 0 },
          { scaleX: 1 },
          0,
        );
      });

      mm.add(`${MQ.isMobile} and ${MQ.motionOk}`, () => {
        batchReveal(gsap.utils.toArray<HTMLElement>(".js-pillar", section), {
          distance: 34,
          stagger: 0.1,
          start: "top 86%",
        });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      aria-labelledby="pillars-title"
      className="relative border-y border-border bg-bg-subtle py-20 lg:h-screen lg:overflow-hidden lg:py-0 motion-reduce:lg:h-auto motion-reduce:lg:overflow-visible motion-reduce:lg:py-24"
    >
      <div className="flex h-full flex-col justify-center">
        <div className="container-edge">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Eyebrow className="js-reveal">
                <span className="inline-block size-1.5 rounded-full bg-brand" aria-hidden />
                Four pillars
              </Eyebrow>
              <h2
                id="pillars-title"
                className="js-reveal mt-4 text-display-md leading-[0.95] font-extrabold tracking-[-0.04em] text-ink"
              >
                One programme,
                <br />
                four moving parts.
              </h2>
            </div>
            <p className="js-reveal max-w-sm text-sm leading-relaxed text-ink-muted lg:text-right">
              Every membership touches all four. The mix changes with your week, your sleep and
              what your last testing block actually said.
            </p>
          </div>
        </div>

        <div className="mt-10 lg:mt-12">
          <div
            ref={track}
            className="flex flex-col gap-6 px-[clamp(1.25rem,4vw,4.5rem)] lg:w-max lg:flex-row lg:gap-7 lg:pr-[12vw] motion-reduce:lg:w-full motion-reduce:lg:flex-wrap motion-reduce:lg:pr-[clamp(1.25rem,4vw,4.5rem)]"
          >
            {PILLARS.map((p) => (
              <article
                key={p.index}
                className="js-pillar group flex shrink-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-sm)] lg:h-[min(58vh,520px)] lg:w-[clamp(330px,29vw,470px)]"
              >
                <div className="relative h-44 w-full shrink-0 overflow-hidden bg-bg-subtle sm:h-56 lg:h-[40%]">
                  <Image
                    src={p.image}
                    alt={p.alt}
                    fill
                    sizes="(max-width: 1024px) 92vw, 30vw"
                    className="object-cover transition-transform duration-[900ms] ease-[var(--ease-out-expo)] group-hover:scale-105"
                  />
                  <span className="absolute top-4 left-4 rounded-full bg-bg/85 px-3 py-1 font-display text-xs font-bold tracking-widest text-brand backdrop-blur-sm">
                    {p.index}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-3 p-6">
                  <h3 className="font-display text-2xl leading-none font-extrabold tracking-[-0.03em] text-ink">
                    {p.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-ink-muted">{p.lead}</p>
                  <ul className="mt-auto flex flex-col gap-2 pt-2">
                    {p.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-[13px] text-ink-muted">
                        <Check className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="container-edge mt-10 hidden lg:block">
          <div className="h-px w-full bg-border">
            <div
              aria-hidden
              className="js-pillar-progress h-px w-full origin-left scale-x-0 bg-brand"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
