"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTooltip } from "./chart-tooltip";
import type { TimeseriesPoint } from "@/lib/types";

export function BarTrendChart({
  data,
  color = "var(--chart-1)",
  height = 240,
  name = "New leads",
}: {
  data: TimeseriesPoint[];
  color?: string;
  height?: number;
  name?: string;
}) {
  const axisTick = { fill: "var(--muted-foreground)", fontSize: 12 };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axisTick} dy={6} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={axisTick}
          width={40}
          allowDecimals={false}
        />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
        />
        <Bar
          dataKey="value"
          name={name}
          fill={color}
          radius={[6, 6, 0, 0]}
          maxBarSize={44}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
