"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatINR } from "@/lib/utils";

/* ------------------------------- shared bits ------------------------------ */

const AXIS = {
  tick: { fill: "var(--chart-axis)", fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const;

function TooltipCard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string; color?: string }[];
}) {
  return (
    <div className="rounded-xl border border-border bg-[var(--chart-surface)] px-3 py-2 shadow-[var(--shadow-md)]">
      <p className="text-[11px] font-semibold tracking-[0.1em] text-ink-faint uppercase">{title}</p>
      <ul className="mt-1.5 space-y-1">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-2 text-sm">
            {row.color && (
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ background: row.color }}
              />
            )}
            <span className="text-ink-muted">{row.label}</span>
            <span className="ml-auto font-medium text-ink tabular-nums">{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Every chart ships an equivalent table for screen readers and for print. */
function DataTableFallback({
  caption,
  headers,
  rows,
}: {
  caption: string;
  headers: [string, string];
  rows: { label: string; value: string }[];
}) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{headers[0]}</th>
          <th scope="col">{headers[1]}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label}>
            <th scope="row">{row.label}</th>
            <td>{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ------------------------------ revenue trend ----------------------------- */

export type RevenuePoint = { label: string; paise: number; count: number };

export function RevenueTrendChart({ data }: { data: RevenuePoint[] }) {
  const peak = Math.max(...data.map((d) => d.paise), 1);

  return (
    <>
      <div className="h-[260px] w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="revenueWash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="var(--chart-grid)"
              strokeWidth={1}
            />
            <XAxis dataKey="label" {...AXIS} />
            <YAxis
              {...AXIS}
              width={64}
              tickFormatter={(v: number) => formatINR(v, { compact: true })}
            />
            <Tooltip
              cursor={{ stroke: "var(--chart-axis)", strokeWidth: 1 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as RevenuePoint;
                return (
                  <TooltipCard
                    title={String(label)}
                    rows={[
                      {
                        label: "Collected",
                        value: formatINR(point.paise),
                        color: "var(--chart-1)",
                      },
                      { label: "Payments", value: String(point.count) },
                    ]}
                  />
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="paise"
              stroke="var(--chart-1)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="url(#revenueWash)"
              dot={false}
              activeDot={{
                r: 4,
                fill: "var(--chart-1)",
                stroke: "var(--chart-surface)",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-ink-faint">
        Best month in the window: {formatINR(peak)}.
      </p>
      <DataTableFallback
        caption="Revenue collected per month, last six months"
        headers={["Month", "Collected"]}
        rows={data.map((d) => ({ label: d.label, value: formatINR(d.paise) }))}
      />
    </>
  );
}

/* -------------------------------- signups --------------------------------- */

export type SignupPoint = { label: string; count: number };

export function SignupsChart({ data }: { data: SignupPoint[] }) {
  return (
    <>
      <div className="h-[200px] w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeWidth={1} />
            <XAxis dataKey="label" {...AXIS} />
            <YAxis {...AXIS} width={40} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "var(--chart-track)" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const point = payload[0].payload as SignupPoint;
                return (
                  <TooltipCard
                    title={String(label)}
                    rows={[
                      {
                        label: point.count === 1 ? "New member" : "New members",
                        value: String(point.count),
                        color: "var(--chart-1)",
                      },
                    ]}
                  />
                );
              }}
            />
            <Bar
              dataKey="count"
              fill="var(--chart-1)"
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataTableFallback
        caption="New members joined per week"
        headers={["Week", "New members"]}
        rows={data.map((d) => ({ label: d.label, value: String(d.count) }))}
      />
    </>
  );
}
