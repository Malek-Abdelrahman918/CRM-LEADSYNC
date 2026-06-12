"use client";

import * as React from "react";
import { MessageSquare, Target, TrendingUp, Trophy, UserPlus } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { DonutChart } from "@/components/charts/donut-chart";
import { BarTrendChart } from "@/components/charts/bar-trend-chart";
import { RankedBars } from "@/components/charts/ranked-bars";
import { useCrmStore } from "@/store/use-crm-store";
import {
  computeConversionRate,
  computeFunnel,
  computeNewLeadsPerMonth,
  computeResponseRate,
  computeSourceBreakdown,
  computeStatusDistribution,
  computeWinRate,
  computeMonthlyGrowthPct,
} from "@/lib/analytics/analytics";
import { STAGE_MAP } from "@/lib/constants";
import { formatPercent } from "@/lib/format";

export function AnalyticsView() {
  const leads = useCrmStore((s) => s.leads);

  const sources = React.useMemo(
    () => computeSourceBreakdown(leads).map((s) => ({ label: s.label, value: s.count })),
    [leads],
  );
  const statusDist = React.useMemo(
    () =>
      computeStatusDistribution(leads).map((s) => ({
        label: s.label,
        value: s.count,
        tone: STAGE_MAP[s.stage].tone,
      })),
    [leads],
  );
  const funnel = React.useMemo(
    () => computeFunnel(leads).map((f) => ({ label: f.label, value: f.count })),
    [leads],
  );
  const monthly = React.useMemo(() => computeNewLeadsPerMonth(leads), [leads]);

  const responseRate = computeResponseRate(leads);
  const winRate = computeWinRate(leads);
  const conversionRate = computeConversionRate(leads);
  const growthPct = computeMonthlyGrowthPct(leads);
  const newThisMonth = monthly[monthly.length - 1]?.value ?? 0;

  if (leads.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" description="Insights across your funnel." />
        <EmptyState
          icon={TrendingUp}
          title="No data yet"
          description="Add or import leads to see analytics."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Performance across sources, stages and conversion."
      />

      {/* Headline rates */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Response Rate"
          value={formatPercent(responseRate)}
          icon={MessageSquare}
          tone="cyan"
          hint="replies ÷ contacted"
        />
        <StatCard
          label="Win Rate"
          value={formatPercent(winRate)}
          icon={Trophy}
          tone="emerald"
          hint="won ÷ (won + lost)"
        />
        <StatCard
          label="Conversion Rate"
          value={formatPercent(conversionRate)}
          icon={Target}
          tone="violet"
          hint="leads → clients"
        />
        <StatCard
          label="New This Month"
          value={newThisMonth}
          icon={UserPlus}
          tone="blue"
          delta={growthPct}
          hint="vs last month"
        />
      </div>

      {/* Monthly growth + funnel */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Monthly Growth</CardTitle>
            <CardDescription>New leads added per month</CardDescription>
          </CardHeader>
          <CardContent>
            <BarTrendChart data={monthly} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversion Funnel</CardTitle>
            <CardDescription>Leads reaching each stage</CardDescription>
          </CardHeader>
          <CardContent>
            <RankedBars items={funnel} variant="gradient" showConversion />
          </CardContent>
        </Card>
      </div>

      {/* Sources + status distribution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lead Sources</CardTitle>
            <CardDescription>Where your leads come from</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart data={sources} centerLabel="Leads" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Distribution</CardTitle>
            <CardDescription>Leads by current pipeline stage</CardDescription>
          </CardHeader>
          <CardContent>
            <RankedBars items={statusDist} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
