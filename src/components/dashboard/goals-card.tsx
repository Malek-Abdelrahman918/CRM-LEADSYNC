"use client";

import * as React from "react";
import Link from "next/link";
import { isWithinInterval, parseISO, startOfMonth } from "date-fns";
import { Target } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCrmStore } from "@/store/use-crm-store";
import { computeMetrics } from "@/lib/analytics/analytics";
import { formatCompactCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

function GoalRow({
  label,
  current,
  target,
  display,
}: {
  label: string;
  current: number;
  target: number;
  display: (n: number) => string;
}) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const hit = pct >= 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {display(current)}
          <span className="text-muted-foreground font-normal">
            {" "}/ {display(target)}
          </span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Progress
          value={pct}
          className={cn("h-1.5 flex-1", hit && "[&>div]:bg-emerald-400")}
        />
        <span
          className={cn(
            "w-9 text-right text-xs font-medium tabular-nums",
            hit ? "text-emerald-400" : "text-muted-foreground",
          )}
        >
          {Math.round(pct)}%
        </span>
      </div>
    </div>
  );
}

/** Monthly goal progress — connects Settings goals to live pipeline data. */
export function GoalsCard() {
  const leads = useCrmStore((s) => s.leads);
  const settings = useCrmStore((s) => s.settings);

  const metrics = React.useMemo(
    () => computeMetrics(leads, settings),
    [leads, settings],
  );
  const newThisMonth = React.useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    return leads.filter((l) =>
      isWithinInterval(parseISO(l.createdAt), { start, end: now }),
    ).length;
  }, [leads]);

  const currency = settings.currency;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="text-primary size-4" />
          Monthly Goals
        </CardTitle>
        <CardDescription>Progress against your targets</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoalRow
          label="New leads"
          current={newThisMonth}
          target={settings.monthlyLeadGoal}
          display={formatNumber}
        />
        <GoalRow
          label="Revenue"
          current={metrics.monthlyRevenue}
          target={settings.monthlyRevenueGoal}
          display={(n) => formatCompactCurrency(n, currency)}
        />
        <GoalRow
          label="Pipeline value"
          current={metrics.pipelineValue}
          target={settings.pipelineValueGoal}
          display={(n) => formatCompactCurrency(n, currency)}
        />
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground -ml-2">
          <Link href="/settings">Adjust goals →</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
