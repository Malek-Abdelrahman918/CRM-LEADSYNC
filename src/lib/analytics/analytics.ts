/**
 * Analytics engine — pure functions over the lead set.
 *
 * Powers both the Dashboard KPI cards/charts and the Analytics page. Keeping all
 * derivations here (rather than inside components) means the numbers are
 * consistent everywhere and trivially unit-testable.
 */

import {
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import type {
  AppSettings,
  DashboardMetrics,
  FunnelStep,
  Lead,
  PipelineStage,
  SourceBreakdown,
  TimeseriesPoint,
} from "@/lib/types";
import {
  ACTIVE_STAGES,
  LEAD_SOURCES,
  PIPELINE_STAGES,
  STAGE_MAP,
} from "@/lib/constants";

/** Active funnel sequence (lost excluded — it's a terminal off-ramp). */
const FUNNEL_ORDER: PipelineStage[] = [
  "new",
  "researching",
  "contacted",
  "follow_up",
  "replied",
  "call_scheduled",
  "proposal_sent",
  "client",
];

function stageIndex(stage: PipelineStage): number {
  return FUNNEL_ORDER.indexOf(stage);
}

/**
 * For each funnel stage, how many non-lost leads have reached at-or-beyond it.
 * Monotonically decreasing → a true funnel.
 */
export function reachedCounts(leads: Lead[]): Record<PipelineStage, number> {
  const counts = Object.fromEntries(
    FUNNEL_ORDER.map((s) => [s, 0]),
  ) as Record<PipelineStage, number>;

  for (const lead of leads) {
    if (lead.status === "lost") continue;
    const idx = stageIndex(lead.status);
    if (idx < 0) continue;
    for (let i = 0; i <= idx; i++) counts[FUNNEL_ORDER[i]]++;
  }
  return counts;
}

function dealValue(lead: Lead, settings: AppSettings): number {
  return lead.dealValue ?? settings.averageDealValue;
}

export function computeMetrics(leads: Lead[], settings: AppSettings): DashboardMetrics {
  const reached = reachedCounts(leads);

  const pipelineValue = leads
    .filter((l) => ACTIVE_STAGES.includes(l.status))
    .reduce((sum, l) => sum + dealValue(l, settings) * STAGE_MAP[l.status].probability, 0);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthlyRevenue = leads
    .filter((l) => l.status === "client")
    .filter((l) => {
      const closed = l.closedAt ?? l.updatedAt;
      const d = parseISO(closed);
      return isWithinInterval(d, { start: monthStart, end: now });
    })
    .reduce((sum, l) => sum + dealValue(l, settings), 0);

  return {
    totalLeads: leads.length,
    newLeads: leads.filter((l) => l.status === "new").length,
    contacted: reached.contacted,
    replies: reached.replied,
    callsBooked: reached.call_scheduled,
    clients: leads.filter((l) => l.status === "client").length,
    pipelineValue: Math.round(pipelineValue),
    monthlyRevenue: Math.round(monthlyRevenue),
  };
}

export function computeFunnel(leads: Lead[]): FunnelStep[] {
  const reached = reachedCounts(leads);
  return FUNNEL_ORDER.map((stage) => ({
    stage,
    label: STAGE_MAP[stage].label,
    count: reached[stage],
  }));
}

export interface StatusDatum {
  stage: PipelineStage;
  label: string;
  count: number;
}

export function computeStatusDistribution(leads: Lead[]): StatusDatum[] {
  return PIPELINE_STAGES.map((s) => ({
    stage: s.id,
    label: s.label,
    count: leads.filter((l) => l.status === s.id).length,
  })).filter((d) => d.count > 0);
}

export function computeSourceBreakdown(leads: Lead[]): SourceBreakdown[] {
  return LEAD_SOURCES.map((s) => ({
    source: s.value,
    label: s.label,
    count: leads.filter((l) => l.source === s.value).length,
  })).filter((d) => d.count > 0);
}

/** Cumulative lead total at the end of each of the last `months` months. */
export function computeLeadGrowth(leads: Lead[], months = 6): TimeseriesPoint[] {
  const now = new Date();
  const points: TimeseriesPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const end = i === 0 ? now : startOfMonth(subMonths(now, i - 1));
    const cumulative = leads.filter((l) => parseISO(l.createdAt) < end).length;
    points.push({ label: format(monthDate, "MMM"), value: cumulative });
  }
  return points;
}

/** New leads added per month for the last `months` months. */
export function computeNewLeadsPerMonth(leads: Lead[], months = 6): TimeseriesPoint[] {
  const now = new Date();
  const points: TimeseriesPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const start = startOfMonth(subMonths(now, i));
    const end = i === 0 ? now : startOfMonth(subMonths(now, i - 1));
    const value = leads.filter((l) => {
      const d = parseISO(l.createdAt);
      return d >= start && d < end;
    }).length;
    points.push({ label: format(start, "MMM"), value });
  }
  return points;
}

export function computeResponseRate(leads: Lead[]): number {
  const reached = reachedCounts(leads);
  if (reached.contacted === 0) return 0;
  return (reached.replied / reached.contacted) * 100;
}

export function computeWinRate(leads: Lead[]): number {
  const won = leads.filter((l) => l.status === "client").length;
  const lost = leads.filter((l) => l.status === "lost").length;
  const decided = won + lost;
  if (decided === 0) return 0;
  return (won / decided) * 100;
}

/** Overall lead → client conversion across the whole base. */
export function computeConversionRate(leads: Lead[]): number {
  if (leads.length === 0) return 0;
  const won = leads.filter((l) => l.status === "client").length;
  return (won / leads.length) * 100;
}

/** % change in new leads this month vs last month. */
export function computeMonthlyGrowthPct(leads: Lead[]): number {
  const series = computeNewLeadsPerMonth(leads, 2);
  const prev = series[0]?.value ?? 0;
  const curr = series[1]?.value ?? 0;
  if (prev === 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}
