import Link from "next/link";
import { CalendarX2 } from "lucide-react";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cn, formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui";
import { ButtonLink } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/primitives";
import { ClassCard, type ClassCardData } from "@/components/dashboard/class-card";
import { startOfDay } from "../stats";

export const metadata = { title: "Class timetable" };

const INTENSITIES = ["LOW", "MODERATE", "HIGH", "ELITE"] as const;
type Intensity = (typeof INTENSITIES)[number];

const intensityCopy: Record<Intensity, string> = {
  LOW: "Low",
  MODERATE: "Moderate",
  HIGH: "High",
  ELITE: "Elite",
};

/** Local-time YYYY-MM-DD — the day chips have to match the member's calendar. */
function dayKey(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDayKey(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

function FilterChip({
  href,
  active,
  children,
  className,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border px-4 text-[13px] whitespace-nowrap transition-colors duration-200",
        active
          ? "border-brand bg-brand text-brand-ink"
          : "border-border bg-surface text-ink-muted hover:border-brand-hover hover:text-brand",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string; intensity?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const intensity = INTENSITIES.includes(params.intensity as Intensity)
    ? (params.intensity as Intensity)
    : null;
  const day = params.day ? parseDayKey(params.day) : null;

  const now = new Date();

  // Every upcoming session, used to build the day strip regardless of filters.
  const allUpcoming = await prisma.classSession.findMany({
    where: { startsAt: { gte: now } },
    select: { startsAt: true },
    orderBy: { startsAt: "asc" },
  });

  const dayOptions: Date[] = [];
  const seen = new Set<string>();
  for (const session of allUpcoming) {
    const key = dayKey(session.startsAt);
    if (!seen.has(key)) {
      seen.add(key);
      dayOptions.push(startOfDay(session.startsAt));
    }
  }

  const startsAt: { gte: Date; lt?: Date } = { gte: now };
  if (day) {
    const end = new Date(day);
    end.setDate(end.getDate() + 1);
    startsAt.gte = day > now ? day : now;
    startsAt.lt = end;
  }

  const sessions = await prisma.classSession.findMany({
    where: { startsAt, ...(intensity ? { intensity } : {}) },
    include: { trainer: true },
    orderBy: { startsAt: "asc" },
  });

  // Live spots-left: capacity minus everyone currently holding a BOOKED row.
  const ids = sessions.map((s) => s.id);
  const [counts, mine] = await Promise.all([
    prisma.booking.groupBy({
      by: ["classSessionId"],
      where: { classSessionId: { in: ids }, status: "BOOKED" },
      _count: { _all: true },
    }),
    prisma.booking.findMany({
      where: { userId: user.id, classSessionId: { in: ids }, status: "BOOKED" },
      select: { classSessionId: true },
    }),
  ]);

  const takenBy = new Map(counts.map((c) => [c.classSessionId, c._count._all]));
  const bookedByMe = new Set(mine.map((b) => b.classSessionId));

  const cards: ClassCardData[] = sessions.map((session) => ({
    id: session.id,
    title: session.title,
    description: session.description,
    dayLabel: new Intl.DateTimeFormat("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "short",
    }).format(session.startsAt),
    timeLabel: formatDate(session.startsAt, "time"),
    durationMin: session.durationMin,
    capacity: session.capacity,
    spotsTaken: takenBy.get(session.id) ?? 0,
    intensity: session.intensity,
    imageUrl: session.imageUrl,
    trainerName: session.trainer.name,
    trainerImage: session.trainer.imageUrl,
    booked: bookedByMe.has(session.id),
    past: session.startsAt.getTime() <= now.getTime(),
  }));

  const base = "/dashboard/classes";
  const linkFor = (next: { day?: string | null; intensity?: string | null }) => {
    const query = new URLSearchParams();
    const nextDay = next.day === undefined ? (day ? dayKey(day) : null) : next.day;
    const nextIntensity = next.intensity === undefined ? intensity : next.intensity;
    if (nextDay) query.set("day", nextDay);
    if (nextIntensity) query.set("intensity", nextIntensity);
    const qs = query.toString();
    return qs ? `${base}?${qs}` : base;
  };

  const spotsOpen = cards.filter((c) => c.capacity - c.spotsTaken > 0 && !c.booked).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Timetable"
        title="What's on"
        lede={`Two weeks of sessions, capped small on purpose. ${spotsOpen} of the ${cards.length} sessions showing still have room.`}
        actions={
          <ButtonLink href="/dashboard/bookings" variant="outline">
            My bookings
          </ButtonLink>
        }
      />

      {/* --------------------------------- Filters -------------------------------- */}
      <section aria-label="Filter the timetable" className="flex flex-col gap-3">
        <div>
          <h2 className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-ink-faint uppercase">
            Day
          </h2>
          <div className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:flex-wrap lg:overflow-x-visible">
            <FilterChip href={linkFor({ day: null })} active={!day}>
              All days
            </FilterChip>
            {dayOptions.map((option) => {
              const key = dayKey(option);
              const active = Boolean(day && dayKey(day) === key);
              return (
                <FilterChip key={key} href={linkFor({ day: key })} active={active}>
                  <span className="font-medium">
                    {new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(option)}
                  </span>
                  <span className={active ? "opacity-80" : "text-ink-faint"}>
                    {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(option)}
                  </span>
                </FilterChip>
              );
            })}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-[11px] font-semibold tracking-[0.16em] text-ink-faint uppercase">
            Intensity
          </h2>
          <div className="hide-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:flex-wrap lg:overflow-x-visible">
            <FilterChip href={linkFor({ intensity: null })} active={!intensity}>
              Everything
            </FilterChip>
            {INTENSITIES.map((level) => (
              <FilterChip
                key={level}
                href={linkFor({ intensity: level })}
                active={intensity === level}
              >
                {intensityCopy[level]}
              </FilterChip>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------- Results -------------------------------- */}
      {cards.length === 0 ? (
        <EmptyState
          icon={<CalendarX2 className="size-7" aria-hidden />}
          title="Nothing matches that combination"
          description="Try a different day, or drop the intensity filter. The timetable refreshes every Sunday night."
          action={
            <ButtonLink href={base} size="sm" variant="outline" className="mt-2">
              Clear filters
            </ButtonLink>
          }
        />
      ) : (
        <section
          aria-label="Upcoming classes"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
        >
          {cards.map((session) => (
            <ClassCard key={session.id} session={session} />
          ))}
        </section>
      )}
    </div>
  );
}
