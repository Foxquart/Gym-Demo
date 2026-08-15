import * as React from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { InfoTip } from "@/components/ui/info-tip";
import { seriesColor } from "@/components/admin/chart-tokens";

/* -------------------------------- stat tile ------------------------------- */

export function StatTile({
  label,
  value,
  hint,
  explain,
  delta,
  icon: Icon,
  href,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  /** Plain-language answer to "what is this number actually counting?" */
  explain?: React.ReactNode;
  /** Signed change vs a named period, e.g. { pct: 12, since: "last month" }. */
  delta?: { pct: number; since: string; upIsGood?: boolean };
  icon?: LucideIcon;
  href?: string;
  tone?: "neutral" | "warn";
}) {
  const good = delta ? (delta.upIsGood ?? true) === delta.pct >= 0 : true;

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.14em] text-ink-faint uppercase">
          {label}
          {explain ? <InfoTip label={label}>{explain}</InfoTip> : null}
        </p>
        {Icon && (
          <Icon
            aria-hidden
            className={cn("size-4 shrink-0", tone === "warn" ? "text-amber" : "text-ink-faint")}
          />
        )}
      </div>
      <p className="mt-2.5 font-sans text-[28px] leading-none font-semibold tracking-tight text-ink">
        {value}
      </p>
      <div className="mt-2 flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1">
        {delta && Number.isFinite(delta.pct) && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium tabular-nums",
              good ? "text-success" : "text-danger",
            )}
          >
            {delta.pct >= 0 ? (
              <ArrowUpRight className="size-3.5" aria-hidden />
            ) : (
              <ArrowDownRight className="size-3.5" aria-hidden />
            )}
            {Math.abs(delta.pct)}%
            <span className="font-normal text-ink-faint"> vs {delta.since}</span>
          </span>
        )}
        {hint && <span className="text-xs text-ink-faint">{hint}</span>}
      </div>
    </>
  );

  const classes = cn(
    "relative flex flex-col rounded-[var(--radius-card)] border bg-surface p-4",
    tone === "warn" ? "border-amber/40" : "border-border",
    href && "transition-colors hover:border-brand hover:shadow-[var(--shadow-sm)]",
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {body}
        <ArrowRight
          aria-hidden
          className="absolute right-4 bottom-4 size-4 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100"
        />
      </Link>
    );
  }
  return <div className={classes}>{body}</div>;
}

/* ------------------------------ section card ------------------------------ */

export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-[var(--radius-card)] border border-border bg-surface",
        className,
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <h2 className="font-display text-[15px] leading-tight tracking-tight text-ink">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-ink-faint">{description}</p>}
        </div>
        {action}
      </header>
      <div className={cn("min-w-0 flex-1 p-4 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

/* ------------------------------ composition ------------------------------- */

export type MixSegment = { label: string; value: number; sub?: string };

/**
 * Plan mix as a single composition bar. Segments are separated by a 2px gap in
 * the surface colour rather than a stroke, and the legend always carries the
 * identity so nothing depends on colour alone.
 */
export function CompositionBar({
  segments,
  total,
  unit,
}: {
  segments: MixSegment[];
  total: number;
  unit: string;
}) {
  if (total === 0) {
    return <p className="text-sm text-ink-faint">Nothing on the books yet.</p>;
  }

  return (
    <div>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full bg-[var(--chart-track)]">
        {segments.map((segment, i) => (
          <span
            key={segment.label}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${(segment.value / total) * 100}%`,
              background: seriesColor(i),
            }}
          />
        ))}
      </div>
      <ul className="mt-4 space-y-2.5">
        {segments.map((segment, i) => (
          <li key={segment.label} className="flex items-center gap-2.5 text-sm">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: seriesColor(i) }}
            />
            <span className="min-w-0 flex-1 truncate text-ink">{segment.label}</span>
            {segment.sub && <span className="shrink-0 text-xs text-ink-faint">{segment.sub}</span>}
            <span className="shrink-0 text-ink-muted tabular-nums">
              {segment.value} {unit}
            </span>
            <span className="w-11 shrink-0 text-right font-medium text-ink tabular-nums">
              {Math.round((segment.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------- occupancy ------------------------------- */

/** Fill meter: the track is a lighter step of the same ramp, so state reads across the bar. */
export function OccupancyMeter({
  filled,
  capacity,
  className,
  showLabel = true,
}: {
  filled: number;
  capacity: number;
  className?: string;
  showLabel?: boolean;
}) {
  const pct = capacity === 0 ? 0 : Math.min(100, Math.round((filled / capacity) * 100));
  const tone = pct >= 100 ? "bg-danger" : pct >= 80 ? "bg-amber" : "bg-brand";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className="h-2 min-w-16 flex-1 overflow-hidden rounded-full bg-[var(--chart-track)]"
        role="meter"
        aria-valuenow={filled}
        aria-valuemin={0}
        aria-valuemax={capacity}
        aria-label={`${filled} of ${capacity} spots booked`}
      >
        <div className={cn("h-full rounded-full transition-[width]", tone)} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && (
        <span className="shrink-0 text-xs text-ink-muted tabular-nums">
          {filled}/{capacity}
        </span>
      )}
    </div>
  );
}
