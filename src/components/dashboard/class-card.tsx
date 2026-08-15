"use client";

import { useOptimistic, useTransition } from "react";
import { Check, Clock, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { bookClass, cancelClassBooking } from "@/app/dashboard/actions";
import { cn } from "@/lib/utils";

export type ClassCardData = {
  id: string;
  title: string;
  description: string;
  dayLabel: string;
  timeLabel: string;
  durationMin: number;
  capacity: number;
  spotsTaken: number;
  intensity: "LOW" | "MODERATE" | "HIGH" | "ELITE";
  imageUrl: string | null;
  trainerName: string;
  trainerImage: string;
  booked: boolean;
  past: boolean;
};

export const intensityTone: Record<
  ClassCardData["intensity"],
  "success" | "brand" | "amber" | "danger"
> = {
  LOW: "success",
  MODERATE: "brand",
  HIGH: "amber",
  ELITE: "danger",
};

const intensityLabel: Record<ClassCardData["intensity"], string> = {
  LOW: "Low",
  MODERATE: "Moderate",
  HIGH: "High",
  ELITE: "Elite",
};

export function ClassCard({ session }: { session: ClassCardData }) {
  const [pending, startTransition] = useTransition();
  const [booked, setBooked] = useOptimistic(session.booked);

  // `spotsTaken` already counts this member if they were booked on the server,
  // so the optimistic delta is the difference between the two states.
  const delta = (booked ? 1 : 0) - (session.booked ? 1 : 0);
  const spotsLeft = Math.max(0, session.capacity - session.spotsTaken - delta);
  const full = spotsLeft === 0 && !booked;
  const filledPct = Math.min(100, Math.round(((session.capacity - spotsLeft) / session.capacity) * 100));

  function toggle() {
    startTransition(async () => {
      setBooked(!booked);
      const result = booked ? await cancelClassBooking(session.id) : await bookClass(session.id);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-[var(--radius-card)] border bg-surface transition-all duration-300 ease-[var(--ease-out-expo)]",
        booked ? "border-brand/45 shadow-[var(--shadow-md)]" : "border-border hover:shadow-[var(--shadow-md)]",
      )}
    >
      {session.imageUrl ? (
        <div className="relative h-32 shrink-0 overflow-hidden bg-bg-subtle sm:h-36">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={session.imageUrl}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
          />
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge tone={intensityTone[session.intensity]}>{intensityLabel[session.intensity]}</Badge>
            {booked ? (
              <Badge tone="brand" className="bg-brand text-brand-ink">
                <Check className="size-3" aria-hidden /> Booked
              </Badge>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.14em] text-ink-faint uppercase">
            {session.dayLabel}
          </p>
          <h3 className="mt-1.5 font-display text-[17px] leading-tight text-ink">{session.title}</h3>
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink-muted">
            {session.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5 text-ink-faint" aria-hidden />
            {session.timeLabel} · {session.durationMin} min
          </span>
          <span className="inline-flex items-center gap-1.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={session.trainerImage} alt="" loading="lazy" className="size-5 rounded-full object-cover" />
            {session.trainerName}
          </span>
        </div>

        <div className="mt-auto pt-1">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 text-ink-muted">
              <Users className="size-3.5 text-ink-faint" aria-hidden />
              {full ? "Full" : `${spotsLeft} of ${session.capacity} left`}
            </span>
            <span className="text-ink-faint tabular-nums">{filledPct}%</span>
          </div>

          <div
            className="h-1.5 overflow-hidden rounded-full bg-bg-subtle"
            role="progressbar"
            aria-valuenow={filledPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${session.title} is ${filledPct} percent booked`}
          >
            <span
              className={cn(
                "block h-full rounded-full transition-[width] duration-500 ease-[var(--ease-out-expo)]",
                full ? "bg-danger" : spotsLeft <= 3 ? "bg-amber" : "bg-brand",
              )}
              style={{ width: `${filledPct}%` }}
            />
          </div>

          <Button
            type="button"
            onClick={toggle}
            loading={pending}
            disabled={session.past || (full && !booked)}
            variant={booked ? "outline" : "primary"}
            className="mt-4 w-full"
          >
            {session.past
              ? "Session has passed"
              : booked
                ? "Cancel my spot"
                : full
                  ? "Class is full"
                  : "Book this class"}
          </Button>
        </div>
      </div>
    </article>
  );
}
