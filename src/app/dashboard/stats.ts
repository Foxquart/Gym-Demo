import type { ActivityWeek } from "@/components/dashboard/activity-chart";

/** Pure date/number helpers shared by the member pages. No I/O, no Prisma. */

export function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Weeks run Monday → Sunday, which is how the timetable reads. */
export function startOfWeek(date: Date) {
  const d = startOfDay(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

export function startOfMonth(date: Date) {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Late one";
}

const dayKey = (date: Date) => startOfDay(date).getTime();

/**
 * Consecutive days with at least one check-in, counting back from today.
 * A check-in today isn't required — nobody's streak should die at 6am.
 */
export function currentStreak(checkIns: { at: Date }[]) {
  if (checkIns.length === 0) return 0;
  const days = new Set(checkIns.map((c) => dayKey(c.at)));

  const cursor = startOfDay(new Date());
  if (!days.has(cursor.getTime())) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (days.has(cursor.getTime())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** The longest run of consecutive check-in days in the supplied window. */
export function longestStreak(checkIns: { at: Date }[]) {
  const days = [...new Set(checkIns.map((c) => dayKey(c.at)))].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let previous = 0;
  for (const day of days) {
    run = previous && day - previous === 86_400_000 ? run + 1 : 1;
    previous = day;
    if (run > best) best = run;
  }
  return best;
}

const dayMonth = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

/** Buckets check-ins and workouts into the last `weeks` Monday-start weeks. */
export function buildWeeklySeries(
  checkIns: { at: Date }[],
  workouts: { date: Date; volumeKg: number; durationMin: number }[],
  weeks = 12,
): ActivityWeek[] {
  const latest = startOfWeek(new Date());

  const buckets = Array.from({ length: weeks }, (_, i) => {
    const start = new Date(latest);
    start.setDate(start.getDate() - (weeks - 1 - i) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { start, end, sessions: 0, volumeKg: 0, minutes: 0 };
  });

  const bucketFor = (date: Date) => {
    const week = startOfWeek(date).getTime();
    return buckets.find((b) => b.start.getTime() === week);
  };

  for (const checkIn of checkIns) {
    const bucket = bucketFor(checkIn.at);
    if (bucket) bucket.sessions += 1;
  }
  for (const workout of workouts) {
    const bucket = bucketFor(workout.date);
    if (!bucket) continue;
    bucket.volumeKg += workout.volumeKg;
    bucket.minutes += workout.durationMin;
  }

  return buckets.map((b) => ({
    week: dayMonth.format(b.start),
    range: `${dayMonth.format(b.start)} – ${dayMonth.format(b.end)}`,
    sessions: b.sessions,
    volumeKg: b.volumeKg,
    minutes: b.minutes,
  }));
}

/** 128,400 kg reads badly on a tile; 128.4 t reads like a coach said it. */
export function formatVolume(kg: number) {
  if (kg >= 100_000) return { value: (kg / 1000).toFixed(1), unit: "tonnes" };
  if (kg >= 1000) return { value: (kg / 1000).toFixed(1), unit: "t" };
  return { value: String(kg), unit: "kg" };
}

export function daysBetween(from: Date, to: Date) {
  return Math.max(0, Math.ceil((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86_400_000));
}
