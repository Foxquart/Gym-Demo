import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Flame, Mail, Phone, Target } from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatINR, initials, intervalLabel } from "@/lib/utils";
import { Badge, EmptyState } from "@/components/ui";
import { DataTable, type Column } from "@/components/admin/data-table";
import { Panel, StatTile } from "@/components/admin/tiles";
import {
  BOOKING_TONE,
  PAYMENT_TONE,
  SUBSCRIPTION_TONE,
  daysUntil,
  startOfDay,
  timeAgo,
} from "@/components/admin/format";
import {
  DeleteMemberAction,
  ExtendAction,
  RoleAction,
  SubscriptionStateAction,
} from "@/components/admin/member-actions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id }, select: { name: true } });
  return { title: user?.name ?? "Member" };
}

/** Consecutive days with at least one check-in, counting back from today. */
function checkInStreak(dates: Date[]) {
  if (dates.length === 0) return 0;
  const days = new Set(dates.map((d) => startOfDay(d).getTime()));
  const today = startOfDay().getTime();
  const DAY = 86_400_000;
  // Yesterday still counts — nobody trains before they open the admin portal.
  let cursor = days.has(today) ? today : today - DAY;
  if (!days.has(cursor)) return 0;
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor -= DAY;
  }
  return streak;
}

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      goal: true,
      avatarUrl: true,
      createdAt: true,
      subscriptions: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          startsAt: true,
          endsAt: true,
          plan: { select: { name: true, priceInPaise: true, interval: true } },
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amountInPaise: true,
          status: true,
          method: true,
          failureReason: true,
          razorpayOrderId: true,
          razorpayPaymentId: true,
          createdAt: true,
          plan: { select: { name: true } },
        },
      },
      bookings: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          createdAt: true,
          classSession: {
            select: { id: true, title: true, startsAt: true, trainer: { select: { name: true } } },
          },
        },
      },
      checkIns: { orderBy: { at: "desc" }, take: 400, select: { id: true, at: true } },
      _count: { select: { payments: true, bookings: true, checkIns: true, workouts: true } },
    },
  });

  if (!user) notFound();

  const current = user.subscriptions.find((s) => s.status === "ACTIVE") ?? user.subscriptions[0];
  const lifetime = user.payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amountInPaise, 0);
  const streak = checkInStreak(user.checkIns.map((c) => c.at));
  const last30 = user.checkIns.filter(
    (c) => c.at.getTime() > Date.now() - 30 * 86_400_000,
  ).length;

  type Sub = (typeof user.subscriptions)[number];
  const subColumns: Column<Sub>[] = [
    {
      key: "plan",
      header: "Plan",
      primary: true,
      cell: (row) => (
        <span>
          <span className="block font-medium text-ink">{row.plan.name}</span>
          <span className="block text-xs text-ink-faint">
            {formatINR(row.plan.priceInPaise)} / {intervalLabel[row.plan.interval]}
          </span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <Badge tone={SUBSCRIPTION_TONE[row.status]}>{row.status.toLowerCase()}</Badge>,
    },
    { key: "start", header: "Started", cell: (row) => formatDate(row.startsAt) },
    {
      key: "end",
      header: "Ends",
      cell: (row) => (
        <span>
          {formatDate(row.endsAt)}
          {row.status === "ACTIVE" && (
            <span className="ml-2 text-xs text-ink-faint">
              {daysUntil(row.endsAt) > 0 ? `${daysUntil(row.endsAt)}d left` : "lapsed"}
            </span>
          )}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      actions: true,
      cell: (row) => (
        <span className="flex items-center justify-end gap-2">
          <ExtendAction subscriptionId={row.id} planName={row.plan.name} />
          <SubscriptionStateAction
            subscriptionId={row.id}
            status={row.status}
            planName={row.plan.name}
          />
        </span>
      ),
    },
  ];

  type Pay = (typeof user.payments)[number];
  const paymentColumns: Column<Pay>[] = [
    {
      key: "amount",
      header: "Amount",
      primary: true,
      numeric: true,
      cell: (row) => <span className="font-medium text-ink">{formatINR(row.amountInPaise)}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <span className="flex flex-col items-start gap-1">
          <Badge tone={PAYMENT_TONE[row.status]}>{row.status.toLowerCase()}</Badge>
          {row.failureReason && (
            <span className="text-xs text-danger">{row.failureReason}</span>
          )}
        </span>
      ),
    },
    { key: "plan", header: "For", cell: (row) => row.plan?.name ?? "—" },
    { key: "method", header: "Method", cell: (row) => row.method ?? "—" },
    {
      key: "ref",
      header: "Razorpay",
      cell: (row) => (
        <span className="block font-mono text-[11px] text-ink-faint">
          <span className="block">{row.razorpayOrderId}</span>
          {row.razorpayPaymentId && <span className="block">{row.razorpayPaymentId}</span>}
        </span>
      ),
    },
    { key: "date", header: "Date", numeric: true, cell: (row) => formatDate(row.createdAt) },
  ];

  type Book = (typeof user.bookings)[number];
  const bookingColumns: Column<Book>[] = [
    {
      key: "class",
      header: "Session",
      primary: true,
      cell: (row) => (
        <span>
          <span className="block font-medium text-ink">{row.classSession.title}</span>
          <span className="block text-xs text-ink-faint">
            {row.classSession.trainer.name} ·{" "}
            {row.classSession.startsAt.toLocaleString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <Badge tone={BOOKING_TONE[row.status]}>{row.status.toLowerCase()}</Badge>,
    },
    { key: "booked", header: "Booked", numeric: true, cell: (row) => timeAgo(row.createdAt) },
  ];

  return (
    <div className="space-y-5">
      <Link
        href="/admin/members"
        className="inline-flex min-h-11 items-center gap-2 text-sm text-ink-muted hover:text-brand"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All members
      </Link>

      {/* -------------------------------- profile ------------------------------- */}
      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-start gap-4">
          <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-bg-subtle text-lg font-semibold text-ink-muted">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              initials(user.name)
            )}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-display text-2xl tracking-tight text-ink">{user.name}</h2>
              {user.role === "ADMIN" ? <Badge tone="brand">Admin</Badge> : <Badge>Member</Badge>}
              {current && (
                <Badge tone={SUBSCRIPTION_TONE[current.status]}>
                  {current.plan.name} · {current.status.toLowerCase()}
                </Badge>
              )}
            </div>
            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm text-ink-muted">
              <div className="flex items-center gap-2">
                <dt className="sr-only">Email</dt>
                <Mail className="size-4 text-ink-faint" aria-hidden />
                <dd>
                  <a href={`mailto:${user.email}`} className="hover:text-brand">
                    {user.email}
                  </a>
                </dd>
              </div>
              {user.phone && (
                <div className="flex items-center gap-2">
                  <dt className="sr-only">Phone</dt>
                  <Phone className="size-4 text-ink-faint" aria-hidden />
                  <dd>
                    <a href={`tel:${user.phone}`} className="hover:text-brand">
                      {user.phone}
                    </a>
                  </dd>
                </div>
              )}
              {user.goal && (
                <div className="flex items-center gap-2">
                  <dt className="sr-only">Goal</dt>
                  <Target className="size-4 text-ink-faint" aria-hidden />
                  <dd className="italic">{user.goal}</dd>
                </div>
              )}
            </dl>
            <p className="mt-2 text-xs text-ink-faint">
              Joined {formatDate(user.createdAt, "long")} · {timeAgo(user.createdAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <RoleAction
              userId={user.id}
              name={user.name}
              role={user.role}
              isSelf={user.id === admin.id}
            />
            <DeleteMemberAction
              userId={user.id}
              name={user.name}
              counts={{
                payments: user._count.payments,
                bookings: user._count.bookings,
                checkIns: user._count.checkIns,
              }}
            />
          </div>
        </div>
      </section>

      {/* --------------------------------- stats -------------------------------- */}
      <section aria-label="Member numbers" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Lifetime value"
          value={formatINR(lifetime)}
          hint={`${user._count.payments} payment${user._count.payments === 1 ? "" : "s"} on record`}
          explain={
            <>
              Every rupee this member has successfully paid us, added up across all their
              memberships. Failed and refunded payments are excluded.
            </>
          }
        />
        <StatTile
          label="Check-in streak"
          value={`${streak} ${streak === 1 ? "day" : "days"}`}
          hint={streak === 0 ? "Not in this week" : "Consecutive training days"}
          icon={Flame}
          explain={
            <>
              How many days in a row they have turned up. A useful churn signal: a streak that
              collapses to zero is often the month before someone cancels.
            </>
          }
        />
        <StatTile
          label="Check-ins, 30 days"
          value={String(last30)}
          hint={`${user._count.checkIns} all time`}
          explain={
            <>
              Visits to the gym in the last 30 days — one per day they scanned in at the door,
              regardless of what they trained.
            </>
          }
        />
        <StatTile
          label="Sessions booked"
          value={String(user._count.bookings)}
          hint={`${user._count.workouts} workouts logged`}
          explain={
            <>
              Places this member has reserved in <strong>coached group classes</strong> — the
              timetable slots on <em>Classes</em>, like Barbell Foundations or Engine Room. It
              counts reservations they made, not attendance, and it does not include turning up to
              train on their own.
            </>
          }
        />
      </section>

      {/* ----------------------------- subscriptions ---------------------------- */}
      <Panel
        title="Subscription history"
        description="Extend when you owe someone time, cancel when they ask"
        bodyClassName="p-0 sm:p-0"
      >
        <DataTable
          columns={subColumns}
          rows={user.subscriptions}
          rowKey={(row) => row.id}
          caption={`Subscriptions for ${user.name}`}
          empty={
            <EmptyState
              title="No membership yet"
              description="This account has never checked out. They can still be booked in manually by a coach."
            />
          }
        />
      </Panel>

      {/* -------------------------------- payments ------------------------------ */}
      <Panel
        title="Payments"
        description="Straight from Razorpay, newest first"
        bodyClassName="p-0 sm:p-0"
      >
        <DataTable
          columns={paymentColumns}
          rows={user.payments}
          rowKey={(row) => row.id}
          caption={`Payment history for ${user.name}`}
          empty={<EmptyState title="Nothing billed yet" description="No orders have been created for this account." />}
        />
      </Panel>

      {/* -------------------------------- bookings ------------------------------ */}
      <Panel title="Bookings" description="Classes taken and classes coming up" bodyClassName="p-0 sm:p-0">
        <DataTable
          columns={bookingColumns}
          rows={user.bookings}
          rowKey={(row) => row.id}
          caption={`Class bookings for ${user.name}`}
          empty={
            <EmptyState
              title="Never booked a class"
              description="Worth a nudge — members who take classes stay roughly twice as long."
            />
          }
        />
      </Panel>
    </div>
  );
}
