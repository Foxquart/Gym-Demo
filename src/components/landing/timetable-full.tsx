"use client";

import Link from "next/link";
import { Clock, Users } from "lucide-react";

import { Badge } from "@/components/ui";
import { useReveal } from "@/hooks/use-reveal";
import { INTENSITY } from "./intensity";
import type { IntensityKey, TimetableDay } from "./queries";

const LEGEND = Object.entries(INTENSITY) as [IntensityKey, (typeof INTENSITY)[IntensityKey]][];

export function TimetableFull({ days }: { days: TimetableDay[] }) {
  const root = useReveal<HTMLDivElement>({ start: "top 92%", stagger: 0.06 });

  return (
    <div ref={root} className="container-edge py-16 md:py-20 lg:py-24">
      <ul className="js-reveal mb-12 flex flex-wrap gap-x-6 gap-y-3 border-b border-border pb-8">
        {LEGEND.map(([key, meta]) => (
          <li key={key} className="flex items-center gap-2.5">
            <Badge tone={meta.tone}>{meta.label}</Badge>
            <span className="text-[13px] text-ink-muted">{meta.blurb}</span>
          </li>
        ))}
      </ul>

      {days.length === 0 ? (
        <p className="js-reveal rounded-[var(--radius-card)] border border-dashed border-border px-6 py-16 text-center text-sm text-ink-muted">
          The next block goes up on Friday evening. Call the desk on +91 22 4890 1120 and we will
          hold you a spot in the meantime.
        </p>
      ) : (
        <div className="flex flex-col">
          {days.map((day) => (
            <section
              key={day.key}
              aria-label={`${day.weekday} ${day.date}`}
              className="js-reveal border-b border-border py-9 first:pt-0 last:border-b-0"
            >
              <div className="grid gap-6 lg:grid-cols-12 lg:gap-10">
                <div className="lg:col-span-3">
                  <h2 className="font-display text-2xl leading-none font-extrabold tracking-[-0.03em] text-ink lg:sticky lg:top-28">
                    {day.weekday}
                    <span className="mt-2 block text-sm font-normal tracking-normal text-ink-faint">
                      {day.date} · {day.rows.length} session{day.rows.length === 1 ? "" : "s"}
                    </span>
                  </h2>
                </div>

                <ul className="flex flex-col divide-y divide-border lg:col-span-9">
                  {day.rows.map((row) => {
                    const meta = INTENSITY[row.intensity];
                    return (
                      <li key={row.id} className="group flex flex-col gap-3 py-5 sm:flex-row sm:gap-6">
                        <div className="shrink-0 sm:w-24">
                          <p className="font-display text-base font-bold tabular-nums text-ink">
                            {row.time}
                          </p>
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink-faint">
                            <Clock className="size-3" aria-hidden />
                            {row.durationMin} min
                          </p>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                            <h3 className="font-display text-lg leading-tight tracking-tight text-ink">
                              {row.title}
                            </h3>
                            <Badge tone={meta.tone}>{meta.label}</Badge>
                          </div>
                          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">
                            {row.description}
                          </p>
                          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-faint">
                            <Link
                              href={`/trainers#${row.trainerSlug}`}
                              className="font-medium text-ink-muted transition-colors duration-300 hover:text-brand"
                            >
                              {row.trainerName}
                            </Link>
                            <span className="inline-flex items-center gap-1.5">
                              <Users className="size-3.5" aria-hidden />
                              {row.spotsLeft > 0
                                ? `${row.spotsLeft} of ${row.capacity} spots left`
                                : "Waitlist only"}
                            </span>
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
