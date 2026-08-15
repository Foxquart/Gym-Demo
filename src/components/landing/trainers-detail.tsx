"use client";

import * as React from "react";
import Image from "next/image";
import { Star } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { gsap, useGSAP, MQ } from "@/lib/gsap";
import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";
import type { TrainerCard } from "./trainers-grid";

export function TrainersDetail({ trainers }: { trainers: TrainerCard[] }) {
  const root = useReveal<HTMLDivElement>({ start: "top 88%", distance: 34 });

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${MQ.isDesktop} and ${MQ.motionOk}`, () => {
        gsap.utils.toArray<HTMLElement>(".js-trainer-photo", root.current).forEach((el) => {
          gsap.fromTo(
            el,
            { yPercent: -6 },
            {
              yPercent: 6,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.5 },
            },
          );
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="container-edge py-16 md:py-24">
      <div className="flex flex-col gap-16 md:gap-24">
        {trainers.map((t, i) => (
          <article
            key={t.id}
            id={t.slug}
            className="js-reveal grid scroll-mt-28 gap-8 lg:grid-cols-12 lg:items-center lg:gap-14"
          >
            <div className={cn("lg:col-span-5", i % 2 === 1 && "lg:order-2")}>
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-card)] border border-border bg-bg-subtle shadow-[var(--shadow-md)]">
                <Image
                  src={t.imageUrl}
                  alt={`${t.name}, ${t.specialty.toLowerCase()} coach at Ember Athletic Club`}
                  fill
                  sizes="(max-width: 1024px) 92vw, 40vw"
                  className="js-trainer-photo scale-[1.14] object-cover"
                />
              </div>
            </div>

            <div className={cn("lg:col-span-7", i % 2 === 1 && "lg:order-1")}>
              <p className="text-[11px] font-semibold tracking-[0.22em] text-brand uppercase">
                {t.specialty}
              </p>
              <h2 className="mt-4 text-display-sm leading-[1.02] font-extrabold tracking-[-0.04em] text-ink">
                {t.name}
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">
                {t.bio}
              </p>

              <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-5 border-t border-border pt-7">
                <div>
                  <dt className="text-xs tracking-wide text-ink-faint uppercase">Coaching since</dt>
                  <dd className="mt-1.5 font-display text-xl text-ink tabular-nums">
                    {new Date().getFullYear() - t.experienceYears}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs tracking-wide text-ink-faint uppercase">Experience</dt>
                  <dd className="mt-1.5 font-display text-xl text-ink tabular-nums">
                    {t.experienceYears} years
                  </dd>
                </div>
                <div>
                  <dt className="text-xs tracking-wide text-ink-faint uppercase">Member rating</dt>
                  <dd className="mt-1.5 flex items-center gap-1.5 font-display text-xl text-ink tabular-nums">
                    <Star className="size-4 fill-amber text-amber" aria-hidden />
                    {t.rating.toFixed(1)}
                  </dd>
                </div>
              </dl>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/classes">Find {t.name.split(" ")[0]}&rsquo;s classes</ButtonLink>
                <ButtonLink href="/contact" variant="outline">
                  Ask for a session
                </ButtonLink>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
