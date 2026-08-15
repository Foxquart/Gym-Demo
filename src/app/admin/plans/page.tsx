import { Suspense } from "react";
import { Tags } from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatINR, intervalLabel } from "@/lib/utils";
import { Badge, EmptyState } from "@/components/ui";
import { DataTable, type Column } from "@/components/admin/data-table";
import { StatTile } from "@/components/admin/tiles";
import { monthlyValueInPaise } from "@/components/admin/format";
import {
  NewPlanButton,
  PlanRowActions,
  type PlanRecord,
} from "@/components/admin/plan-manager";

export const metadata = { title: "Plans" };

export default async function PlansPage() {
  await requireAdmin();

  const plans = await prisma.plan.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { subscriptions: true, payments: true } },
    },
  });

  const activeSubs = await prisma.subscription.groupBy({
    by: ["planId"],
    where: { status: "ACTIVE", endsAt: { gt: new Date() } },
    _count: { _all: true },
  });
  const activeByPlan = new Map(activeSubs.map((row) => [row.planId, row._count._all]));

  const rows: (PlanRecord & { activeMembers: number; paymentCount: number })[] = plans.map(
    (plan) => ({
      id: plan.id,
      slug: plan.slug,
      name: plan.name,
      tagline: plan.tagline,
      priceInPaise: plan.priceInPaise,
      interval: plan.interval,
      features: plan.features,
      highlight: plan.highlight,
      active: plan.active,
      sortOrder: plan.sortOrder,
      subscriptionCount: plan._count.subscriptions,
      paymentCount: plan._count.payments,
      activeMembers: activeByPlan.get(plan.id) ?? 0,
    }),
  );

  const liveCount = rows.filter((p) => p.active).length;
  const mrr = rows.reduce(
    (sum, plan) => sum + plan.activeMembers * monthlyValueInPaise(plan.priceInPaise, plan.interval),
    0,
  );
  const cheapest = rows.filter((p) => p.active).sort((a, b) => a.priceInPaise - b.priceInPaise)[0];

  type Row = (typeof rows)[number];
  const columns: Column<Row>[] = [
    {
      key: "plan",
      header: "Plan",
      primary: true,
      cell: (row) => (
        <span className="flex items-start gap-2.5">
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-ink">{row.name}</span>
              {row.highlight && <Badge tone="brand">Featured</Badge>}
              {!row.active && <Badge>Hidden</Badge>}
            </span>
            <span className="mt-0.5 block text-xs text-ink-faint">{row.tagline}</span>
            <span className="mt-0.5 block font-mono text-[11px] text-ink-faint">/{row.slug}</span>
          </span>
        </span>
      ),
    },
    {
      key: "price",
      header: "Price",
      numeric: true,
      cell: (row) => (
        <span>
          <span className="block font-medium text-ink">{formatINR(row.priceInPaise)}</span>
          <span className="block text-xs text-ink-faint">
            per {intervalLabel[row.interval]}
            {row.interval !== "MONTHLY" && (
              <> · {formatINR(monthlyValueInPaise(row.priceInPaise, row.interval))}/mo</>
            )}
          </span>
        </span>
      ),
    },
    {
      key: "features",
      header: "Includes",
      hideOnMobile: true,
      cell: (row) => (
        <ul className="max-w-md space-y-0.5 text-xs text-ink-muted">
          {row.features.slice(0, 3).map((feature) => (
            <li key={feature} className="truncate">
              · {feature}
            </li>
          ))}
          {row.features.length > 3 && (
            <li className="text-ink-faint">+{row.features.length - 3} more</li>
          )}
        </ul>
      ),
    },
    {
      key: "members",
      header: "Active",
      numeric: true,
      cell: (row) => (
        <span>
          <span className="block font-medium text-ink">{row.activeMembers}</span>
          <span className="block text-xs text-ink-faint">{row.subscriptionCount} all time</span>
        </span>
      ),
    },
    {
      key: "mrr",
      header: "Monthly value",
      numeric: true,
      cell: (row) => (
        <span className="text-ink-muted">
          {formatINR(row.activeMembers * monthlyValueInPaise(row.priceInPaise, row.interval))}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      actions: true,
      width: "16rem",
      cell: (row) => (
        <PlanRowActions
          plan={row}
          isFirst={rows[0]?.id === row.id}
          isLast={rows[rows.length - 1]?.id === row.id}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <section aria-label="Plan summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Plans live" value={String(liveCount)} hint={`${rows.length} defined in total`} />
        <StatTile label="Recurring value" value={formatINR(mrr, { compact: true })} hint="Active subscriptions, per month" />
        <StatTile
          label="Entry price"
          value={cheapest ? formatINR(cheapest.priceInPaise) : "—"}
          hint={cheapest ? `${cheapest.name}, per ${intervalLabel[cheapest.interval]}` : "Nothing live"}
        />
        <StatTile
          label="Featured"
          value={rows.find((p) => p.highlight)?.name ?? "None"}
          hint="Gets the emphasised pricing card"
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-ink-muted">
          Prices are typed in rupees and stored in paise. Changing a price never re-bills anyone
          already subscribed — it only affects new checkouts.
        </p>
        <Suspense fallback={null}>
          <NewPlanButton />
        </Suspense>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        caption="Membership plans with price, billing interval, included features and active member counts"
        empty={
          <EmptyState
            icon={<Tags className="size-7" />}
            title="No plans yet"
            description="The pricing page is empty until you add one. Start with a monthly tier."
          />
        }
      />
    </div>
  );
}
