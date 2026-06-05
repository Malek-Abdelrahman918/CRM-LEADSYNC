"use client";

import * as React from "react";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarCheck,
  DollarSign,
  Inbox,
  Send,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { AreaTrendChart } from "@/components/charts/area-trend-chart";
import { RankedBars } from "@/components/charts/ranked-bars";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { FollowUpPanel } from "@/components/dashboard/follow-up-panel";
import { useCrmStore } from "@/store/use-crm-store";
import {
  computeFunnel,
  computeLeadGrowth,
  computeMetrics,
  computeMonthlyGrowthPct,
} from "@/lib/analytics/analytics";
import { STAGE_MAP } from "@/lib/constants";
import { formatCompactCurrency, formatNumber } from "@/lib/format";

export default function DashboardPage() {
  const leads = useCrmStore((s) => s.leads);
  const activities = useCrmStore((s) => s.activities);
  const settings = useCrmStore((s) => s.settings);

  const metrics = React.useMemo(
    () => computeMetrics(leads, settings),
    [leads, settings],
  );
  const growth = React.useMemo(() => computeLeadGrowth(leads), [leads]);
  const growthPct = React.useMemo(() => computeMonthlyGrowthPct(leads), [leads]);
  const funnel = React.useMemo(
    () =>
      computeFunnel(leads).map((f) => ({
        label: f.label,
        value: f.count,
        tone: STAGE_MAP[f.stage].tone,
      })),
    [leads],
  );
  const leadsById = React.useMemo(
    () => Object.fromEntries(leads.map((l) => [l.id, l])),
    [leads],
  );

  const currency = settings.currency;

  const stats = [
    { label: "Total Leads", value: formatNumber(metrics.totalLeads), icon: Users, tone: "violet" as const, delta: growthPct, hint: "vs last month" },
    { label: "New Leads", value: formatNumber(metrics.newLeads), icon: UserPlus, tone: "blue" as const },
    { label: "Contacted", value: formatNumber(metrics.contacted), icon: Send, tone: "cyan" as const },
    { label: "Replies", value: formatNumber(metrics.replies), icon: Inbox, tone: "indigo" as const },
    { label: "Calls Booked", value: formatNumber(metrics.callsBooked), icon: CalendarCheck, tone: "fuchsia" as const },
    { label: "Clients", value: formatNumber(metrics.clients), icon: BadgeCheck, tone: "emerald" as const },
    { label: "Pipeline Value", value: formatCompactCurrency(metrics.pipelineValue, currency), icon: Wallet, tone: "amber" as const },
    { label: "Monthly Revenue", value: formatCompactCurrency(metrics.monthlyRevenue, currency), icon: DollarSign, tone: "green" as const },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Here's what's happening across ${settings.agencyName}'s pipeline.`}
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="text-primary size-4" />
              Lead Growth
            </CardTitle>
            <CardDescription>Cumulative leads over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <AreaTrendChart data={growth} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pipeline Funnel</CardTitle>
            <CardDescription>Leads reaching each stage</CardDescription>
          </CardHeader>
          <CardContent>
            <RankedBars items={funnel} showConversion />
          </CardContent>
        </Card>
      </div>

      {/* Activity + follow-ups */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>Latest touchpoints across all leads</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/leads">View leads</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ActivityFeed activities={activities} leadsById={leadsById} limit={8} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Follow-ups</CardTitle>
            <CardDescription>Overdue, due today and upcoming</CardDescription>
          </CardHeader>
          <CardContent>
            <FollowUpPanel leads={leads} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
