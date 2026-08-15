import Link from "next/link";
import {
  ArrowUpRight,
  CalendarClock,
  Dumbbell,
  Flame,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatINR, intervalLabel, relativeDays } from "@/lib/utils";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@/components/ui";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader, StatTile } from "@/components/dashboard/primitives";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import {
  buildWeeklySeries,
  currentStreak,
  daysBetween,
  formatVolume,
  greeting,
  longestStreak,
  startOfMonth,
  startOfWeek,
} from "./stats";

export const metadata = { title: "Overview" };

export default async function DashboardOverview() {
  const user = await requireUser();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const windowStart = startOfWeek(now);
  windowStart.setDate(windowStart.getDate() - 11 * 7); // 12 weeks, this one included

  const [subscription, checkIns, workouts, monthTotals, bookings, plans] = await Promise.all([
    prisma.subscription.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      orderBy: { endsAt: "desc" },
      include: { plan: true },
    }),
    prisma.checkIn.findMany({
      where: { userId: user.id, at: { gte: windowStart } },
      select: { at: true },
      orderBy: { at: "asc" },
    }),
    prisma.workoutLog.findMany({
      where: { userId: user.id, date: { gte: windowStart } },
      select: { date: true, volumeKg: true, durationMin: true },
      orderBy: { date: "asc" },
    }),
    prisma.workoutLog.aggregate({
      where: { userId: user.id, date: { gte: monthStart } },
      _sum: { volumeKg: true, calories: true, durationMin: true },
      _count: { _all: true },
    }),
    prisma.booking.findMany({
      where: {
        userId: user.id,
        status: "BOOKED",
        classSession: { startsAt: { gte: now } },
      },
      include: { classSession: { include: { trainer: true } } },
      orderBy: { classSession: { startsAt: "asc" } },
      take: 3,
    }),
    prisma.plan.findMany({
      where: { active: true, internal: false },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const series = buildWeeklySeries(checkIns, workouts);
  const streak = currentStreak(checkIns);
  const best = longestStreak(checkIns);
  const sessionsThisMonth = monthTotals._count._all;
  const volume = formatVolume(monthTotals._sum.volumeKg ?? 0);
  const calories = monthTotals._sum.calories ?? 0;
  const minutes = monthTotals._sum.durationMin ?? 0;

  const daysLeft = subscription ? daysBetween(now, subscription.endsAt) : 0;
  const totalDays = subscription ? daysBetween(subscription.startsAt, subscription.endsAt) : 0;
  const elapsedPct = totalDays > 0 ? Math.min(100, Math.round(((totalDays - daysLeft) / totalDays) * 100)) : 0;
  const upgrade = subscription
    ? plans.find((p) => p.priceInPaise > subscription.plan.priceInPaise)
    : undefined;

  const monthName = new Intl.DateTimeFormat("en-IN", { month: "long" }).format(now);
  const firstName = user.name.split(" ")[0];

  return (
    <div className="flex flex-col gap-6 lg:gap-7">
      <PageHeader
        eyebrow={formatDate(now, "long")}
        title={
          <>
            {greeting()}, {firstName}.
          </>
        }
        lede={
          streak > 0
            ? `${streak} day${streak === 1 ? "" : "s"} on the trot. ${sessionsThisMonth} sessions logged in ${monthName} so far.`
            : "Nothing logged this week yet. The first session back is always the cheapest one to buy."
        }
        actions={
          <>
            <ButtonLink href="/dashboard/classes" variant="primary">
              Book a class
            </ButtonLink>
            <ButtonLink href="/dashboard/bookings" variant="outline">
              My bookings
            </ButtonLink>
          </>
        }
      />

      {/* ------------------------------ Stat tiles ----------------------------- */}
      <section aria-label="Your numbers" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile
          label="Current streak"
          value={streak}
          unit={streak === 1 ? "day" : "days"}
          context={best > streak ? `Your best run is ${best} days.` : "That's your best run so far."}
          icon={Flame}
          tone="brand"
          explain={
            <>
              Days in an unbroken row that you checked in and trained. Miss a day and it starts
              again from zero, so today counts only if you have already been in.
            </>
          }
        />
        <StatTile
          label={`Sessions in ${monthName}`}
          value={sessionsThisMonth}
          context={`${Math.round(minutes / 60)} hours on the floor.`}
          icon={CalendarClock}
          tone="clay"
          explain={
            <>
              Times you actually trained this month — every check-in at the door, whether it was a
              booked class or your own session on the floor.
            </>
          }
        />
        <StatTile
          label="Volume lifted"
          value={volume.value}
          unit={volume.unit}
          context={`Everything you moved in ${monthName}.`}
          icon={Dumbbell}
          tone="amber"
          explain={
            <>
              Total weight moved this month: for each set, the load multiplied by the reps, added
              up. It is the usual way to compare how hard two months of training actually were.
            </>
          }
        />
        <StatTile
          label="Calories burned"
          value={calories.toLocaleString("en-IN")}
          context="Estimated from session type and duration."
          icon={Timer}
          tone="sage"
          explain={
            <>
              An estimate for this month, worked out from how long each session ran and what kind
              of training it was. It is a guide, not a measurement — no wearable is involved.
            </>
          }
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] xl:gap-5">
        {/* ------------------------------ Left column --------------------------- */}
        <div className="flex flex-col gap-4 xl:gap-5">
          {/* Membership */}
          {subscription ? (
            <Card className="relative overflow-hidden">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-brand/10 blur-3xl"
              />
              <CardHeader className="relative flex-row items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.2em] text-ink-faint uppercase">
                    Your membership
                  </p>
                  <CardTitle className="mt-2 font-display text-2xl">
                    {subscription.plan.name}
                  </CardTitle>
                  <p className="mt-1.5 text-sm text-ink-muted">{subscription.plan.tagline}</p>
                </div>
                <Badge tone="success">Active</Badge>
              </CardHeader>

              <CardContent className="relative">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <p className="font-display text-3xl text-ink tabular-nums">
                    {formatINR(subscription.plan.priceInPaise)}
                    <span className="ml-1 text-sm font-medium text-ink-faint">
                      / {intervalLabel[subscription.plan.interval] ?? "month"}
                    </span>
                  </p>
                  <p className="text-right text-sm text-ink-muted">
                    Renews {formatDate(subscription.endsAt, "long")}
                    <span className="block text-xs text-ink-faint">
                      {relativeDays(subscription.endsAt)}
                    </span>
                  </p>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-baseline justify-between text-xs text-ink-muted">
                    <span>
                      <strong className="font-semibold text-ink tabular-nums">{daysLeft}</strong> days
                      left in this cycle
                    </span>
                    <span className="text-ink-faint tabular-nums">{elapsedPct}% used</span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-bg-subtle"
                    role="progressbar"
                    aria-valuenow={elapsedPct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Billing cycle progress"
                  >
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-brand to-amber"
                      style={{ width: `${elapsedPct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2.5">
                  <ButtonLink href={`/checkout/${subscription.plan.slug}`} size="sm" variant="outline">
                    Manage plan
                  </ButtonLink>
                  {upgrade ? (
                    <ButtonLink href={`/checkout/${upgrade.slug}`} size="sm" variant="primary">
                      Upgrade to {upgrade.name}
                      <ArrowUpRight className="size-4" aria-hidden />
                    </ButtonLink>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-5 sm:pt-6">
                <EmptyState
                  icon={<Sparkles className="size-7" aria-hidden />}
                  title="No active membership"
                  description="Your account is set up, but the floor is still locked. Pick a plan and you can book a class this evening."
                  action={
                    <ButtonLink href="/checkout" className="mt-2">
                      See the plans
                    </ButtonLink>
                  }
                />
              </CardContent>
            </Card>
          )}

          {/* Activity */}
          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Twelve weeks of work</CardTitle>
                <p className="mt-1 text-sm text-ink-muted">
                  Every bar is a week of check-ins. Consistency shows up here long before it shows up
                  anywhere else.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <ActivityChart data={series} />
            </CardContent>
          </Card>
        </div>

        {/* ----------------------------- Right column --------------------------- */}
        <div className="flex flex-col gap-4 xl:gap-5">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3">
              <CardTitle>Next up</CardTitle>
              <Link
                href="/dashboard/bookings"
                className="text-[13px] font-medium text-brand underline-offset-4 hover:underline"
              >
                All bookings
              </Link>
            </CardHeader>
            <CardContent>
              {bookings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
                  <p className="text-sm text-ink">Nothing booked yet.</p>
                  <p className="mt-1.5 text-[13px] text-ink-muted">
                    The 6:30am Strength Circuit is the most-booked hour on the timetable for a reason.
                  </p>
                  <ButtonLink href="/dashboard/classes" size="sm" variant="outline" className="mt-4">
                    Browse the timetable
                  </ButtonLink>
                </div>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {bookings.map(({ id, classSession }) => (
                    <li key={id}>
                      <Link
                        href="/dashboard/bookings"
                        className="flex items-center gap-3 rounded-xl border border-border bg-bg-subtle p-3 transition-colors duration-200 hover:border-brand"
                      >
                        <span className="grid size-11 shrink-0 flex-col place-items-center rounded-lg bg-surface text-center leading-none">
                          <span className="font-display text-[15px] text-ink">
                            {classSession.startsAt.getDate()}
                          </span>
                          <span className="mt-0.5 text-[9px] font-semibold tracking-wide text-ink-faint uppercase">
                            {new Intl.DateTimeFormat("en-IN", { month: "short" }).format(
                              classSession.startsAt,
                            )}
                          </span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">
                            {classSession.title}
                          </span>
                          <span className="block truncate text-xs text-ink-muted">
                            {formatDate(classSession.startsAt, "time")} · {classSession.trainer.name}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Goal */}
          <Card className="relative overflow-hidden bg-bg-subtle">
            <CardHeader className="flex-row items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-full bg-brand text-brand-ink">
                <Target className="size-4" aria-hidden />
              </span>
              <CardTitle>What you&rsquo;re training for</CardTitle>
            </CardHeader>
            <CardContent>
              {user.goal ? (
                <>
                  <p className="font-serif text-[22px] leading-snug text-ink italic">
                    &ldquo;{user.goal}&rdquo;
                  </p>
                  <p className="mt-4 text-[13px] leading-relaxed text-ink-muted">
                    Your coach reads this before every review. Change it whenever the target moves.
                  </p>
                  <Link
                    href="/dashboard/profile"
                    className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-brand underline-offset-4 hover:underline"
                  >
                    Edit goal
                    <ArrowUpRight className="size-3.5" aria-hidden />
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-sm leading-relaxed text-ink-muted">
                    You haven&rsquo;t set one. A goal makes the programming specific — &ldquo;get fitter&rdquo;
                    doesn&rsquo;t tell a coach anything, &ldquo;pull 140kg by March&rdquo; tells them
                    everything.
                  </p>
                  <ButtonLink href="/dashboard/profile" size="sm" variant="outline" className="mt-4">
                    Set a goal
                  </ButtonLink>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-brand/30 bg-brand-soft">
            <CardContent className="flex items-start gap-3 pt-5 sm:pt-6">
              <Flame className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
              <div>
                <p className="text-sm font-medium text-ink">Front desk</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">
                  Something hurting, or a booking you can&rsquo;t shift? Ask at the desk or ring{" "}
                  <a href="tel:+912266001100" className="font-medium text-brand underline-offset-4 hover:underline">
                    022 6600 1100
                  </a>
                  . Coaches answer between classes.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
