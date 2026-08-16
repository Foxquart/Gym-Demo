"use client";

import * as React from "react";
import Image from "next/image";
import { useLenis } from "lenis/react";

import { gsap, useGSAP } from "@/lib/gsap";
import { markIntroDone } from "@/lib/intro-gate";

/*
 * "The Loop" — the intro for a hard load of "/".
 *
 * The gym mantra played as rhythm rather than a slogan, staged as an editorial
 * slab: the live word runs full-bleed inside a band ruled top and bottom, with
 * the whole mantra listed underneath so the phrase reads even mid-cycle and the
 * active term lights up as it comes round. A frame index counts the beats and
 * the lower rule doubles as the progress bar for the entire sequence.
 *
 * The beats accelerate — EAT is unhurried, REPEAT snaps — so the loop audibly
 * tightens without sound. On the last word it closes on itself: REPEAT recoils
 * rather than exiting, then the screen shuffles apart in alternating bands.
 *
 * Deliberately NOT the Foxquart open: no fragment montage inside masked
 * letterforms, no zoom through a hole in the logo. Kinetic typography on a
 * metronome instead.
 *
 * The overlay is server-rendered in its hold state so the hero never flashes
 * before the intro starts, which makes determinism a hard requirement: no
 * randomness, no dates, no reading storage during render. Every word begins
 * parked below the mask via inline transform, so the SSR frame is a clean
 * empty stage rather than four words stacked on each other.
 */

/** Swap "LIFT" for "GYM" here if you prefer the literal mantra. */
const WORDS = ["EAT", "LIFT", "SLEEP", "REPEAT"] as const;

/* Each word gets less room than the one before it: the loop tightening. */
const BEATS = [0.3, 0.24, 0.2, 0.34];

const BANDS = 7;

/** How long a word takes to travel into the band. */
const RISE = 0.46;

/**
 * How far into the outgoing word's exit the next one starts arriving. The two
 * used to move on the same frame, which read as a swap; letting the old word
 * commit to leaving first makes it a hand-off.
 */
const HANDOFF = 0.2;

export function IntroLoader() {
  const root = React.useRef<HTMLDivElement>(null);
  const index = React.useRef<HTMLSpanElement>(null);
  const lenis = useLenis();

  useGSAP(
    () => {
      const el = root.current;
      if (!el) return;

      const finish = () => {
        markIntroDone();
        el.style.display = "none";
      };

      // Respect the OS setting: no theatre, just get out of the way.
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        finish();
        return;
      }

      // Hold the page still. Lenis owns scrolling on marketing routes; the
      // body lock covers the frames before Lenis has mounted.
      lenis?.stop();
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const release = () => {
        document.body.style.overflow = previousOverflow;
        lenis?.start();
        lenis?.scrollTo(0, { immediate: true });
      };

      const words = gsap.utils.toArray<HTMLElement>(".js-word");
      const items = gsap.utils.toArray<HTMLElement>(".js-item");

      // Normalise the parked state GSAP will animate from. `y: 0` is load
      // bearing: the SSR frame parks each word with an inline
      // translateY(106%), and GSAP can only read that back as a pixel matrix —
      // so without clearing y it would add its own 106% on top and the words
      // would start at 212%, far below the band, and never arrive.
      gsap.set(words, { y: 0, yPercent: 106 });

      const total = BEATS.reduce((a, b) => a + b, 0);
      let elapsed = 0;

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => {
          release();
          finish();
        },
      });

      // The frame draws itself first: rules extend, meta fades up.
      tl.from(".js-rule", { scaleX: 0, duration: 0.55, ease: "expo.out", stagger: 0.07 })
        .from(".js-meta", { opacity: 0, y: 8, duration: 0.4, stagger: 0.05 }, "-=0.4");

      words.forEach((word, i) => {
        const chars = word.querySelectorAll<HTMLElement>(".js-char");
        const previous = words[i - 1];
        const isLast = i === WORDS.length - 1;
        const label = `beat-${i}`;

        tl.addLabel(label, i === 0 ? "-=0.15" : undefined);

        // The outgoing word leaves first; the incoming one follows it up.
        if (previous) {
          tl.to(previous, { yPercent: -106, duration: RISE, ease: "expo.inOut" }, label);
        }

        const enterOffset = previous ? HANDOFF : 0;
        const enterAt = `${label}+=${enterOffset}`;

        // Incoming word rises into the mask, letters fanning in slightly so it
        // reads as type rather than a moving block.
        tl.to(word, { yPercent: 0, duration: RISE, ease: "expo.out" }, enterAt).from(
          chars,
          { yPercent: 40, opacity: 0, duration: 0.42, stagger: 0.022, ease: "expo.out" },
          enterAt,
        );

        // The flex mark curls in with LIFT.
        if (word.querySelector(".js-flex")) {
          tl.from(
            word.querySelector(".js-flex"),
            { scale: 0.4, rotate: -18, opacity: 0, duration: 0.55, ease: "back.out(2.2)" },
            `${label}+=${enterOffset + 0.12}`,
          );
        }

        // The mantra list tracks the live word. Cued a beat into the rise so
        // the lit term and the word in the band are never out of step.
        const cue = `${label}+=${enterOffset + RISE * 0.45}`;
        tl.to(items[i], { color: "var(--brand)", opacity: 1, duration: 0.3 }, cue);
        if (previous) {
          tl.to(items[i - 1], { color: "var(--ink-faint)", opacity: 0.5, duration: 0.3 }, cue);
        }

        // Frame index, and the lower rule as the progress bar for the whole run.
        tl.call(
          () => {
            if (index.current) index.current.textContent = String(i + 1).padStart(2, "0");
          },
          undefined,
          cue,
        );

        elapsed += BEATS[i];
        tl.to(
          ".js-progress",
          { scaleX: elapsed / total, duration: enterOffset + RISE + BEATS[i], ease: "none" },
          label,
        );

        // Hold covers the rise AND the beat. Counting only the beat let the
        // next word be cued while the current one was still arriving, which
        // is what put the band and the mantra list a step out of sync.
        tl.to({}, { duration: enterOffset + RISE + BEATS[i] }, label);

        if (isLast) {
          // The loop closes on itself: a recoil rather than an exit.
          tl.to(word, { scale: 0.95, duration: 0.18, ease: "power2.in" })
            .to(word, { scale: 1.1, opacity: 0, duration: 0.42, ease: "power3.in" })
            .to([".js-meta", ".js-rule"], { opacity: 0, duration: 0.32, ease: "none" }, "<");
        }
      });

      // Hand over: bands shuffle apart, alternating direction from the centre.
      tl.to(
        ".js-intro-band",
        {
          xPercent: (i: number) => (i % 2 === 0 ? -101 : 101),
          duration: 0.85,
          ease: "expo.inOut",
          stagger: { each: 0.055, from: "center" },
        },
        // Overlaps the recoil deliberately: leaving a gap here read as a beat
        // of empty screen between the last word and the reveal.
        "-=0.62",
      );

      // Impatient client, second viewing: let them out.
      const skip = () => tl.progress(0.9);
      const onKey = (event: KeyboardEvent) => {
        if (event.key === "Escape" || event.key === "Enter" || event.key === " ") skip();
      };
      el.addEventListener("click", skip);
      window.addEventListener("keydown", onKey);

      return () => {
        el.removeEventListener("click", skip);
        window.removeEventListener("keydown", onKey);
        release();
        markIntroDone();
      };
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      aria-hidden="true"
      role="presentation"
      className="grain fixed inset-0 z-[100] overflow-hidden"
    >
      {/* The doors. Each band is its own layer so the exit is a pure transform. */}
      <div className="absolute inset-0 flex flex-col">
        {Array.from({ length: BANDS }, (_, i) => (
          <div key={i} className="js-intro-band relative flex-1 bg-bg will-change-transform" />
        ))}
      </div>

      {/* Ambient forge glow, low and warm — the one thread kept from the brand. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, color-mix(in srgb, var(--brand) 20%, transparent) 0%, transparent 72%)",
        }}
      />

      <div className="absolute inset-0 flex flex-col justify-center">
        <div className="container-edge w-full">
          {/* Top meta row */}
          <div className="flex items-end justify-between gap-4 pb-3">
            <span className="js-meta font-mono text-[10px] tracking-[0.3em] text-ink-faint uppercase sm:text-[11px]">
              Ember Athletic Club
            </span>
            <span className="js-meta font-mono text-[10px] tracking-[0.3em] text-ink-faint uppercase sm:text-[11px]">
              Bandra West · Indiranagar
            </span>
          </div>

          <div className="js-rule h-px w-full origin-left bg-border-strong" />

          {/* The band the words run through, full-bleed. */}
          <div className="relative h-[1.02em] overflow-hidden py-0 text-[clamp(3.4rem,15.5vw,13rem)]">
            {WORDS.map((word, i) => (
              <span
                key={word}
                className="js-word absolute inset-0 flex items-center justify-center will-change-transform"
                // Parked below the mask for the server-rendered frame.
                style={{ transform: "translateY(106%)" }}
              >
                {/* The payoff word is solid brand, not `.text-gradient-ember`:
                    that utility relies on background-clip:text, and the letters
                    here are inline-block children, so the parent has no text
                    nodes of its own for the gradient to clip to — it renders
                    completely invisible. */}
                <span
                  className={`font-display leading-none font-bold tracking-[-0.05em] ${
                    i === WORDS.length - 1 ? "text-brand" : "text-ink"
                  }`}
                >
                  {word.split("").map((c, j) => (
                    <span key={j} className="js-char inline-block">
                      {c}
                    </span>
                  ))}
                  {word === "LIFT" && (
                    // Supplied artwork, background cut out and trimmed to
                    // public/arm-lift.png. Height is in `em` so it tracks the
                    // display type at every breakpoint.
                    <Image
                      src="/arm-lift.png"
                      alt=""
                      width={560}
                      height={483}
                      priority
                      aria-hidden
                      className="js-flex ml-[0.18em] inline-block h-[0.7em] w-auto align-middle"
                    />
                  )}
                </span>
              </span>
            ))}
          </div>

          {/* Lower rule doubles as the progress bar for the whole sequence. */}
          <div className="js-rule relative h-px w-full origin-left bg-border-strong">
            <span className="js-progress absolute inset-0 origin-left scale-x-0 bg-brand" />
          </div>

          {/* Bottom row: the mantra in full, plus the frame index. */}
          <div className="flex items-center justify-between gap-4 pt-3">
            <ul className="js-meta flex items-center gap-3 sm:gap-6">
              {WORDS.map((word) => (
                <li
                  key={word}
                  className="js-item font-mono text-[10px] tracking-[0.28em] text-ink-faint uppercase sm:text-[11px]"
                  style={{ opacity: 0.5 }}
                >
                  {word}
                </li>
              ))}
            </ul>

            <span className="js-meta font-mono text-[10px] tracking-[0.28em] text-ink-faint tabular-nums sm:text-[11px]">
              <span ref={index} suppressHydrationWarning>
                01
              </span>
              {" / "}
              {String(WORDS.length).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
