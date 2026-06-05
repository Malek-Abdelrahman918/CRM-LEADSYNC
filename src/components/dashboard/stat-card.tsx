import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { TONE_BADGE, type Tone } from "@/lib/constants";
import { cn } from "@/lib/utils";

function DeltaBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
        positive
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-rose-500/15 text-rose-400",
      )}
    >
      {positive ? (
        <ArrowUpRight className="size-3" />
      ) : (
        <ArrowDownRight className="size-3" />
      )}
      {Math.abs(Math.round(value))}%
    </span>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  delta,
  tone = "violet",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  delta?: number;
  tone?: Tone;
}) {
  return (
    <Card className="gap-0 py-0 transition-colors hover:border-foreground/15">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0 space-y-1.5">
          <p className="text-muted-foreground text-xs font-medium">{label}</p>
          <p className="truncate text-2xl font-semibold tracking-tight tabular-nums">
            {value}
          </p>
          <div className="flex items-center gap-2">
            {delta !== undefined && <DeltaBadge value={delta} />}
            {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
          </div>
        </div>
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg border",
            TONE_BADGE[tone],
          )}
        >
          <Icon className="size-4.5" />
        </div>
      </CardContent>
    </Card>
  );
}
