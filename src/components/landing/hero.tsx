"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowDown, Star } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { gsap, useGSAP, SplitText, MQ } from "@/lib/gsap";
import { introDone } from "@/lib/intro-gate";
import { useLenis } from "@/hooks/use-lenis";
import { HERO_PHOTO } from "./media";

export type HeroStats = {
  coaches: number;
  classesPerWeek: number;
  rating: number;
};

export function Hero({ stats }: { stats: HeroStats }) {
  const root = React.useRef<HTMLElement>(null);
  const title = React.useRef<HTMLHeadingElement>(null);
  const lenis = useLenis();

  useGSAP(
    () => {
      const heading = title.current;
      if (!heading) return;

      const mm = gsap.matchMedia();
      let split: SplitText | null = null;
      let cancelled = false;

      // Hide the pieces synchronously — the split runs after the font loads,
      // and a `from()` tween that late would flash the finished layout first.
      mm.add(MQ.motionOk, () => {
        gsap.set(".js-hero-fade", { opacity: 0, y: 26 });
        gsap.set(".js-hero-media", { opacity: 0, y: 34 });
      });

      mm.add(MQ.reduced, () => {
        gsap.set([heading, ".js-hero-fade", ".js-hero-media"], { opacity: 1, y: 0 });
      });

      /* ---- entrance: per-character rise out of masked lines ---- */
      const build = () => {
        if (cancelled) return;

        mm.add(MQ.motionOk, () => {
          split = SplitText.create(heading, { type: "lines,words,chars", mask: "lines" });

          // Each masked line is an overflow:clip box sized to the line height.
          // At leading 0.86 the descender of "g" in "forged" falls outside it
          // and gets sliced, so pad the mask and pull the same amount back off
          // the margin — room for the tail, identical layout.
          split.lines.forEach((line) => {
            const mask = line.parentElement;
            if (!mask) return;
            mask.style.paddingBottom = "0.18em";
            mask.style.marginBottom = "-0.18em";
          });

          const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
          tl.set(heading, { opacity: 1 })
            .from(split.chars, {
              yPercent: 118,
              opacity: 0,
              duration: 1.15,
              stagger: { each: 0.016 },
            })
            .to(
              ".js-hero-fade",
              { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: "power3.out" },
              "-=0.8",
            )
            .to(".js-hero-media", { opacity: 1, y: 0, duration: 1.2 }, "-=1.05");

          return () => {
            split?.revert();
            split = null;
          };
        });
      };

      // Splitting before the display font lands would measure the fallback
      // and produce the wrong line breaks. Race a timeout so a stalled font
      // request can never leave the headline invisible.
      const fontsReady = document.fonts?.ready ?? Promise.resolve();
      // Two gates, not one: the font must have landed (so SplitText measures
      // real glyphs) AND the intro overlay must be lifting, or the headline
      // would burn its stagger behind a full-screen cover. `introDone` has its
      // own failsafe, so a missing overlay cannot strand the hero.
      Promise.all([
        Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1200))]),
        introDone,
      ]).then(build, build);

      /* ---- scroll: layered parallax, transforms only ---- */
      mm.add(MQ.motionOk, () => {
        const scrub = {
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: 0.4,
        } as const;

        gsap.to(".js-hero-glow", { yPercent: 26, scale: 1.15, ease: "none", scrollTrigger: scrub });
        gsap.to(".js-hero-copy", { yPercent: -14, opacity: 0.15, ease: "none", scrollTrigger: scrub });
        gsap.to(".js-hero-photo", { yPercent: 12, ease: "none", scrollTrigger: scrub });
      });

      return () => {
        cancelled = true;
        mm.revert();
      };
    },
    { scope: root },
  );

  const toNext = () => {
    const target = document.getElementById("manifesto");
    if (!target) return;
    if (lenis) lenis.scrollTo(target, { offset: -40 });
    else target.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={root}
      aria-labelledby="hero-title"
      className="grain relative isolate flex min-h-[100svh] flex-col justify-center overflow-hidden pt-24 pb-16 md:pt-28 lg:pb-24"
    >
      {/* ambient ember light */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="js-hero-glow absolute -top-[25%] -left-[15%] h-[70vw] w-[70vw] max-h-[880px] max-w-[880px] rounded-full bg-brand/30 blur-[110px]" />
        <div className="js-hero-glow absolute top-[35%] -right-[20%] h-[60vw] w-[60vw] max-h-[760px] max-w-[760px] rounded-full bg-amber/25 blur-[120px]" />
        <div className="js-hero-glow absolute bottom-[-20%] left-[25%] h-[45vw] w-[45vw] max-h-[560px] max-w-[560px] rounded-full bg-clay/20 blur-[130px]" />
      </div>

      <div className="container-edge grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="js-hero-copy lg:col-span-7 xl:col-span-7">
          <p className="js-hero-fade flex items-center gap-2.5 text-[11px] font-semibold tracking-[0.22em] text-brand uppercase">
            <span className="inline-block size-1.5 rounded-full bg-brand" aria-hidden />
            Bandra West · Indiranagar · Est. 2016
          </p>

          <h1
            id="hero-title"
            ref={title}
            className="js-reveal mt-5 text-display-lg leading-[0.9] font-extrabold tracking-[-0.04em] text-ink"
          >
            Make the best
            <br />
            version of you,
            <br />
            {/* Solid brand, not `.text-gradient-ember`: that utility needs
                background-clip:text, and SplitText relocates the letters into
                its own wrappers, leaving this span with no text to clip to.
                The word rendered invisible and only the full stop survived. */}
            with <span className="text-brand">us</span>.
          </h1>

          <p className="js-hero-fade mt-7 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
            No mirrors-and-mood-lighting nonsense. {stats.coaches} coaches, {stats.classesPerWeek}{" "}
            small-group hours a week, and a plan for your Tuesday that makes sense on the Tuesday
            after that.
          </p>

          <div className="js-hero-fade mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/pricing" size="lg" className="w-full sm:w-auto">
              Start with a free week
            </ButtonLink>
            <ButtonLink href="/classes" size="lg" variant="outline" className="w-full sm:w-auto">
              See the timetable
            </ButtonLink>
          </div>

          <dl className="js-hero-fade mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-border pt-6 text-sm">
            <div>
              <dt className="text-ink-faint">Coach rating</dt>
              <dd className="mt-1 flex items-center gap-1.5 font-display text-lg text-ink">
                <Star className="size-4 fill-amber text-amber" aria-hidden />
                {stats.rating.toFixed(1)} / 5
              </dd>
            </div>
            <div>
              <dt className="text-ink-faint">Class cap</dt>
              <dd className="mt-1 font-display text-lg text-ink">8–24 people</dd>
            </div>
            <div>
              <dt className="text-ink-faint">Doors open</dt>
              <dd className="mt-1 font-display text-lg text-ink">5:00am, every day</dd>
            </div>
          </dl>
        </div>

        <div className="js-hero-media relative lg:col-span-5">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[var(--radius-card)] border border-border bg-bg-subtle shadow-[var(--shadow-lg)] sm:aspect-[3/2] lg:aspect-[4/5]">
            <Image
              src={HERO_PHOTO}
              alt="A member setting up under a loaded barbell while a coach watches the bar path"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="js-hero-photo scale-[1.12] object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-[var(--overlay)] via-transparent to-transparent"
            />
          </div>

          <div className="absolute -bottom-5 left-4 flex max-w-[86%] items-center gap-3 rounded-[var(--radius-pill)] border border-border bg-surface-raised px-4 py-3 shadow-[var(--shadow-md)] sm:left-6">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
              <Star className="size-4 fill-current" aria-hidden />
            </span>
            <p className="text-[13px] leading-snug text-ink-muted">
              <span className="font-semibold text-ink">First week is free.</span> Movement screen
              included, no card needed.
            </p>
          </div>
        </div>
      </div>

      <div className="container-edge mt-16 lg:mt-14">
        <button
          type="button"
          onClick={toNext}
          className="js-hero-fade group inline-flex items-center gap-3 text-[11px] font-semibold tracking-[0.22em] text-ink-faint uppercase transition-colors duration-300 hover:text-brand"
        >
          <span
            aria-hidden
            className="grid size-9 place-items-center rounded-full border border-border-strong transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-y-1"
          >
            <ArrowDown className="size-4" />
          </span>
          Scroll to read the short version
        </button>
      </div>
    </section>
  );
}
