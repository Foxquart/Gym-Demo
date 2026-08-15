import * as React from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * One table for the whole admin portal.
 *
 * It renders twice from a single column definition: a real `<table>` from `md`
 * up (sticky header, horizontally scrollable inside its own box so the page
 * never scrolls sideways) and a stacked card list on phones. Sorting and
 * pagination are plain links that rewrite the query string, so both work with
 * JavaScript off and the server does the actual work.
 */

export type Column<T> = {
  /** Stable id, also used as the sort key unless `sortKey` says otherwise. */
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Present = the header becomes a sort link. */
  sortKey?: string;
  align?: "left" | "right";
  /** Column of numbers — aligns the digits. */
  numeric?: boolean;
  /** The identifying column. Becomes the card headline on phones. */
  primary?: boolean;
  /** Dropped from the phone card (usually redundant with the headline). */
  hideOnMobile?: boolean;
  width?: string;
  /** Row-action column: no header label, no card label. */
  actions?: boolean;
};

export type Query = Record<string, string | undefined>;

export function buildHref(basePath: string, query: Query, patch: Query) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...query, ...patch })) {
    if (value === undefined || value === "" || value === null) continue;
    params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  basePath,
  query,
  sort,
  dir = "desc",
  empty,
  caption,
  rowHref,
  footer,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Needed only when a column is sortable. */
  basePath?: string;
  query?: Query;
  sort?: string;
  dir?: "asc" | "desc";
  empty: React.ReactNode;
  /** Screen-reader summary of the table. */
  caption: string;
  rowHref?: (row: T) => string;
  /** Totals row rendered under the body. */
  footer?: React.ReactNode;
}) {
  if (rows.length === 0) return <>{empty}</>;

  const sortLink = (column: Column<T>) => {
    if (!column.sortKey || !basePath) return null;
    const active = sort === column.sortKey;
    const nextDir = active && dir === "desc" ? "asc" : "desc";
    return buildHref(basePath, query ?? {}, {
      sort: column.sortKey,
      dir: nextDir,
      page: undefined,
    });
  };

  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface">
      {/* ---------------------------- desktop table --------------------------- */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[52rem] border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-border">
              {columns.map((column) => {
                const href = sortLink(column);
                const active = Boolean(column.sortKey) && sort === column.sortKey;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    style={column.width ? { width: column.width } : undefined}
                    aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : undefined}
                    className={cn(
                      "sticky top-0 z-10 bg-bg-subtle px-3 py-2.5 text-[11px] font-semibold tracking-[0.12em] whitespace-nowrap text-ink-faint uppercase",
                      column.align === "right" || column.numeric ? "text-right" : "text-left",
                      column.actions && "text-right",
                    )}
                  >
                    {href ? (
                      <Link
                        href={href}
                        scroll={false}
                        className={cn(
                          "inline-flex items-center gap-1 rounded transition-colors hover:text-ink",
                          active && "text-brand",
                        )}
                      >
                        {column.header}
                        {active ? (
                          dir === "asc" ? (
                            <ArrowUp className="size-3" aria-hidden />
                          ) : (
                            <ArrowDown className="size-3" aria-hidden />
                          )
                        ) : (
                          <ChevronsUpDown className="size-3 opacity-40" aria-hidden />
                        )}
                      </Link>
                    ) : column.actions ? (
                      <span className="sr-only">{column.header}</span>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-b border-border/70 transition-colors last:border-0 hover:bg-bg-subtle/60"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-3 py-2.5 align-middle text-ink",
                      column.align === "right" || column.numeric || column.actions
                        ? "text-right"
                        : "text-left",
                      column.numeric && "tabular-nums",
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {footer && (
            <tfoot>
              <tr className="border-t-2 border-border-strong bg-bg-subtle/70">{footer}</tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ----------------------------- phone cards ---------------------------- */}
      <ul className="divide-y divide-border md:hidden">
        {rows.map((row) => {
          const primary = columns.find((c) => c.primary) ?? columns[0];
          const rest = columns.filter((c) => c !== primary && !c.hideOnMobile && !c.actions);
          const actions = columns.filter((c) => c.actions);
          const href = rowHref?.(row);
          return (
            <li key={rowKey(row)} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 font-medium text-ink">
                  {href ? (
                    <Link href={href} className="block min-h-11 py-1">
                      {primary.cell(row)}
                    </Link>
                  ) : (
                    primary.cell(row)
                  )}
                </div>
                {actions.length > 0 && (
                  <div className="flex shrink-0 items-center gap-1">
                    {actions.map((column) => (
                      <React.Fragment key={column.key}>{column.cell(row)}</React.Fragment>
                    ))}
                  </div>
                )}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                {rest.map((column) => (
                  <div key={column.key} className="min-w-0">
                    <dt className="text-[10px] font-semibold tracking-[0.12em] text-ink-faint uppercase">
                      {column.header}
                    </dt>
                    <dd className={cn("mt-0.5 text-sm text-ink", column.numeric && "tabular-nums")}>
                      {column.cell(row)}
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
        {footer && (
          <li className="bg-bg-subtle/70 p-4">
            <table className="w-full text-sm">
              <tbody>
                <tr>{footer}</tr>
              </tbody>
            </table>
          </li>
        )}
      </ul>
    </div>
  );
}

/* ------------------------------- pagination ------------------------------- */

export function Pagination({
  page,
  pageCount,
  total,
  basePath,
  query,
  unit = "rows",
}: {
  page: number;
  pageCount: number;
  total: number;
  basePath: string;
  query: Query;
  unit?: string;
}) {
  if (total === 0) return null;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-xs text-ink-faint tabular-nums">
        {from.toLocaleString("en-IN")}–{to.toLocaleString("en-IN")} of{" "}
        {total.toLocaleString("en-IN")} {unit}
      </p>
      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <PageLink
            href={buildHref(basePath, query, { page: page > 2 ? String(page - 1) : undefined })}
            disabled={page <= 1}
            label="Previous page"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </PageLink>
          <span className="px-3 text-xs text-ink-muted tabular-nums">
            Page {page} of {pageCount}
          </span>
          <PageLink
            href={buildHref(basePath, query, { page: String(page + 1) })}
            disabled={page >= pageCount}
            label="Next page"
          >
            <ChevronRight className="size-4" aria-hidden />
          </PageLink>
        </div>
      )}
    </nav>
  );
}

export const PAGE_SIZE = 20;

function PageLink({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const classes =
    "grid size-11 place-items-center rounded-xl border border-border text-ink-muted transition-colors";
  if (disabled) {
    return (
      <span aria-disabled className={cn(classes, "opacity-40")} aria-label={label}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} scroll={false} aria-label={label} className={cn(classes, "hover:border-brand hover:text-brand")}>
      {children}
    </Link>
  );
}
