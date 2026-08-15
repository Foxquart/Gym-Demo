"use client";

import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";

import { ButtonLink } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui";
import { useReveal } from "@/hooks/use-reveal";
import { cn, formatINR, intervalLabel, intervalMonths } from "@/lib/utils";

export type PlanCard = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  priceInPaise: number;
  interval: string;
  features: string[];
  highlight: boolean;
};

export function PricingPreview({
  plans,
  heading = "Three ways in. No joining fee, ever.",
  showAllLink = true,
}: {
  plans: PlanCard[];
  heading?: string;
  showAllLink?: boolean;
}) {
  const root = useReveal<HTMLElement>({ start: "top 84%", stagger: 0.1, distance: 32 });

  return (
    <section
      ref={root}
      aria-labelledby="pricing-title"
      className="border-y border-border bg-bg-subtle py-20 md:py-28 lg:py-32"
    >
      <div className="container-edge">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Eyebrow className="js-reveal">
              <span className="inline-block size-1.5 rounded-full bg-brand" aria-hidden />
              Membership
            </Eyebrow>
            <h2
              id="pricing-title"
              className="js-reveal mt-4 text-display-md leading-[0.95] font-extrabold tracking-[-0.04em] text-ink"
            >
              {heading}
            </h2>
          </div>
          <p className="js-reveal max-w-sm text-sm leading-relaxed text-ink-muted lg:text-right">
            Month to month. Cancel from the app in two taps — nobody will ring you to talk you out
            of it.
          </p>
        </div>

        <div className="mt-14 grid items-start gap-6 lg:grid-cols-3 lg:gap-7">
          {plans.map((plan) => {
            const perDay = Math.round(plan.priceInPaise / (30 * (intervalMonths[plan.interval] ?? 1)));
            return (
              <article
                key={plan.id}
                className={cn(
                  "js-reveal relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border bg-surface p-6 lg:p-8",
                  plan.highlight
                    ? "border-brand shadow-[var(--shadow-glow)] lg:z-10 lg:scale-[1.035]"
                    : "border-border shadow-[var(--shadow-sm)]",
                )}
              >
                {plan.highlight && (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-brand-soft to-transparent"
                  />
                )}

                <div className="relative flex flex-1 flex-col">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-display text-xl leading-none font-extrabold tracking-[-0.03em] text-ink">
                      {plan.name}
                    </h3>
                    {plan.highlight && (
                      <span className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-brand-ink uppercase">
                        Most picked
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-sm text-ink-muted">{plan.tagline}</p>

                  <p className="mt-7 flex flex-wrap items-baseline gap-x-2">
                    <span className="font-display text-[clamp(2.25rem,5vw,3rem)] leading-none font-extrabold tracking-[-0.045em] text-ink">
                      {formatINR(plan.priceInPaise)}
                    </span>
                    <span className="text-sm text-ink-faint">
                      / {intervalLabel[plan.interval] ?? "month"}
                    </span>
                  </p>
                  <p className="mt-2 text-xs text-ink-faint">
                    About {formatINR(perDay)} a day, taxes included.
                  </p>

                  <ul className="mt-7 flex flex-col gap-3 border-t border-border pt-7">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-ink-muted">
                        <Check
                          className={cn(
                            "mt-0.5 size-4 shrink-0",
                            plan.highlight ? "text-brand" : "text-sage",
                          )}
                          aria-hidden
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <ButtonLink
                    href={`/checkout/${plan.slug}`}
                    size="lg"
                    variant={plan.highlight ? "primary" : "outline"}
                    className="mt-8 w-full"
                  >
                    Join {plan.name}
                  </ButtonLink>
                </div>
              </article>
            );
          })}
        </div>

        {showAllLink && (
          <div className="js-reveal mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-muted">
              Paying yearly? Forge Annual is twelve months for the price of ten.
            </p>
            <Link
              href="/pricing"
              className="group inline-flex items-center gap-2 text-sm font-medium text-brand"
            >
              Compare every plan
              <ArrowUpRight className="size-4 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
