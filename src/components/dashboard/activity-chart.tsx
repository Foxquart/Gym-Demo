"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type ActivityWeek = {
  /** Short axis label, e.g. "14 Jul". */
  week: string;
  /** Full label used in the tooltip and the screen-reader table. */
  range: string;
  sessions: number;
  volumeKg: number;
  minutes: number;
};

function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);
  React.useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

type TooltipPayload = { payload: ActivityWeek };

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length) return null;
  const week = payload[0].payload;

  return (
    <div className="rounded-xl border border-border bg-surface-raised px-3 py-2.5 shadow-[var(--shadow-lg)]">
      <p className="text-[11px] font-semibold tracking-wide text-ink-faint uppercase">{week.range}</p>
      <p className="mt-1.5 font-display text-lg leading-none text-ink">
        {week.sessions} {week.sessions === 1 ? "session" : "sessions"}
      </p>
      <p className="mt-1.5 text-xs text-ink-muted">
        {week.minutes} min on the floor · {week.volumeKg.toLocaleString("en-IN")} kg moved
      </p>
    </div>
  );
}

/**
 * Twelve weeks of check-ins. Colours are read straight from the design tokens
 * (`var(--brand)`, `var(--border)`…) so the chart re-themes with the page
 * instead of carrying its own palette.
 */
export function ActivityChart({ data }: { data: ActivityWeek[] }) {
  const narrow = useMediaQuery("(max-width: 640px)");
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const total = data.reduce((sum, w) => sum + w.sessions, 0);
  const best = data.reduce((max, w) => Math.max(max, w.sessions), 0);

  if (total === 0) {
    return (
      <div className="flex h-[240px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 text-center">
        <p className="font-display text-base text-ink">No check-ins yet.</p>
        <p className="max-w-xs text-[13px] text-ink-muted">
          Scan in at the front desk and this fills up. Twelve weeks from now it will tell you more
          than any mirror.
        </p>
      </div>
    );
  }

  return (
    <figure className="m-0">
      <div
        className="h-[240px] w-full sm:h-[260px]"
        role="img"
        aria-label={`Bar chart: sessions per week over the last twelve weeks. ${total} sessions in total, with a best week of ${best}.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -20 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4" />
            <XAxis
              dataKey="week"
              stroke="var(--border-strong)"
              tick={{ fill: "var(--ink-faint)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              interval={narrow ? 2 : 0}
              tickMargin={10}
            />
            <YAxis
              allowDecimals={false}
              width={40}
              stroke="var(--border-strong)"
              tick={{ fill: "var(--ink-faint)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: "var(--bg-subtle)", radius: 8 }}
              wrapperStyle={{ outline: "none" }}
            />
            <Bar
              dataKey="sessions"
              radius={[6, 6, 3, 3]}
              maxBarSize={38}
              isAnimationActive={!reduceMotion}
              animationDuration={520}
            >
              {data.map((week, i) => (
                <Cell
                  key={week.week}
                  // The current week is still in progress — draw it quieter so a
                  // half-finished week doesn't read as a bad week.
                  fill={i === data.length - 1 ? "var(--amber)" : "var(--brand)"}
                  fillOpacity={week.sessions === 0 ? 0.25 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <figcaption className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-sm bg-brand" aria-hidden />
          Completed weeks
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-sm bg-amber" aria-hidden />
          This week, still running
        </span>
      </figcaption>

      {/* Screen readers get the numbers, not just the shape. */}
      <table className="sr-only">
        <caption>Sessions per week, last twelve weeks</caption>
        <thead>
          <tr>
            <th scope="col">Week</th>
            <th scope="col">Sessions</th>
            <th scope="col">Volume in kilograms</th>
          </tr>
        </thead>
        <tbody>
          {data.map((week) => (
            <tr key={week.range}>
              <th scope="row">{week.range}</th>
              <td>{week.sessions}</td>
              <td>{week.volumeKg}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
