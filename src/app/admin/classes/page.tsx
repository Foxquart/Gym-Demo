import { Suspense } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, initials } from "@/lib/utils";
import { Badge, EmptyState } from "@/components/ui";
import { DataTable, buildHref, type Column } from "@/components/admin/data-table";
import { OccupancyMeter, Panel, StatTile } from "@/components/admin/tiles";
import {
  BOOKING_TONE,
  INTENSITY_LABEL,
  addDays,
  startOfWeek,
  timeAgo,
  toDateTimeLocal,
} from "@/components/admin/format";
import {
  BookingStatusActions,
  ClassRowActions,
  NewClassButton,
  type ClassRecord,
  type TrainerOption,
} from "@/components/admin/class-manager";
import { cn } from "@/lib/utils";

export const metadata = { title: "Timetable" };

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const INTENSITY_TONE: Record<string, "neutral" | "success" | "amber" | "danger" | "brand"> = {
  LOW: "success",
  MODERATE: "neutral",
  HIGH: "amber",
  ELITE: "danger",
};

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string; session?: string; trainer?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;

  const weekOffset = Number(params.week ?? 0) || 0;
  const weekStart = addDays(startOfWeek(), weekOffset * 7);
  const weekEnd = addDays(weekStart, 7);

  const [trainers, sessions, weekCount, upcomingTotal] = await Promise.all([
    prisma.trainer.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, specialty: true },
    }),
    prisma.classSession.findMany({
      where: {
        startsAt: { gte: weekStart, lt: weekEnd },
        ...(params.trainer ? { trainerId: params.trainer } : {}),
      },
      orderBy: { startsAt: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        trainerId: true,
        startsAt: true,
        durationMin: true,
        capacity: true,
        intensity: true,
        imageUrl: true,
        trainer: { select: { id: true, name: true } },
        bookings: { where: { status: { not: "CANCELLED" } }, select: { id: true } },
      },
    }),
    prisma.classSession.count({ where: { startsAt: { gte: weekStart, lt: weekEnd } } }),
    prisma.classSession.count({ where: { startsAt: { gte: new Date() } } }),
  ]);

  const roster = params.session
    ? await prisma.classSession.findUnique({
        where: { id: params.session },
        select: {
          id: true,
          title: true,
          startsAt: true,
          capacity: true,
          durationMin: true,
          trainer: { select: { name: true } },
          bookings: {
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              status: true,
              createdAt: true,
              user: { select: { id: true, name: true, email: true, avatarUrl: true } },
            },
          },
        },
      })
    : null;

  const totalCapacity = sessions.reduce((sum, s) => sum + s.capacity, 0);
  const totalBooked = sessions.reduce((sum, s) => sum + s.bookings.length, 0);
  const fillRate = totalCapacity === 0 ? 0 : Math.round((totalBooked / totalCapacity) * 100);
  const fullest = [...sessions].sort(
    (a, b) => b.bookings.length / b.capacity - a.bookings.length / a.capacity,
  )[0];

  const query: Record<string, string | undefined> = {
    week: params.week,
    session: params.session,
    trainer: params.trainer,
  };

  const toRecord = (session: (typeof sessions)[number]): ClassRecord => ({
    id: session.id,
    title: session.title,
    description: session.description,
    trainerId: session.trainerId,
    startsAtLocal: toDateTimeLocal(session.startsAt),
    durationMin: session.durationMin,
    capacity: session.capacity,
    intensity: session.intensity,
    imageUrl: session.imageUrl,
    bookedCount: session.bookings.length,
  });

  const trainerOptions: TrainerOption[] = trainers;
  const defaultStart = toDateTimeLocal(
    (() => {
      const d = new Date(weekStart);
      d.setHours(7, 0, 0, 0);
      return d;
    })(),
  );

  type Row = (typeof sessions)[number];
  const columns: Column<Row>[] = [
    {
      key: "session",
      header: "Session",
      primary: true,
      cell: (row) => (
        <Link
          href={buildHref("/admin/classes", query, { session: row.id })}
          scroll={false}
          className="block min-w-0"
        >
          <span className="block font-medium text-ink hover:text-brand">{row.title}</span>
          <span className="block truncate text-xs text-ink-faint">{row.description}</span>
        </Link>
      ),
    },
    {
      key: "when",
      header: "When",
      cell: (row) => (
        <span>
          <span className="block text-ink">
            {row.startsAt.toLocaleDateString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </span>
          <span className="block text-xs text-ink-faint tabular-nums">
            {row.startsAt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })} ·{" "}
            {row.durationMin} min
          </span>
        </span>
      ),
    },
    {
      key: "trainer",
      header: "Coach",
      cell: (row) => <span className="text-ink-muted">{row.trainer.name}</span>,
    },
    {
      key: "intensity",
      header: "Intensity",
      cell: (row) => (
        <Badge tone={INTENSITY_TONE[row.intensity]}>{INTENSITY_LABEL[row.intensity]}</Badge>
      ),
    },
    {
      key: "occupancy",
      header: "Booked",
      width: "12rem",
      cell: (row) => <OccupancyMeter filled={row.bookings.length} capacity={row.capacity} />,
    },
    {
      key: "actions",
      header: "Actions",
      actions: true,
      width: "11rem",
      cell: (row) => (
        <ClassRowActions
          session={toRecord(row)}
          trainers={trainerOptions}
          defaultStart={defaultStart}
        />
      ),
    },
  ];

  const weekLabel =
    weekOffset === 0
      ? "This week"
      : weekOffset === 1
        ? "Next week"
        : weekOffset === -1
          ? "Last week"
          : `${formatDate(weekStart)} – ${formatDate(addDays(weekEnd, -1))}`;

  return (
    <div className="space-y-5">
      <section aria-label="Timetable summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Sessions this week" value={String(weekCount)} hint={`${upcomingTotal} upcoming in total`} />
        <StatTile label="Spots booked" value={`${totalBooked}/${totalCapacity}`} hint="Across the visible week" />
        <StatTile
          label="Fill rate"
          value={`${fillRate}%`}
          hint={fillRate >= 80 ? "Consider adding a session" : "Room to grow"}
          tone={fillRate >= 90 ? "warn" : "neutral"}
        />
        <StatTile
          label="Busiest session"
          value={fullest ? `${fullest.bookings.length}/${fullest.capacity}` : "—"}
          hint={fullest?.title ?? "Nothing scheduled"}
        />
      </section>

      {/* ------------------------------ week nav ------------------------------ */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Link
            href={buildHref("/admin/classes", query, {
              week: String(weekOffset - 1),
              session: undefined,
            })}
            aria-label="Previous week"
            className="grid size-11 place-items-center rounded-xl border border-border text-ink-muted transition-colors hover:border-brand hover:text-brand"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Link>
          <Link
            href={buildHref("/admin/classes", query, { week: undefined, session: undefined })}
            className={cn(
              "grid h-11 place-items-center rounded-xl border border-border px-4 text-sm transition-colors hover:border-brand",
              weekOffset === 0 ? "border-brand text-brand" : "text-ink-muted",
            )}
          >
            Today
          </Link>
          <Link
            href={buildHref("/admin/classes", query, {
              week: String(weekOffset + 1),
              session: undefined,
            })}
            aria-label="Next week"
            className="grid size-11 place-items-center rounded-xl border border-border text-ink-muted transition-colors hover:border-brand hover:text-brand"
          >
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div>
          <p className="font-display text-lg leading-none tracking-tight text-ink">{weekLabel}</p>
          <p className="mt-1 text-xs text-ink-faint">
            {formatDate(weekStart)} – {formatDate(addDays(weekEnd, -1))}
          </p>
        </div>
        <div className="ml-auto">
          <Suspense fallback={null}>
            <NewClassButton trainers={trainerOptions} defaultStart={defaultStart} />
          </Suspense>
        </div>
      </div>

      {/* ------------------------------ week grid ----------------------------- */}
      <section
        aria-label="Week view"
        className="overflow-x-auto rounded-[var(--radius-card)] border border-border bg-surface p-3"
      >
        <div className="grid min-w-[56rem] grid-cols-7 gap-2">
          {DAY_NAMES.map((dayName, i) => {
            const day = addDays(weekStart, i);
            const isToday = day.toDateString() === new Date().toDateString();
            const daySessions = sessions.filter(
              (s) => s.startsAt.toDateString() === day.toDateString(),
            );
            return (
              <div key={dayName} className="min-w-0">
                <div
                  className={cn(
                    "mb-2 rounded-lg px-2 py-1.5 text-center",
                    isToday ? "bg-brand-soft" : "bg-bg-subtle",
                  )}
                >
                  <p
                    className={cn(
                      "text-[10px] font-semibold tracking-[0.14em] uppercase",
                      isToday ? "text-brand" : "text-ink-faint",
                    )}
                  >
                    {dayName}
                  </p>
                  <p className={cn("text-sm tabular-nums", isToday ? "text-brand" : "text-ink")}>
                    {day.getDate()}
                  </p>
                </div>
                <ul className="space-y-2">
                  {daySessions.map((session) => {
                    const selected = params.session === session.id;
                    return (
                      <li key={session.id}>
                        <Link
                          href={buildHref("/admin/classes", query, { session: session.id })}
                          scroll={false}
                          className={cn(
                            "block rounded-xl border p-2 transition-colors",
                            selected
                              ? "border-brand bg-brand-soft"
                              : "border-border bg-bg-subtle/50 hover:border-border-strong",
                          )}
                        >
                          <p className="text-[11px] text-ink-faint tabular-nums">
                            {session.startsAt.toLocaleTimeString("en-IN", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="mt-0.5 truncate text-[13px] font-medium text-ink">
                            {session.title}
                          </p>
                          <p className="truncate text-[11px] text-ink-faint">
                            {session.trainer.name}
                          </p>
                          <OccupancyMeter
                            filled={session.bookings.length}
                            capacity={session.capacity}
                            className="mt-2"
                            showLabel={false}
                          />
                          <p className="mt-1 text-[10px] text-ink-faint tabular-nums">
                            {session.bookings.length}/{session.capacity} booked
                          </p>
                        </Link>
                      </li>
                    );
                  })}
                  {daySessions.length === 0 && (
                    <li className="rounded-xl border border-dashed border-border px-2 py-4 text-center text-[11px] text-ink-faint">
                      Rest day
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* -------------------------------- roster ------------------------------ */}
      {roster && (
        <Panel
          title={`Roster · ${roster.title}`}
          description={`${roster.trainer.name} · ${roster.startsAt.toLocaleString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            hour: "numeric",
            minute: "2-digit",
          })} · ${roster.durationMin} min`}
          action={
            <Link
              href={buildHref("/admin/classes", query, { session: undefined })}
              scroll={false}
              aria-label="Close roster"
              className="grid size-11 place-items-center rounded-lg text-ink-faint hover:text-ink"
            >
              <X className="size-4" aria-hidden />
            </Link>
          }
          bodyClassName="p-0 sm:p-0"
        >
          <div className="border-b border-border px-4 py-3 sm:px-5">
            <OccupancyMeter
              filled={roster.bookings.filter((b) => b.status !== "CANCELLED").length}
              capacity={roster.capacity}
            />
            <p className="mt-2 text-xs text-ink-faint">
              {roster.capacity - roster.bookings.filter((b) => b.status !== "CANCELLED").length}{" "}
              spots still open.
            </p>
          </div>
          {roster.bookings.length === 0 ? (
            <p className="p-5 text-sm text-ink-muted">
              Nobody has booked this one yet. Sessions usually fill in the 48 hours before they run.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {roster.bookings.map((booking) => (
                <li
                  key={booking.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-2.5 sm:px-5"
                >
                  <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-bg-subtle text-[11px] font-semibold text-ink-muted">
                    {booking.user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={booking.user.avatarUrl} alt="" className="size-full object-cover" />
                    ) : (
                      initials(booking.user.name)
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <Link
                      href={`/admin/members/${booking.user.id}`}
                      className="block truncate text-sm font-medium text-ink hover:text-brand"
                    >
                      {booking.user.name}
                    </Link>
                    <span className="block truncate text-xs text-ink-faint">
                      {booking.user.email} · booked {timeAgo(booking.createdAt)}
                    </span>
                  </span>
                  <Badge tone={BOOKING_TONE[booking.status]}>{booking.status.toLowerCase()}</Badge>
                  <BookingStatusActions bookingId={booking.id} status={booking.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {/* -------------------------------- table ------------------------------- */}
      <DataTable
        columns={columns}
        rows={sessions}
        rowKey={(row) => row.id}
        caption="Class sessions for the selected week with coach, intensity and occupancy"
        empty={
          <EmptyState
            icon={<CalendarDays className="size-7" />}
            title="Nothing scheduled this week"
            description="An empty week means no bookings and no revenue. Add a session, or step forward to a week you have already planned."
          />
        }
      />
    </div>
  );
}
