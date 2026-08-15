import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Badge } from "@/components/ui";
import { cn, formatINR, intervalLabel } from "@/lib/utils";

export type PlanCardPlan = {
  slug: string;
  name: string;
  tagline: string;
  priceInPaise: number;
  interval: string;
  features: string[];
  highlight: boolean;
};

export function PlanCard({ plan, isCurrent }: { plan: PlanCardPlan; isCurrent?: boolean }) {
  const per = intervalLabel[plan.interval] ?? "month";

  return (
    <Link
      href={`/checkout/${plan.slug}`}
      aria-label={`Continue with ${plan.name}, ${formatINR(plan.priceInPaise)} per ${per}`}
      className={cn(
        "group relative flex flex-col rounded-[var(--radius-card)] border bg-surface p-6 sm:p-7",
        "transition-all duration-500 ease-[var(--ease-out-expo)]",
        "hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] focus-visible:-translate-y-1",
        plan.highlight
          ? "border-brand shadow-[var(--shadow-glow)] lg:scale-[1.04] lg:z-10"
          : "border-border shadow-[var(--shadow-sm)] hover:border-border-strong",
      )}
    >
      {(plan.highlight || isCurrent) && (
        <div className="absolute -top-3 left-6 flex gap-2">
          {plan.highlight && <Badge tone="brand">Most members</Badge>}
          {isCurrent && <Badge tone="success">Your plan</Badge>}
        </div>
      )}

      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-2xl tracking-tight text-ink">{plan.name}</h3>
        {plan.interval !== "MONTHLY" && (
          <span className="text-[11px] font-semibold tracking-[0.18em] text-ink-faint uppercase">
            {per}ly
          </span>
        )}
      </div>

      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{plan.tagline}</p>

      <div className="mt-5 flex items-end gap-1.5">
        <span className="font-display text-display-sm leading-none text-ink">
          {formatINR(plan.priceInPaise)}
        </span>
        <span className="pb-1 text-sm text-ink-faint">/ {per}</span>
      </div>
      <p className="mt-1 text-xs text-ink-faint">Inclusive of 18% GST · cancel any time</p>

      <ul className="mt-6 flex-1 space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2.5 text-sm leading-relaxed text-ink-muted">
            <Check
              className={cn("mt-0.5 size-4 shrink-0", plan.highlight ? "text-brand" : "text-sage")}
              aria-hidden
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <span
        className={cn(
          "mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-pill)] px-6 text-sm font-medium",
          "transition-all duration-300 ease-[var(--ease-out-expo)]",
          plan.highlight
            ? "bg-brand text-brand-ink group-hover:bg-brand-hover"
            : "border border-border-strong text-ink group-hover:border-brand group-hover:text-brand",
        )}
      >
        {isCurrent ? `Renew ${plan.name}` : `Choose ${plan.name}`}
        <ArrowRight
          className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
    </Link>
  );
}
