import { CalendarCheck, Clock, MapPin } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, relativeDays } from "@/lib/utils";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@/components/ui";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/primitives";
import { CancelBookingButton } from "@/components/dashboard/cancel-booking";

export const metadata = { title: "My bookings" };

type Row = {
  id: string;
  status: "BOOKED" | "CANCELLED" | "ATTENDED";
  classSession: {
    title: string;
    startsAt: Date;
    durationMin: number;
    trainer: { name: string; specialty: string };
  };
};

function DateBlock({ date }: { date: Date }) {
  return (
    <div className="grid size-14 shrink-0 place-content-center rounded-xl border border-border bg-bg-subtle text-center">
      <span className="text-[10px] font-semibold tracking-[0.12em] text-ink-faint uppercase">
        {new Intl.DateTimeFormat("en-IN", { month: "short" }).format(date)}
      </span>
      <span className="font-display text-xl leading-none text-ink">{date.getDate()}</span>
    </div>
  );
}

function BookingRow({ booking, upcoming }: { booking: Row; upcoming: boolean }) {
  const { classSession: session } = booking;

  return (
    <li className="flex flex-wrap items-center gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-4 transition-shadow duration-300 hover:shadow-[var(--shadow-sm)]">
      <DateBlock date={session.startsAt} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-display text-base leading-tight text-ink">{session.title}</h3>
          {booking.status === "CANCELLED" ? (
            <Badge tone="neutral">Cancelled</Badge>
          ) : booking.status === "ATTENDED" ? (
            <Badge tone="success">Attended</Badge>
          ) : upcoming ? (
            <Badge tone="brand">{relativeDays(session.startsAt)}</Badge>
          ) : (
            <Badge tone="neutral">Missed</Badge>
          )}
        </div>

        <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5 text-ink-faint" aria-hidden />
            {formatDate(session.startsAt)} · {formatDate(session.startsAt, "time")} ·{" "}
            {session.durationMin} min
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-3.5 text-ink-faint" aria-hidden />
            {session.trainer.name} — {session.trainer.specialty}
          </span>
        </p>
      </div>

      {upcoming && booking.status === "BOOKED" ? (
        <CancelBookingButton bookingId={booking.id} title={session.title} />
      ) : null}
    </li>
  );
}

export default async function BookingsPage() {
  const user = await requireUser();
  const now = new Date();

  const bookings = await prisma.booking.findMany({
    where: { userId: user.id },
    include: {
      classSession: {
        include: { trainer: { select: { name: true, specialty: true } } },
      },
    },
    orderBy: { classSession: { startsAt: "desc" } },
  });

  const upcoming = bookings
    .filter((b) => b.status === "BOOKED" && b.classSession.startsAt >= now)
    .sort((a, b) => a.classSession.startsAt.getTime() - b.classSession.startsAt.getTime());

  const past = bookings.filter((b) => !upcoming.includes(b));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Bookings"
        title="Your spots"
        lede={
          upcoming.length > 0
            ? `${upcoming.length} session${upcoming.length === 1 ? "" : "s"} held. Cancel by the night before and someone on the floor gets the place.`
            : "Nothing held right now. The timetable runs two weeks ahead."
        }
        actions={
          <ButtonLink href="/dashboard/classes" variant="primary">
            Book a class
          </ButtonLink>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Coming up</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck className="size-7" aria-hidden />}
              title="No sessions booked"
              description="Pick something from the timetable — Restore & Range on a Tuesday morning is a good place to start if you're easing back in."
              action={
                <ButtonLink href="/dashboard/classes" size="sm" className="mt-2">
                  See what&rsquo;s on
                </ButtonLink>
              }
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {upcoming.map((booking) => (
                <BookingRow key={booking.id} booking={booking} upcoming />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
          <p className="text-sm text-ink-muted">
            Everything you&rsquo;ve booked before, including the ones you called off.
          </p>
        </CardHeader>
        <CardContent>
          {past.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-ink-muted">
              Nothing here yet. Your first completed session shows up the day after.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {past.map((booking) => (
                <BookingRow key={booking.id} booking={booking} upcoming={false} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
