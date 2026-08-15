import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { InfoTip } from "@/components/ui/info-tip";

/** Page title block. Actions sit right on desktop, wrap underneath on phones. */
export function PageHeader({
  eyebrow,
  title,
  lede,
  actions,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2.5 text-[11px] font-semibold tracking-[0.2em] text-brand uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-[clamp(1.75rem,3.2vw,2.5rem)] leading-[1.05] text-ink">
          {title}
        </h1>
        {lede ? <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-ink-muted">{lede}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div> : null}
    </header>
  );
}

export function SectionTitle({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-lg tracking-tight text-ink">{title}</h2>
        {hint ? <p className="mt-1 text-[13px] text-ink-muted">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

const tones = {
  brand: "text-brand bg-brand-soft",
  amber: "text-amber bg-amber/12",
  sage: "text-sage bg-sage/12",
  clay: "text-clay bg-clay/12",
} as const;

/**
 * One number, one label, one line of context. Deliberately dense — four of
 * these fit a laptop row and two fit a phone.
 */
export function StatTile({
  label,
  value,
  unit,
  context,
  explain,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  unit?: string;
  context?: string;
  /** Plain-language answer to "what is this number actually counting?" */
  explain?: React.ReactNode;
  icon: LucideIcon;
  tone?: keyof typeof tones;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-4 transition-shadow duration-300 hover:shadow-[var(--shadow-md)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] text-ink-faint uppercase">
          {label}
          {explain ? <InfoTip label={label}>{explain}</InfoTip> : null}
        </p>
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-full", tones[tone])}>
          <Icon className="size-4" aria-hidden />
        </span>
      </div>

      <p className="mt-3 flex items-baseline gap-1.5 font-display text-[clamp(1.6rem,2.4vw,2.1rem)] leading-none text-ink tabular-nums">
        {value}
        {unit ? <span className="text-sm font-medium text-ink-faint">{unit}</span> : null}
      </p>

      {context ? <p className="mt-2 text-xs leading-snug text-ink-muted">{context}</p> : null}
    </div>
  );
}
