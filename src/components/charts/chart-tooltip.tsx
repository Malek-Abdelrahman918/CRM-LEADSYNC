"use client";

import * as React from "react";

interface PayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}

export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: PayloadItem[];
  label?: string;
  valueFormatter?: (value: number | string) => React.ReactNode;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-popover/95 supports-[backdrop-filter]:bg-popover/80 min-w-32 rounded-lg border px-3 py-2 text-xs shadow-md backdrop-blur">
      {label !== undefined && (
        <p className="mb-1.5 font-medium">{label}</p>
      )}
      <div className="space-y-1">
        {payload.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-[3px]"
              style={{ background: item.color }}
            />
            <span className="text-muted-foreground capitalize">
              {item.name}
            </span>
            <span className="ml-auto font-medium tabular-nums">
              {valueFormatter && item.value !== undefined
                ? valueFormatter(item.value)
                : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
