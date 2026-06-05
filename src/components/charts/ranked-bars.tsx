"use client";

import { TONE_DOT, type Tone } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface RankedBarItem {
  label: string;
  value: number;
  tone?: Tone;
}

/**
 * Horizontal ranked bars — used for the conversion/pipeline funnel
 * (gradient + conversion %) and status distribution (tone-coloured).
 */
export function RankedBars({
  items,
  variant = "tone",
  showConversion = false,
  valueSuffix,
}: {
  items: RankedBarItem[];
  variant?: "tone" | "gradient";
  showConversion?: boolean;
  valueSuffix?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const first = items[0]?.value || 1;

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const widthPct = Math.max(2, (item.value / max) * 100);
        const conversion = Math.round((item.value / first) * 100);
        return (
          <div key={`${item.label}-${i}`} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium tabular-nums">
                {item.value}
                {valueSuffix}
                {showConversion && (
                  <span className="text-muted-foreground"> · {conversion}%</span>
                )}
              </span>
            </div>
            <div className="bg-muted/50 h-2.5 w-full overflow-hidden rounded-full">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  variant === "gradient"
                    ? "from-primary bg-gradient-to-r to-violet-500"
                    : item.tone
                      ? TONE_DOT[item.tone]
                      : "bg-primary",
                )}
                style={{ width: `${widthPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
