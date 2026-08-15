"use client";

import { Check, ChevronDown } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui";
import { useReveal } from "@/hooks/use-reveal";
import { formatINR, intervalLabel } from "@/lib/utils";
import type { PlanCard } from "./pricing-preview";

const FAQS = [
  {
    q: "Is there a joining fee?",
    a: "No. No joining fee, no locker deposit, no annual maintenance charge. The number on the plan is the number that leaves your account, taxes included.",
  },
  {
    q: "What if I have never touched a barbell?",
    a: "Then you start where most members start. Every membership opens with a movement screen and a Barbell Foundations block — squat, hinge, press, coached slowly with an empty bar until it looks right.",
  },
  {
    q: "Can I cancel?",
    a: "Monthly plans cancel from the member app in two taps and run to the end of the cycle you have paid for. Nobody will call you to talk you out of it.",
  },
  {
    q: "Can I pause my membership?",
    a: "Up to thirty days a year, free, from the app. Travel, injury, a brutal quarter at work — pause it and pick up where the programme left off.",
  },
  {
    q: "Do you do corporate memberships?",
    a: "From ten people upward, with a shared invoice and a dedicated 6:30am slot if you want one. Write to the desk from the contact page and we will put a number together in a day.",
  },
  {
    q: "What is actually included in the free week?",
    a: "Full floor access for seven days, two small-group classes, a movement screen with a coach and a written starting plan. No card, and the plan is yours whether you join or not.",
  },
];

export function PricingExtras({ annualPlans }: { annualPlans: PlanCard[] }) {
  const root = useReveal<HTMLDivElement>({ start: "top 88%", stagger: 0.07 });

  return (
    <div ref={root}>
      {annualPlans.length > 0 && (
        <section aria-labelledby="annual-title" className="container-edge py-16 md:py-24">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5">
              <Eyebrow className="js-reveal">
                <span className="inline-block size-1.5 rounded-full bg-brand" aria-hidden />
                Paying up front
              </Eyebrow>
              <h2
                id="annual-title"
                className="js-reveal mt-4 text-display-sm leading-[1.02] font-extrabold tracking-[-0.04em] text-ink"
              >
                Twelve months, two on the house.
              </h2>
              <p className="js-reveal mt-6 max-w-md text-sm leading-relaxed text-ink-muted">
                The annual plan is the same Forge membership, billed once. It locks your price for
                as long as you keep it — including through the increases everyone else sees in
                April.
              </p>
            </div>

            <div className="grid gap-6 lg:col-span-7">
              {annualPlans.map((plan) => (
                <article
                  key={plan.id}
                  className="js-reveal flex flex-col gap-6 rounded-[var(--radius-card)] border border-border-strong bg-surface p-6 shadow-[var(--shadow-md)] sm:p-8 lg:flex-row lg:items-start"
                >
                  <div className="flex-1">
                    <h3 className="font-display text-xl leading-none font-extrabold tracking-[-0.03em] text-ink">
                      {plan.name}
                    </h3>
                    <p className="mt-2 text-sm text-ink-muted">{plan.tagline}</p>
                    <ul className="mt-6 flex flex-col gap-2.5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-sm text-ink-muted">
                          <Check className="mt-0.5 size-4 shrink-0 text-sage" aria-hidden />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="shrink-0 lg:w-56 lg:text-right">
                    <p className="font-display text-[clamp(2rem,4.5vw,2.75rem)] leading-none font-extrabold tracking-[-0.045em] text-ink">
                      {formatINR(plan.priceInPaise)}
                    </p>
                    <p className="mt-2 text-sm text-ink-faint">
                      per {intervalLabel[plan.interval] ?? "year"}
                    </p>
                    <ButtonLink
                      href={`/checkout/${plan.slug}`}
                      size="lg"
                      className="mt-5 w-full lg:w-auto"
                    >
                      Join {plan.name}
                    </ButtonLink>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section
        aria-labelledby="faq-title"
        className="border-t border-border bg-bg-subtle py-16 md:py-24"
      >
        <div className="container-edge grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4">
            <Eyebrow className="js-reveal">
              <span className="inline-block size-1.5 rounded-full bg-brand" aria-hidden />
              Straight answers
            </Eyebrow>
            <h2
              id="faq-title"
              className="js-reveal mt-4 text-display-sm leading-[1.02] font-extrabold tracking-[-0.04em] text-ink"
            >
              The questions the desk actually gets.
            </h2>
          </div>

          <div className="lg:col-span-8">
            <ul className="flex flex-col">
              {FAQS.map((item) => (
                <li key={item.q} className="js-reveal border-b border-border first:border-t">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left font-display text-lg tracking-tight text-ink transition-colors duration-300 hover:text-brand [&::-webkit-details-marker]:hidden">
                      {item.q}
                      <ChevronDown
                        aria-hidden
                        className="size-5 shrink-0 text-ink-faint transition-transform duration-500 ease-[var(--ease-out-expo)] group-open:-rotate-180"
                      />
                    </summary>
                    <p className="max-w-2xl pb-6 text-sm leading-relaxed text-ink-muted">
                      {item.a}
                    </p>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
