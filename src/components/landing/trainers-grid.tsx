"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";

import { Eyebrow } from "@/components/ui";
import { useReveal } from "@/hooks/use-reveal";

export type TrainerCard = {
  id: string;
  slug: string;
  name: string;
  specialty: string;
  bio: string;
  imageUrl: string;
  experienceYears: number;
  rating: number;
};

export function TrainersGrid({
  trainers,
  heading = "The four people who watch every rep.",
}: {
  trainers: TrainerCard[];
  heading?: string;
}) {
  const root = useReveal<HTMLElement>({ start: "top 86%", stagger: 0.09, distance: 34 });

  return (
    <section
      ref={root}
      aria-labelledby="trainers-title"
      className="border-y border-border bg-bg-subtle py-20 md:py-28 lg:py-32"
    >
      <div className="container-edge">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Eyebrow className="js-reveal">
              <span className="inline-block size-1.5 rounded-full bg-brand" aria-hidden />
              Coaching staff
            </Eyebrow>
            <h2
              id="trainers-title"
              className="js-reveal mt-4 text-display-md leading-[0.95] font-extrabold tracking-[-0.04em] text-ink"
            >
              {heading}
            </h2>
          </div>
          <Link
            href="/trainers"
            className="js-reveal group inline-flex items-center gap-2 text-sm font-medium text-brand"
          >
            Read their full stories
            <ArrowUpRight className="size-4 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {trainers.map((t) => (
            <li key={t.id} className="js-reveal">
              <Link
                href={`/trainers#${t.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-sm)] transition-colors duration-500 hover:border-brand"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-bg-subtle">
                  <Image
                    src={t.imageUrl}
                    alt={`${t.name}, ${t.specialty.toLowerCase()} coach at Ember Athletic Club`}
                    fill
                    sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 23vw"
                    className="object-cover transition-transform duration-[900ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.06]"
                  />
                  {/* Bio slides in on hover or keyboard focus — ink/bg tokens
                      so the scrim inverts properly instead of staying black. */}
                  <div className="absolute inset-0 flex items-end bg-ink/88 p-5 opacity-0 transition-opacity duration-500 ease-[var(--ease-out-expo)] group-hover:opacity-100 group-focus-visible:opacity-100">
                    <p className="translate-y-3 text-[13px] leading-relaxed text-bg transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-y-0 group-focus-visible:translate-y-0">
                      {t.bio}
                    </p>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-1 p-5">
                  <h3 className="font-display text-lg leading-tight tracking-tight text-ink">
                    {t.name}
                  </h3>
                  <p className="text-sm text-brand">{t.specialty}</p>
                  <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
                    <span className="inline-flex items-center gap-1">
                      <Star className="size-3.5 fill-amber text-amber" aria-hidden />
                      {t.rating.toFixed(1)}
                    </span>
                    <span aria-hidden>·</span>
                    <span>{t.experienceYears} years coaching</span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
