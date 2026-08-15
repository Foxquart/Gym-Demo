"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";

import { Eyebrow } from "@/components/ui";
import { gsap, useGSAP } from "@/lib/gsap";
import { useReveal } from "@/hooks/use-reveal";
import { cn, initials } from "@/lib/utils";

export type TestimonialCard = {
  id: string;
  name: string;
  role: string;
  quote: string;
  rating: number;
  imageUrl: string | null;
};

const AUTOPLAY_SECONDS = 8;

export function Testimonials({ items }: { items: TestimonialCard[] }) {
  const root = useReveal<HTMLElement>({ start: "top 86%" });
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const count = items.length;

  const go = React.useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  /* Cross-fade between quotes. Runs on mount too, so slide 0 gets its
     entrance and every other slide is explicitly parked. */
  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>(".js-quote", root.current);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      cards.forEach((card, i) => {
        if (i === index) {
          gsap.fromTo(
            card,
            { autoAlpha: 0, y: reduced ? 0 : 28 },
            { autoAlpha: 1, y: 0, duration: reduced ? 0 : 0.75, ease: "power3.out" },
          );
        } else {
          gsap.to(card, { autoAlpha: 0, y: reduced ? 0 : -16, duration: reduced ? 0 : 0.35 });
        }
      });
    },
    { dependencies: [index], scope: root },
  );

  /* The progress bar IS the timer — when it finishes, the slide advances. */
  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced || paused || count < 2) {
        gsap.set(".js-quote-progress", { scaleX: 0 });
        return;
      }
      const tween = gsap.fromTo(
        ".js-quote-progress",
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: AUTOPLAY_SECONDS,
          ease: "none",
          onComplete: () => setIndex((i) => (i + 1) % count),
        },
      );
      return () => {
        tween.kill();
      };
    },
    { dependencies: [index, paused, count], scope: root },
  );

  if (!count) return null;

  const active = items[index];

  return (
    <section
      ref={root}
      aria-labelledby="testimonials-title"
      className="container-edge py-20 md:py-28 lg:py-32"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <Eyebrow className="js-reveal">
            <span className="inline-block size-1.5 rounded-full bg-brand" aria-hidden />
            In their words
          </Eyebrow>
          <h2
            id="testimonials-title"
            className="js-reveal mt-4 text-display-md leading-[0.95] font-extrabold tracking-[-0.04em] text-ink"
          >
            Members, unprompted.
          </h2>
        </div>

        <div className="js-reveal flex items-center gap-3">
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous testimonial"
            className="grid size-11 place-items-center rounded-full border border-border text-ink transition-colors duration-300 hover:border-brand hover:text-brand"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next testimonial"
            className="grid size-11 place-items-center rounded-full border border-border text-ink transition-colors duration-300 hover:border-brand hover:text-brand"
          >
            <ArrowRight className="size-4" aria-hidden />
          </button>
          <span className="ml-1 font-display text-sm tabular-nums text-ink-faint">
            {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </span>
        </div>
      </div>

      <div
        className="mt-12 grid gap-10 lg:grid-cols-12"
        role="group"
        aria-roledescription="carousel"
        aria-label="Member testimonials"
      >
        <div className="grid lg:col-span-8">
          {items.map((t, i) => (
            <blockquote
              key={t.id}
              aria-hidden={i !== index}
              className={cn(
                "js-quote col-start-1 row-start-1",
                i === 0 ? "" : "invisible opacity-0",
              )}
            >
              <p className="font-serif text-[clamp(1.5rem,3.6vw,2.7rem)] leading-[1.22] tracking-[-0.01em] text-ink italic">
                &ldquo;{t.quote}&rdquo;
              </p>

              <footer className="mt-8 flex flex-wrap items-center gap-4">
                <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-bg-subtle font-display text-sm text-ink-muted">
                  {t.imageUrl ? (
                    <Image
                      src={t.imageUrl}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    initials(t.name)
                  )}
                </span>
                <div>
                  <cite className="block font-display text-base not-italic text-ink">{t.name}</cite>
                  <span className="text-sm text-ink-muted">{t.role}</span>
                </div>
                <span className="flex items-center gap-0.5" aria-label={`${t.rating} out of 5`}>
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      aria-hidden
                      className={cn(
                        "size-4",
                        s < t.rating ? "fill-amber text-amber" : "text-border-strong",
                      )}
                    />
                  ))}
                </span>
              </footer>
            </blockquote>
          ))}
        </div>

        <div className="flex flex-col justify-end gap-6 lg:col-span-4">
          <div className="h-px w-full bg-border" aria-hidden>
            <div className="js-quote-progress h-px w-full origin-left scale-x-0 bg-brand" />
          </div>

          <ul className="flex flex-wrap gap-2">
            {items.map((t, i) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Show testimonial from ${t.name}`}
                  aria-current={i === index}
                  className={cn(
                    "h-11 rounded-full border px-4 text-[13px] font-medium transition-colors duration-300",
                    i === index
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-border text-ink-muted hover:border-brand-hover hover:text-brand",
                  )}
                >
                  {t.name.split(" ")[0]}
                </button>
              </li>
            ))}
          </ul>

          <p className="text-sm leading-relaxed text-ink-faint">
            Collected in person at the six-month review, not fished for on a feedback form. Names
            used with permission.
          </p>

          <p className="sr-only" aria-live="polite">
            Testimonial {index + 1} of {count}: {active.name}
          </p>
        </div>
      </div>
    </section>
  );
}
