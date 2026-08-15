import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Money is stored in paise everywhere; format only at the edge. */
export function formatINR(paise: number, opts: { compact?: boolean } = {}) {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    notation: opts.compact ? "compact" : "standard",
  }).format(rupees);
}

export function formatDate(date: Date | string, style: "short" | "long" | "time" = "short") {
  const d = typeof date === "string" ? new Date(date) : date;
  if (style === "time") {
    return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(d);
  }
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: style === "long" ? "long" : "short",
    year: "numeric",
  }).format(d);
}

export function relativeDays(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Math.round((d.getTime() - Date.now()) / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (Math.abs(diff) < 30) return rtf.format(diff, "day");
  return rtf.format(Math.round(diff / 30), "month");
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");
}

export const intervalLabel: Record<string, string> = {
  MONTHLY: "month",
  QUARTERLY: "quarter",
  YEARLY: "year",
};

export const intervalMonths: Record<string, number> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  YEARLY: 12,
};
