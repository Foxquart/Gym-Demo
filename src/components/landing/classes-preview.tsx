"use client";

import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";

import { Badge, Eyebrow } from "@/components/ui";
import { useReveal } from "@/hooks/use-reveal";
import { INTENSITY } from "./intensity";
import type { TimetableDay } from "./queries";

export function ClassesPreview({ days }: { days: TimetableDay[] }) {
  const root = useReveal<HTMLElement>({ start: "top 86%", stagger: 0.1 });

  return (
    <section
      ref={root}
      aria-labelledby="classes-title"
      className="container-edge py-20 md:py-28 lg:py-32"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <Eyebrow className="js-reveal">
            <span className="inline-block size-1.5 rounded-full bg-brand" aria-hidden />
            Next three days
          </Eyebrow>
          <h2
            id="classes-title"
            className="js-reveal mt-4 text-display-md leading-[0.95] font-extrabold tracking-[-0.04em] text-ink"
          >
            The timetable,
            <br />
            capped small on purpose.
          </h2>
        </div>
        <div className="js-reveal flex flex-col items-start gap-4 lg:items-end">
          <p className="max-w-sm text-sm leading-relaxed text-ink-muted lg:text-right">
            Eight to twenty-four people, never more. Book from the member app the moment your
            membership starts.
          </p>
          <Link
            href="/classes"
            className="group inline-flex items-center gap-2 text-sm font-medium text-brand"
          >
            See the full timetable
            <ArrowUpRight className="size-4 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>

      {days.length === 0 ? (
        <p className="js-reveal mt-12 rounded-[var(--radius-card)] border border-dashed border-border px-6 py-14 text-center text-sm text-ink-muted">
          Next week&rsquo;s timetable goes up on Friday evening. Call the desk and we&rsquo;ll walk
          you through it.
        </p>
      ) : (
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {days.map((day) => (
            <div
              key={day.key}
              className="js-reveal flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface shadow-[var(--shadow-sm)]"
            >
              <div className="flex items-baseline justify-between gap-3 border-b border-border bg-bg-subtle px-5 py-4">
                <h3 className="font-display text-lg tracking-tight text-ink">{day.weekday}</h3>
                <span className="text-[11px] font-semibold tracking-[0.18em] text-ink-faint uppercase">
                  {day.date}
                </span>
              </div>

              <ul className="divide-y divide-border">
                {day.rows.map((row) => {
                  const meta = INTENSITY[row.intensity];
                  return (
                    <li key={row.id} className="group relative flex gap-4 px-5 py-4">
                      <span
                        aria-hidden
                        className="absolute inset-y-0 left-0 w-0.5 origin-top scale-y-0 bg-brand transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-y-100"
                      />
                      <div className="w-[62px] shrink-0">
                        <p className="font-display text-sm font-bold text-ink tabular-nums">
                          {row.time}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-ink-faint">
                          <Clock className="size-3" aria-hidden />
                          {row.durationMin}m
                        </p>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                          <p className="font-medium tracking-tight text-ink">{row.title}</p>
                          <Badge tone={meta.tone} title={meta.blurb}>
                            {meta.label}
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-[13px] text-ink-muted">
                          {row.trainerName} ·{" "}
                          {row.spotsLeft > 0 ? (
                            <span>
                              {row.spotsLeft} of {row.capacity} spots left
                            </span>
                          ) : (
                            <span className="text-danger">Waitlist only</span>
                          )}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
