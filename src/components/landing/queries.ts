import "server-only";

import { prisma } from "@/lib/prisma";
import type { IntensityKey } from "./intensity";

const IST = "Asia/Kolkata";
const DAY_MS = 86_400_000;

export type { IntensityKey };

export type TimetableRow = {
  id: string;
  title: string;
  description: string;
  time: string;
  durationMin: number;
  capacity: number;
  spotsLeft: number;
  intensity: IntensityKey;
  trainerName: string;
  trainerSlug: string;
};

export type TimetableDay = {
  key: string;
  weekday: string;
  date: string;
  rows: TimetableRow[];
};

/* Formatting is pinned to IST on the server so the markup React hydrates is
   identical to the markup it rendered — no locale drift, no mismatch. */
const timeFmt = new Intl.DateTimeFormat("en-IN", {
  timeZone: IST,
  hour: "numeric",
  minute: "2-digit",
});
const weekdayFmt = new Intl.DateTimeFormat("en-IN", { timeZone: IST, weekday: "long" });
const dateFmt = new Intl.DateTimeFormat("en-IN", { timeZone: IST, day: "numeric", month: "short" });
const keyFmt = new Intl.DateTimeFormat("en-CA", { timeZone: IST });

/** Upcoming sessions, grouped into calendar days. */
export async function getTimetable({ days = 3, take = 80 } = {}): Promise<TimetableDay[]> {
  const sessions = await prisma.classSession.findMany({
    where: { startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    take,
    include: {
      trainer: { select: { name: true, slug: true } },
      _count: { select: { bookings: true } },
    },
  });

  const grouped = new Map<string, TimetableDay>();

  for (const s of sessions) {
    const key = keyFmt.format(s.startsAt);
    let day = grouped.get(key);
    if (!day) {
      if (grouped.size >= days) continue;
      day = {
        key,
        weekday: weekdayFmt.format(s.startsAt),
        date: dateFmt.format(s.startsAt),
        rows: [],
      };
      grouped.set(key, day);
    }
    day.rows.push({
      id: s.id,
      title: s.title,
      description: s.description,
      time: timeFmt.format(s.startsAt),
      durationMin: s.durationMin,
      capacity: s.capacity,
      spotsLeft: Math.max(0, s.capacity - s._count.bookings),
      intensity: s.intensity as IntensityKey,
      trainerName: s.trainer.name,
      trainerSlug: s.trainer.slug,
    });
  }

  return [...grouped.values()];
}

export async function getTrainers() {
  return prisma.trainer.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      specialty: true,
      bio: true,
      imageUrl: true,
      experienceYears: true,
      rating: true,
    },
  });
}

export async function getMonthlyPlans() {
  return prisma.plan.findMany({
    where: { active: true, internal: false, interval: "MONTHLY" },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      priceInPaise: true,
      interval: true,
      features: true,
      highlight: true,
    },
  });
}

export async function getAllPlans() {
  return prisma.plan.findMany({
    where: { active: true, internal: false },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      priceInPaise: true,
      interval: true,
      features: true,
      highlight: true,
    },
  });
}

export async function getTestimonials() {
  return prisma.testimonial.findMany({
    where: { published: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, role: true, quote: true, rating: true, imageUrl: true },
  });
}

export type ClubStats = {
  tonnageKg: number;
  sessionsLogged: number;
  classesPerWeek: number;
  coachingYears: number;
  coaches: number;
  avgRating: number;
};

/** Everything on the numbers strip is a real query — nothing is padded. */
export async function getClubStats(): Promise<ClubStats> {
  const now = new Date();
  const [volume, sessionsLogged, classesPerWeek, coaches] = await Promise.all([
    prisma.workoutLog.aggregate({ _sum: { volumeKg: true } }),
    prisma.workoutLog.count(),
    prisma.classSession.count({
      where: { startsAt: { gte: now, lt: new Date(now.getTime() + 7 * DAY_MS) } },
    }),
    prisma.trainer.findMany({
      where: { active: true },
      select: { experienceYears: true, rating: true },
    }),
  ]);

  const coachingYears = coaches.reduce((sum, t) => sum + t.experienceYears, 0);
  const avgRating = coaches.length
    ? coaches.reduce((sum, t) => sum + t.rating, 0) / coaches.length
    : 5;

  return {
    tonnageKg: volume._sum.volumeKg ?? 0,
    sessionsLogged,
    classesPerWeek,
    coachingYears,
    coaches: coaches.length,
    avgRating: Math.round(avgRating * 10) / 10,
  };
}
