"use client";

import { Check, MessageCircle, Phone } from "lucide-react";

import { Eyebrow } from "@/components/ui";
import { useReveal } from "@/hooks/use-reveal";
import { useSplitReveal } from "@/hooks/use-split-reveal";
import { LeadForm } from "./lead-form";

const PROMISES = [
  "A free week — full floor access and two classes.",
  "A movement screen with a coach, not a sales desk.",
  "A written plan you keep whether you join or not.",
];

export function ClosingCta() {
  const root = useReveal<HTMLElement>({ start: "top 86%" });
  const heading = useSplitReveal<HTMLHeadingElement>({ start: "top 85%" });

  return (
    <section
      ref={root}
      aria-labelledby="cta-title"
      className="grain relative isolate overflow-hidden py-20 md:py-28 lg:py-36"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -bottom-[30%] left-1/2 h-[80vw] w-[80vw] max-h-[900px] max-w-[900px] -translate-x-1/2 rounded-full bg-brand/20 blur-[130px]" />
      </div>

      <div className="container-edge grid gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-6">
          <Eyebrow className="js-reveal">
            <span className="inline-block size-1.5 rounded-full bg-brand" aria-hidden />
            Come and see
          </Eyebrow>

          <h2
            id="cta-title"
            ref={heading}
            data-split
            className="js-reveal mt-5 text-display-lg leading-[0.9] font-extrabold tracking-[-0.045em] text-ink"
          >
            Bring your Tuesday. We&rsquo;ll bring the plan.
          </h2>

          <p className="js-reveal mt-7 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
            Tell us what you want to be able to do and roughly when you can train. A coach reads
            every one of these — you will get a person, a time and a straight answer about whether
            we are the right room for you.
          </p>

          <ul className="js-reveal mt-9 flex flex-col gap-3">
            {PROMISES.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-ink-muted">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                  <Check className="size-3" aria-hidden />
                </span>
                {p}
              </li>
            ))}
          </ul>

          <div className="js-reveal mt-9 flex flex-wrap gap-x-8 gap-y-4 border-t border-border pt-7 text-sm">
            <a
              href="tel:+912248901120"
              className="inline-flex items-center gap-2.5 text-ink transition-colors duration-300 hover:text-brand"
            >
              <Phone className="size-4 text-brand" aria-hidden />
              +91 22 4890 1120
            </a>
            <a
              href="https://wa.me/912248901120"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2.5 text-ink transition-colors duration-300 hover:text-brand"
            >
              <MessageCircle className="size-4 text-brand" aria-hidden />
              WhatsApp the front desk
            </a>
          </div>
        </div>

        <div className="js-reveal lg:col-span-6">
          <div className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-lg)] sm:p-8">
            <h3 className="font-display text-xl leading-none font-extrabold tracking-[-0.03em] text-ink">
              Book a free week
            </h3>
            <p className="mt-2 mb-7 text-sm text-ink-muted">
              Four fields. No card, no contract, no &ldquo;transformation consultation&rdquo;.
            </p>
            <LeadForm />
          </div>
        </div>
      </div>
    </section>
  );
}
