import { Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Shape-matched loading primitives for the two app shells.
 *
 * These exist because every dashboard and admin page is a Server Component
 * that awaits Postgres before it can render — on a hosted database that is a
 * round trip per navigation, during which App Router would otherwise hold the
 * old page on screen with no feedback. A `loading.tsx` built from these paints
 * instantly and streams the real page in behind it.
 *
 * The point is to reserve the same boxes the real page will occupy, so the
 * swap does not shift layout. Keep these in step with their pages.
 */

/** Announce once per page, not once per shape, or screen readers get spammed. */
export function LoadingRegion({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      <div aria-hidden>{children}</div>
    </div>
  );
}

export function SkeletonPageHeader({ actions = 2 }: { actions?: number }) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 flex-1">
        <Skeleton className="h-3 w-32 rounded-full" />
        <Skeleton className="mt-3.5 h-9 w-[min(22rem,80%)]" />
        <Skeleton className="mt-3.5 h-4 w-[min(34rem,95%)]" />
      </div>
      {actions > 0 && (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          {Array.from({ length: actions }, (_, i) => (
            <Skeleton key={i} className="h-11 w-32 rounded-full" />
          ))}
        </div>
      )}
    </header>
  );
}

export function SkeletonStatTiles({
  count = 4,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4", className)}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="rounded-[var(--radius-card)] border border-border bg-surface p-4 sm:p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-2.5 w-24 rounded-full" />
            <Skeleton className="size-8 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-8 w-20" />
          <Skeleton className="mt-3 h-3 w-28 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard({
  lines = 3,
  className,
  header = true,
}: {
  lines?: number;
  className?: string;
  header?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6",
        className,
      )}
    >
      {header && (
        <div className="mb-5 flex items-center justify-between gap-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      )}
      <div className="flex flex-col gap-3">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  // Staggered bar heights read as a chart rather than a grey slab.
  const bars = [42, 68, 55, 80, 38, 72, 60, 88, 47, 64, 76, 52];
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6",
        className,
      )}
    >
      <Skeleton className="h-5 w-44" />
      <Skeleton className="mt-3 h-3.5 w-64 rounded-full" />
      <div className="mt-7 flex h-44 items-end gap-2 sm:gap-3">
        {bars.map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-md" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonTable({
  rows = 8,
  cols = 5,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface",
        className,
      )}
    >
      {/* header row */}
      <div className="flex items-center gap-4 border-b border-border px-4 py-3.5 sm:px-5">
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} className={cn("h-3 rounded-full", i === 0 ? "w-40" : "flex-1")} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-0 sm:px-5"
        >
          {Array.from({ length: cols }, (_, c) => (
            <div key={c} className={cn(c === 0 ? "flex w-40 items-center gap-3" : "flex-1")}>
              {c === 0 ? (
                <>
                  <Skeleton className="size-9 shrink-0 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="mt-1.5 h-2.5 w-16 rounded-full" />
                  </div>
                </>
              ) : (
                <Skeleton className="h-3.5 w-full max-w-28" />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonToolbar() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Skeleton className="h-10 w-full max-w-xs rounded-xl" />
      <Skeleton className="h-10 w-32 rounded-xl" />
      <Skeleton className="h-10 w-32 rounded-xl" />
    </div>
  );
}

export function SkeletonCardGrid({
  count = 6,
  className,
  media = true,
}: {
  count?: number;
  className?: string;
  media?: boolean;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", className)}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface"
        >
          {media && <Skeleton className="h-40 w-full rounded-none" />}
          <div className="p-5">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="mt-3.5 h-3.5 w-full" />
            <Skeleton className="mt-2 h-3.5 w-3/4" />
            <Skeleton className="mt-5 h-10 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonRows({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div
      className={cn(
        "divide-y divide-border overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface",
        className,
      )}
    >
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 sm:p-5">
          <Skeleton className="size-12 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="mt-2 h-3 w-64 max-w-full rounded-full" />
          </div>
          <Skeleton className="h-9 w-24 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}
