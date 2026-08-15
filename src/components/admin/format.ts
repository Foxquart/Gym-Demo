import { intervalMonths } from "@/lib/utils";

/** Compact "3m ago / 4h ago / 6d ago" for activity feeds. */
export function timeAgo(date: Date) {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}

/** Whole days from now, rounded up — "expires in 3 days". */
export function daysUntil(date: Date) {
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
}

/** A quarterly or yearly plan normalised to what it earns per month. */
export function monthlyValueInPaise(priceInPaise: number, interval: string) {
  return Math.round(priceInPaise / (intervalMonths[interval] ?? 1));
}

/** Percentage change, guarded against a zero baseline. */
export function pctChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
}

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Monday-first week start, which is how the timetable reads. */
export function startOfWeek(date = new Date()) {
  const d = startOfDay(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d;
}

export function startOfMonth(date = new Date()) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** "Mar" / "Mar 2025" labels for chart axes. */
export function monthLabel(date: Date, withYear = false) {
  return date.toLocaleDateString("en-IN", {
    month: "short",
    ...(withYear ? { year: "2-digit" } : {}),
  });
}

/** `datetime-local` wants a local-time ISO string with no zone suffix. */
export function toDateTimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const INTENSITY_LABEL: Record<string, string> = {
  LOW: "Low",
  MODERATE: "Moderate",
  HIGH: "High",
  ELITE: "Elite",
};

export const SUBSCRIPTION_TONE: Record<string, "success" | "amber" | "danger" | "neutral"> = {
  ACTIVE: "success",
  PENDING: "amber",
  CANCELLED: "neutral",
  EXPIRED: "danger",
};

export const PAYMENT_TONE: Record<string, "success" | "amber" | "danger" | "neutral"> = {
  PAID: "success",
  CREATED: "amber",
  FAILED: "danger",
  REFUNDED: "neutral",
};

export const BOOKING_TONE: Record<string, "success" | "amber" | "danger" | "neutral"> = {
  BOOKED: "amber",
  ATTENDED: "success",
  CANCELLED: "neutral",
};
