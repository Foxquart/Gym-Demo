"use client";

import * as React from "react";

import { Eyebrow } from "@/components/ui";
import { gsap, useGSAP, MQ } from "@/lib/gsap";
import { useReveal } from "@/hooks/use-reveal";
import type { ClubStats } from "./queries";

const nf = new Intl.NumberFormat("en-IN");

export function StatsBand({ stats }: { stats: ClubStats }) {
  const root = useReveal<HTMLElement>({ start: "top 88%", stagger: 0.07 });

  const items = React.useMemo(
    () => [
      {
        value: stats.tonnageKg,
        suffix: " kg",
        label: "Moved by members in the last sixty days",
        note: "Every set logged in the member app",
      },
      {
        value: stats.sessionsLogged,
        suffix: "",
        label: "Coached sessions on the books",
        note: "Strength, conditioning, Olympic, mobility",
      },
      {
        value: stats.classesPerWeek,
        suffix: "",
        label: "Small-group hours each week",
        note: "Capped between eight and twenty-four",
      },
      {
        value: stats.coachingYears,
        suffix: " yrs",
        label: "Coaching experience on the floor",
        note: `Across ${stats.coaches} full-time coaches`,
      },
    ],
    [stats],
  );

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Counters render their final value on the server, so there is no
      // layout shift and no blank number if the tween never runs.
      mm.add(MQ.motionOk, () => {
        gsap.utils.toArray<HTMLElement>(".js-count", root.current).forEach((el) => {
          const target = Number(el.dataset.value ?? "0");
          const suffix = el.dataset.suffix ?? "";
          const proxy = { v: 0 };

          gsap.to(proxy, {
            v: target,
            duration: 2.1,
            ease: "power2.out",
            snap: { v: 1 },
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
            onUpdate: () => {
              el.textContent = `${nf.format(proxy.v)}${suffix}`;
            },
            onComplete: () => {
              el.textContent = `${nf.format(target)}${suffix}`;
            },
          });
        });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      aria-labelledby="stats-title"
      className="container-edge py-20 md:py-24 lg:py-28"
    >
      <div className="max-w-2xl">
        <Eyebrow className="js-reveal">
          <span className="inline-block size-1.5 rounded-full bg-brand" aria-hidden />
          Receipts
        </Eyebrow>
        <h2
          id="stats-title"
          className="js-reveal mt-4 text-display-sm leading-[1.02] font-extrabold tracking-[-0.04em] text-ink"
        >
          Numbers we actually keep.
        </h2>
      </div>

      <dl className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-[var(--radius-card)] border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="js-reveal flex flex-col gap-2 bg-bg p-6 lg:p-7">
            <dt className="order-2 text-sm leading-snug font-medium text-ink">
              {item.label}
              <span className="mt-2 block text-xs leading-relaxed font-normal text-ink-faint">
                {item.note}
              </span>
            </dt>
            <dd
              className="js-count order-1 font-display text-[clamp(2rem,5.5vw,3.25rem)] leading-none font-extrabold tracking-[-0.04em] tabular-nums text-gradient-ember"
              data-value={item.value}
              data-suffix={item.suffix}
            >
              {nf.format(item.value)}
              {item.suffix}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
