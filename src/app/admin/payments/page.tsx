import Link from "next/link";
import { CreditCard } from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatINR } from "@/lib/utils";
import { Badge, EmptyState } from "@/components/ui";
import { DataTable, PAGE_SIZE, Pagination, type Column } from "@/components/admin/data-table";
import { DateRangeFilter, FilterSelect, SearchField, Toolbar } from "@/components/admin/toolbar";
import { CsvExportButton } from "@/components/admin/csv-export";
import { StatTile } from "@/components/admin/tiles";
import { PAYMENT_TONE } from "@/components/admin/format";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Payments" };

type Search = {
  q?: string;
  status?: string;
  from?: string;
  to?: string;
  sort?: string;
  dir?: string;
  page?: string;
};

const SORTABLE = new Set(["createdAt", "amountInPaise", "status"]);
const STATUSES = ["CREATED", "PAID", "FAILED", "REFUNDED"] as const;

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin();
  const params = await searchParams;

  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const dir = params.dir === "asc" ? "asc" : "desc";
  const sortKey = params.sort && SORTABLE.has(params.sort) ? params.sort : "createdAt";
  const orderBy = { [sortKey]: dir } as Prisma.PaymentOrderByWithRelationInput;

  const from = params.from ? new Date(`${params.from}T00:00:00`) : undefined;
  const to = params.to ? new Date(`${params.to}T23:59:59.999`) : undefined;

  const where: Prisma.PaymentWhereInput = {
    ...(STATUSES.includes(params.status as (typeof STATUSES)[number])
      ? { status: params.status as (typeof STATUSES)[number] }
      : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    ...(params.q
      ? {
          OR: [
            { razorpayOrderId: { contains: params.q, mode: "insensitive" as const } },
            { razorpayPaymentId: { contains: params.q, mode: "insensitive" as const } },
            { user: { name: { contains: params.q, mode: "insensitive" as const } } },
            { user: { email: { contains: params.q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [rows, total, totals, paidTotals, failedTotals, exportRows] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        amountInPaise: true,
        currency: true,
        status: true,
        method: true,
        failureReason: true,
        razorpayOrderId: true,
        razorpayPaymentId: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        plan: { select: { name: true } },
      },
    }),
    prisma.payment.count({ where }),
    prisma.payment.aggregate({ where, _sum: { amountInPaise: true } }),
    prisma.payment.aggregate({
      where: { ...where, status: "PAID" },
      _sum: { amountInPaise: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: { ...where, status: "FAILED" },
      _sum: { amountInPaise: true },
      _count: true,
    }),
    prisma.payment.findMany({
      where,
      orderBy,
      take: 2000,
      select: {
        createdAt: true,
        status: true,
        amountInPaise: true,
        currency: true,
        method: true,
        failureReason: true,
        razorpayOrderId: true,
        razorpayPaymentId: true,
        user: { select: { name: true, email: true } },
        plan: { select: { name: true } },
      },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const query: Record<string, string | undefined> = {
    q: params.q,
    status: params.status,
    from: params.from,
    to: params.to,
    sort: params.sort,
    dir: params.dir,
    page: params.page,
  };

  type Row = (typeof rows)[number];
  const columns: Column<Row>[] = [
    {
      key: "member",
      header: "Member",
      primary: true,
      cell: (row) => (
        <Link href={`/admin/members/${row.user.id}`} className="block min-w-0">
          <span className="block truncate font-medium text-ink hover:text-brand">
            {row.user.name}
          </span>
          <span className="block truncate text-xs text-ink-faint">{row.user.email}</span>
        </Link>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      numeric: true,
      sortKey: "amountInPaise",
      cell: (row) => <span className="font-medium text-ink">{formatINR(row.amountInPaise)}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortKey: "status",
      cell: (row) => (
        <span className="flex flex-col items-start gap-1">
          <Badge tone={PAYMENT_TONE[row.status]}>{row.status.toLowerCase()}</Badge>
          {row.failureReason && (
            <span className="max-w-[16rem] text-xs text-danger">{row.failureReason}</span>
          )}
        </span>
      ),
    },
    { key: "plan", header: "Plan", cell: (row) => row.plan?.name ?? "—" },
    {
      key: "method",
      header: "Method",
      cell: (row) => <span className="text-ink-muted">{row.method ?? "—"}</span>,
    },
    {
      key: "razorpay",
      header: "Razorpay",
      cell: (row) => (
        <span className="block font-mono text-[11px] text-ink-faint">
          <span className="block">{row.razorpayOrderId}</span>
          {row.razorpayPaymentId ? (
            <span className="block">{row.razorpayPaymentId}</span>
          ) : (
            <span className="block italic">no payment id</span>
          )}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      sortKey: "createdAt",
      numeric: true,
      cell: (row) => (
        <span>
          <span className="block text-ink">{formatDate(row.createdAt)}</span>
          <span className="block text-xs text-ink-faint tabular-nums">
            {row.createdAt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
          </span>
        </span>
      ),
    },
  ];

  const collected = paidTotals._sum.amountInPaise ?? 0;
  const declined = failedTotals._sum.amountInPaise ?? 0;
  const filtered = totals._sum.amountInPaise ?? 0;

  return (
    <div>
      <section aria-label="Ledger totals" className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Collected" value={formatINR(collected)} hint={`${paidTotals._count} paid orders`} />
        <StatTile
          label="Declined"
          value={formatINR(declined)}
          hint={`${failedTotals._count} failed attempt${failedTotals._count === 1 ? "" : "s"}`}
          tone={failedTotals._count > 0 ? "warn" : "neutral"}
        />
        <StatTile label="All orders in view" value={formatINR(filtered)} hint={`${total} rows matched`} />
        <StatTile
          label="Average order"
          value={paidTotals._count ? formatINR(Math.round(collected / paidTotals._count)) : "—"}
          hint="Paid orders only"
        />
      </section>

      <Toolbar>
        <SearchField
          label="Search payments"
          placeholder="Member, email or Razorpay id — press / to focus"
          className="sm:w-80"
        />
        <FilterSelect
          paramName="status"
          label="Filter by status"
          options={[
            { value: "", label: "All statuses" },
            { value: "PAID", label: "Paid" },
            { value: "CREATED", label: "Created" },
            { value: "FAILED", label: "Failed" },
            { value: "REFUNDED", label: "Refunded" },
          ]}
        />
        <DateRangeFilter />
        <div className="sm:ml-auto">
          <CsvExportButton
            filename={`ember-payments-${new Date().toISOString().slice(0, 10)}.csv`}
            headers={[
              "Date",
              "Member",
              "Email",
              "Plan",
              "Amount (INR)",
              "Currency",
              "Status",
              "Method",
              "Razorpay order",
              "Razorpay payment",
              "Failure reason",
            ]}
            rows={exportRows.map((row) => [
              row.createdAt.toISOString(),
              row.user.name,
              row.user.email,
              row.plan?.name ?? "",
              (row.amountInPaise / 100).toFixed(2),
              row.currency,
              row.status,
              row.method ?? "",
              row.razorpayOrderId,
              row.razorpayPaymentId ?? "",
              row.failureReason ?? "",
            ])}
            label={`Export ${Math.min(total, 2000)} rows`}
          />
        </div>
      </Toolbar>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        basePath="/admin/payments"
        query={query}
        sort={sortKey}
        dir={dir}
        caption="Payment ledger with member, amount, status, method and Razorpay references"
        empty={
          <EmptyState
            icon={<CreditCard className="size-7" />}
            title="No payments match"
            description="Widen the date range or clear the status filter. Orders only appear here once checkout has been started."
          />
        }
        footer={
          <>
            <td className="px-3 py-2.5 text-left text-xs font-semibold tracking-[0.1em] text-ink-faint uppercase">
              Page total
            </td>
            <td className="px-3 py-2.5 text-right font-medium text-ink tabular-nums">
              {formatINR(rows.reduce((sum, r) => sum + r.amountInPaise, 0))}
            </td>
            <td className="px-3 py-2.5 text-left text-xs text-ink-faint" colSpan={5}>
              {rows.length} of {total.toLocaleString("en-IN")} matching orders ·{" "}
              {formatINR(filtered)} in view
            </td>
          </>
        }
      />

      <Pagination
        page={page}
        pageCount={pageCount}
        total={total}
        basePath="/admin/payments"
        query={query}
        unit="payments"
      />
    </div>
  );
}
