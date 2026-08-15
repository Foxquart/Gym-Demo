import type { Metadata } from "next";
import Image from "next/image";
import { Flame } from "lucide-react";

/**
 * The source for `public/og-image.png`.
 *
 * Rendered at exactly 1200x630 and screenshotted, rather than generated with
 * ImageResponse, so the card uses the real display font and the same tokens as
 * the site instead of a re-declared approximation.
 *
 * Regenerate after a brand change:
 *   npm run build && npm start
 *   open /og-image, capture the 1200x630 viewport to public/og-image.png
 */

export const metadata: Metadata = {
  title: "OG image source",
  robots: { index: false, follow: false },
};

export default function OgImagePage() {
  return (
    <div
      // Dark ground regardless of the viewer's theme: the card has to look the
      // same in every social client.
      className="dark grain relative flex overflow-hidden bg-bg"
      style={{ width: 1200, height: 630 }}
    >
      {/* Ember glow, anchored bottom-left behind the type */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-[45%] -left-[10%] size-[900px] rounded-full opacity-70 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--brand) 55%, transparent) 0%, transparent 68%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[30%] right-[6%] size-[620px] rounded-full opacity-50 blur-[130px]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--amber) 45%, transparent) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-[2] flex w-full flex-col justify-between px-16 py-14">
        {/* Wordmark */}
        <div className="flex items-center gap-3.5">
          <span className="grid size-12 place-items-center rounded-[15px] bg-brand text-brand-ink">
            <Flame className="size-6" strokeWidth={2.25} aria-hidden />
          </span>
          <span className="font-display text-[26px] leading-none font-extrabold tracking-[-0.045em] text-ink uppercase">
            Ember<span className="text-brand">.</span>
          </span>
          <span className="ml-3 border-l border-border-strong pl-3 font-mono text-[13px] tracking-[0.28em] text-ink-faint uppercase">
            Athletic Club
          </span>
        </div>

        <div className="flex items-end justify-between gap-10">
          <div className="max-w-[680px]">
            {/* Kept to three short lines: the card is often rendered under
                400px wide, where anything smaller stops being legible. */}
            <h1 className="font-display text-[82px] leading-[0.92] font-extrabold tracking-[-0.045em] text-ink">
              Make the best
              <br />
              version of you,
              <br />
              with <span className="text-brand">us</span>.
            </h1>

            <p className="mt-7 max-w-[560px] text-[21px] leading-snug text-ink-muted">
              Coaching-led strength &amp; conditioning. Small groups, four full-time coaches,
              memberships from ₹1,990.
            </p>
          </div>

          <Image
            src="/arm-lift.png"
            alt=""
            width={560}
            height={483}
            priority
            className="mb-2 h-[250px] w-auto shrink-0 drop-shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
          />
        </div>

        {/* Mantra strip + location */}
        <div className="flex items-center justify-between border-t border-border-strong pt-6">
          <div className="flex items-center gap-5 font-mono text-[15px] tracking-[0.3em] text-ink-faint uppercase">
            <span>Eat</span>
            <span className="text-border-strong">·</span>
            <span>Sleep</span>
            <span className="text-border-strong">·</span>
            <span className="text-brand">Lift</span>
            <span className="text-border-strong">·</span>
            <span>Repeat</span>
          </div>
          <span className="font-mono text-[15px] tracking-[0.28em] text-ink-faint uppercase">
            Bandra West · Indiranagar
          </span>
        </div>
      </div>
    </div>
  );
}
