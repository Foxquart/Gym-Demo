import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CreditCard,
  Gauge,
  Inbox,
  IndianRupee,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatINR, initials } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { RevenueTrendChart, SignupsChart } from "@/components/admin/charts";
import { CompositionBar, OccupancyMeter, Panel, StatTile } from "@/components/admin/tiles";
import {
  addDays,
  daysUntil,
  monthLabel,
  monthlyValueInPaise,
  pctChange,
  startOfDay,
  startOfMonth,
  timeAgo,
} from "@/components/admin/format";

export const metadata = { title: "Command centre" };

export default async function AdminHome() {
  await requireAdmin();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(addDays(monthStart, -1));
  const weekAgo = addDays(startOfDay(now), -7);
  const twoWeeksAgo = addDays(startOfDay(now), -14);
  const sixMonthsAgo = new Date(monthStart);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  const eightWeeksAgo = addDays(startOfDay(now), -56);
  const nextWeek = addDays(now, 7);

  const [
    activeSubs,
    paidThisMonth,
    paidLastMonth,
    recentPaid,
    recentSignups,
    signupsThisWeek,
    signupsLastWeek,
    upcomingSessions,
    expiring,
    failedPayments,
    openLeads,
    memberCount,
    activityPayments,
    activityBookings,
    activityLeads,
    activityMembers,
  ] = await Promise.all([
    prisma.subscription.findMany({
      where: { status: "ACTIVE", endsAt: { gt: now } },
      select: { userId: true, plan: { select: { name: true, priceInPaise: true, interval: true } } },
    }),
    prisma.payment.aggregate({
      where: { status: "PAID", createdAt: { gte: monthStart } },
      _sum: { amountInPaise: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: { status: "PAID", createdAt: { gte: lastMonthStart, lt: monthStart } },
      _sum: { amountInPaise: true },
    }),
    prisma.payment.findMany({
      where: { status: "PAID", createdAt: { gte: sixMonthsAgo } },
      select: { amountInPaise: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: eightWeeksAgo } },
      select: { createdAt: true },
    }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
    prisma.classSession.findMany({
      where: { startsAt: { gte: now, lt: nextWeek } },
      select: {
        id: true,
        title: true,
        startsAt: true,
        capacity: true,
        trainer: { select: { name: true } },
        bookings: { where: { status: { not: "CANCELLED" } }, select: { id: true } },
      },
      orderBy: { startsAt: "asc" },
    }),
    prisma.subscription.findMany({
      where: { status: "ACTIVE", endsAt: { gte: now, lt: nextWeek } },
      select: {
        id: true,
        endsAt: true,
        user: { select: { id: true, name: true } },
        plan: { select: { name: true } },
      },
      orderBy: { endsAt: "asc" },
    }),
    prisma.payment.findMany({
      where: { status: "FAILED" },
      select: {
        id: true,
        amountInPaise: true,
        failureReason: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.lead.findMany({
      where: { handled: false },
      select: { id: true, name: true, message: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.user.count(),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        status: true,
        amountInPaise: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
        classSession: { select: { title: true } },
      },
    }),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, createdAt: true, avatarUrl: true },
    }),
  ]);

  /* --------------------------------- KPIs --------------------------------- */

  const activeMembers = new Set(activeSubs.map((s) => s.userId)).size;
  const mrrInPaise = activeSubs.reduce(
    (sum, s) => sum + monthlyValueInPaise(s.plan.priceInPaise, s.plan.interval),
    0,
  );
  const revenueThisMonth = paidThisMonth._sum.amountInPaise ?? 0;
  const revenueLastMonth = paidLastMonth._sum.amountInPaise ?? 0;

  const capacityTotal = upcomingSessions.reduce((sum, c) => sum + c.capacity, 0);
  const bookedTotal = upcomingSessions.reduce((sum, c) => sum + c.bookings.length, 0);
  const fillRate = capacityTotal === 0 ? 0 : Math.round((bookedTotal / capacityTotal) * 100);

  /* ------------------------------- chart data ------------------------------ */

  const revenueSeries = Array.from({ length: 6 }, (_, i) => {
    const start = new Date(sixMonthsAgo);
    start.setMonth(start.getMonth() + i);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    const inMonth = recentPaid.filter((p) => p.createdAt >= start && p.createdAt < end);
    return {
      label: monthLabel(start),
      paise: inMonth.reduce((sum, p) => sum + p.amountInPaise, 0),
      count: inMonth.length,
    };
  });

  const signupSeries = Array.from({ length: 8 }, (_, i) => {
    const start = addDays(eightWeeksAgo, i * 7);
    const end = addDays(start, 7);
    return {
      label: i === 7 ? "This wk" : start.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      count: recentSignups.filter((u) => u.createdAt >= start && u.createdAt < end).length,
    };
  });

  const planMix = Object.values(
    activeSubs.reduce<Record<string, { label: string; value: number; paise: number }>>(
      (acc, sub) => {
        const key = sub.plan.name;
        acc[key] ??= { label: key, value: 0, paise: 0 };
        acc[key].value += 1;
        acc[key].paise += monthlyValueInPaise(sub.plan.priceInPaise, sub.plan.interval);
        return acc;
      },
      {},
    ),
  )
    .sort((a, b) => b.value - a.value)
    .map((entry) => ({
      label: entry.label,
      value: entry.value,
      sub: `${formatINR(entry.paise, { compact: true })} / mo`,
    }));

  /* ---------------------------- activity feed ------------------------------ */

  type Activity = { id: string; at: Date; text: React.ReactNode; kind: string };
  const activity: Activity[] = [
    ...activityPayments.map((p) => ({
      id: `pay-${p.id}`,
      at: p.createdAt,
      kind: p.status === "FAILED" ? "Payment failed" : "Payment",
      text: (
        <>
          <MemberLink id={p.user.id} name={p.user.name} />{" "}
          {p.status === "PAID"
            ? `paid ${formatINR(p.amountInPaise)}`
            : p.status === "FAILED"
              ? `had ${formatINR(p.amountInPaise)} declined`
              : `started a ${formatINR(p.amountInPaise)} order`}
        </>
      ),
    })),
    ...activityBookings.map((b) => ({
      id: `book-${b.id}`,
      at: b.createdAt,
      kind: "Booking",
      text: (
        <>
          <MemberLink id={b.user.id} name={b.user.name} /> booked {b.classSession.title}
        </>
      ),
    })),
    ...activityMembers.map((u) => ({
      id: `user-${u.id}`,
      at: u.createdAt,
      kind: "Signup",
      text: (
        <>
          <MemberLink id={u.id} name={u.name} /> joined the club
        </>
      ),
    })),
    ...activityLeads.map((l) => ({
      id: `lead-${l.id}`,
      at: l.createdAt,
      kind: "Enquiry",
      text: <>{l.name} sent an enquiry</>,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 12);

  const attentionCount = failedPayments.length + openLeads.length + expiring.length;

  return (
    <div className="space-y-5">
      {/* --------------------------------- KPIs -------------------------------- */}
      <section aria-label="Key numbers" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatTile
          label="Active members"
          value={activeMembers.toLocaleString("en-IN")}
          hint={`${memberCount} accounts total`}
          icon={Users}
          explain={
            <>
              People with a membership that is currently ACTIVE and not past its end date.
              Registered accounts without a paid membership are not counted here.
            </>
          }
          href="/admin/members?status=ACTIVE"
        />
        <StatTile
          label="MRR"
          value={formatINR(mrrInPaise, { compact: true })}
          hint="Annual plans counted per month"
          icon={TrendingUp}
          explain={
            <>
              <strong>Monthly Recurring Revenue</strong> — what the club earns in a typical month
              if nobody joins or leaves. Quarterly and annual memberships are divided down to their
              per-month value, so this is comparable month to month.
            </>
          }
        />
        <StatTile
          label="Collected this month"
          value={formatINR(revenueThisMonth, { compact: true })}
          delta={{ pct: pctChange(revenueThisMonth, revenueLastMonth), since: "last month" }}
          icon={IndianRupee}
          explain={
            <>
              Money actually received this calendar month — the sum of payments that reached PAID.
              Unlike MRR this is cash in, so an annual payment lands here in full, once.
            </>
          }
          href="/admin/payments?status=PAID"
        />
        <StatTile
          label="Class fill rate"
          value={`${fillRate}%`}
          hint={`${bookedTotal} of ${capacityTotal} spots, next 7 days`}
          icon={Gauge}
          explain={
            <>
              Of every seat offered across the next seven days of the timetable, the share already
              booked. Below ~50% means classes are running half-empty; near 100% means it is time
              to add a session.
            </>
          }
          href="/admin/classes"
        />
        <StatTile
          label="New signups"
          value={signupsThisWeek.toLocaleString("en-IN")}
          delta={{ pct: pctChange(signupsThisWeek, signupsLastWeek), since: "last week" }}
          icon={UserPlus}
          explain={
            <>
              Accounts created in the last seven days, whether or not they have paid yet. Compare
              with Active members to see how many are converting.
            </>
          }
        />
        <StatTile
          label="Expiring in 7 days"
          value={expiring.length.toLocaleString("en-IN")}
          hint={expiring.length ? "Worth a phone call" : "Nothing lapsing"}
          icon={CalendarClock}
          explain={
            <>
              Memberships whose end date falls within the next seven days. They have not lapsed
              yet — this is the window in which a renewal nudge still works.
            </>
          }
          tone={expiring.length > 0 ? "warn" : "neutral"}
        />
      </section>

      {/* ------------------------------- charts -------------------------------- */}
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Panel
          title="Revenue collected"
          description="Paid Razorpay payments, last six months"
        >
          <RevenueTrendChart data={revenueSeries} />
        </Panel>

        <Panel title="Plan mix" description="Where active memberships sit today">
          <CompositionBar
            segments={planMix}
            total={planMix.reduce((sum, s) => sum + s.value, 0)}
            unit="members"
          />
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1.6fr]">
        <Panel title="New members" description="Joins per week, last eight weeks">
          <SignupsChart data={signupSeries} />
        </Panel>

        {/* --------------------------- needs attention -------------------------- */}
        <Panel
          title="Needs attention"
          description={
            attentionCount === 0
              ? "Nothing outstanding. Rare and lovely."
              : `${attentionCount} thing${attentionCount === 1 ? "" : "s"} waiting on someone`
          }
          bodyClassName="p-0 sm:p-0"
        >
          {attentionCount === 0 ? (
            <p className="p-5 text-sm text-ink-muted">
              No failed payments, no unanswered enquiries, nothing lapsing this week. Go and coach.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {failedPayments.length > 0 && (
                <AttentionGroup
                  icon={<CreditCard className="size-4 text-danger" aria-hidden />}
                  title="Payments declined"
                  href="/admin/payments?status=FAILED"
                  linkLabel="Open the ledger"
                >
                  {failedPayments.map((p) => (
                    <AttentionRow
                      key={p.id}
                      title={
                        <>
                          <MemberLink id={p.user.id} name={p.user.name} /> ·{" "}
                          {formatINR(p.amountInPaise)}
                        </>
                      }
                      meta={p.failureReason ?? "No reason returned by Razorpay"}
                      aside={timeAgo(p.createdAt)}
                    />
                  ))}
                </AttentionGroup>
              )}

              {openLeads.length > 0 && (
                <AttentionGroup
                  icon={<Inbox className="size-4 text-amber" aria-hidden />}
                  title="Enquiries waiting"
                  href="/admin/leads?state=open"
                  linkLabel="Reply to them"
                >
                  {openLeads.map((lead) => (
                    <AttentionRow
                      key={lead.id}
                      title={lead.name}
                      meta={lead.message}
                      aside={timeAgo(lead.createdAt)}
                    />
                  ))}
                </AttentionGroup>
              )}

              {expiring.length > 0 && (
                <AttentionGroup
                  icon={<AlertTriangle className="size-4 text-amber" aria-hidden />}
                  title="Memberships lapsing this week"
                  href="/admin/members?status=ACTIVE"
                  linkLabel="See members"
                >
                  {expiring.map((sub) => (
                    <AttentionRow
                      key={sub.id}
                      title={
                        <>
                          <MemberLink id={sub.user.id} name={sub.user.name} /> · {sub.plan.name}
                        </>
                      }
                      meta={`Ends ${formatDate(sub.endsAt)}`}
                      aside={`${daysUntil(sub.endsAt)}d left`}
                    />
                  ))}
                </AttentionGroup>
              )}
            </div>
          )}
        </Panel>
      </div>

      {/* ------------------------- timetable + activity ------------------------ */}
      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Panel
          title="Next up on the floor"
          description="The following seven days, busiest first to fill"
          action={
            <Link href="/admin/classes" className="text-xs font-medium text-brand hover:underline">
              Full timetable
            </Link>
          }
          bodyClassName="p-0 sm:p-0"
        >
          {upcomingSessions.length === 0 ? (
            <p className="p-5 text-sm text-ink-muted">
              Nothing scheduled in the next week. That is almost certainly a mistake —{" "}
              <Link href="/admin/classes" className="text-brand hover:underline">
                add sessions
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {upcomingSessions.slice(0, 7).map((session) => (
                <li key={session.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{session.title}</p>
                    <p className="truncate text-xs text-ink-faint">
                      {session.trainer.name} ·{" "}
                      {session.startsAt.toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      ·{" "}
                      {session.startsAt.toLocaleTimeString("en-IN", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <OccupancyMeter
                    filled={session.bookings.length}
                    capacity={session.capacity}
                    className="w-full sm:w-40"
                  />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent activity" description="Everything the club did today" bodyClassName="p-0 sm:p-0">
          <ol className="divide-y divide-border">
            {activity.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 px-4 py-2.5 sm:px-5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                <p className="min-w-0 flex-1 text-sm text-ink-muted">
                  {entry.text}
                  <span className="ml-2 text-xs text-ink-faint">{timeAgo(entry.at)}</span>
                </p>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      {/* -------------------------------- joiners ------------------------------ */}
      <Panel title="Newest members" description="Say hello on the floor" bodyClassName="p-4 sm:p-5">
        <ul className="flex flex-wrap gap-3">
          {activityMembers.map((user) => (
            <li key={user.id}>
              <Link
                href={`/admin/members/${user.id}`}
                className="flex min-h-11 items-center gap-2.5 rounded-full border border-border py-1.5 pr-4 pl-1.5 transition-colors hover:border-brand"
              >
                <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-bg-subtle text-[11px] font-semibold text-ink-muted">
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatarUrl} alt="" className="size-full object-cover" />
                  ) : (
                    initials(user.name)
                  )}
                </span>
                <span className="text-sm text-ink">{user.name}</span>
                <Badge tone="neutral">{timeAgo(user.createdAt)}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

/* ------------------------------ small pieces ------------------------------ */

function MemberLink({ id, name }: { id: string; name: string }) {
  return (
    <Link href={`/admin/members/${id}`} className="font-medium text-ink hover:text-brand">
      {name}
    </Link>
  );
}

function AttentionGroup({
  icon,
  title,
  href,
  linkLabel,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3 sm:px-5">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
        <Link href={href} className="ml-auto text-xs font-medium text-brand hover:underline">
          {linkLabel}
        </Link>
      </div>
      <ul className="mt-2 space-y-1.5">{children}</ul>
    </div>
  );
}

function AttentionRow({
  title,
  meta,
  aside,
}: {
  title: React.ReactNode;
  meta: string;
  aside: string;
}) {
  return (
    <li className="flex items-baseline gap-3">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-ink-muted">{title}</span>
        <span className="block truncate text-xs text-ink-faint">{meta}</span>
      </span>
      <span className="shrink-0 text-xs text-ink-faint tabular-nums">{aside}</span>
    </li>
  );
}
