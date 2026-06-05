/**
 * Follow-up engine.
 *
 * Derives follow-up urgency from a lead's `nextFollowUpAt`. Used by the
 * dashboard alerts, the Leads table "Next Follow Up" column and the Lead Detail
 * scheduler. Pure date math — no side effects.
 */

import { addBusinessDays, addDays, differenceInCalendarDays, parseISO } from "date-fns";
import type { FollowUpInfo, Lead, PipelineStage } from "@/lib/types";

const CLOSED_STAGES: PipelineStage[] = ["client", "lost"];

function toDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = typeof value === "string" ? parseISO(value) : value;
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Classify a lead's follow-up relative to `now`.
 * Closed leads (client / lost) never surface a follow-up.
 */
export function getFollowUpInfo(lead: Lead, now: Date = new Date()): FollowUpInfo {
  const date = toDate(lead.nextFollowUpAt);
  if (!date || CLOSED_STAGES.includes(lead.status)) {
    return { state: "none", daysUntil: null, date: lead.nextFollowUpAt ?? null };
  }

  const daysUntil = differenceInCalendarDays(date, now);
  const state =
    daysUntil < 0 ? "overdue" : daysUntil === 0 ? "due_today" : "upcoming";

  return { state, daysUntil, date: lead.nextFollowUpAt ?? null };
}

export function isOverdue(lead: Lead, now?: Date): boolean {
  return getFollowUpInfo(lead, now).state === "overdue";
}

export function isDueToday(lead: Lead, now?: Date): boolean {
  return getFollowUpInfo(lead, now).state === "due_today";
}

export function isUpcoming(lead: Lead, now?: Date): boolean {
  return getFollowUpInfo(lead, now).state === "upcoming";
}

export interface CategorizedFollowUps {
  overdue: Lead[];
  dueToday: Lead[];
  upcoming: Lead[];
}

/**
 * Split leads into overdue / due-today / upcoming buckets, each sorted by the
 * follow-up date (soonest first). `upcoming` is limited to the next 30 days.
 */
export function categorizeFollowUps(
  leads: Lead[],
  now: Date = new Date(),
  upcomingHorizonDays = 30,
): CategorizedFollowUps {
  const result: CategorizedFollowUps = { overdue: [], dueToday: [], upcoming: [] };

  for (const lead of leads) {
    const info = getFollowUpInfo(lead, now);
    if (info.state === "overdue") result.overdue.push(lead);
    else if (info.state === "due_today") result.dueToday.push(lead);
    else if (
      info.state === "upcoming" &&
      info.daysUntil !== null &&
      info.daysUntil <= upcomingHorizonDays
    ) {
      result.upcoming.push(lead);
    }
  }

  const bySoonest = (a: Lead, b: Lead) =>
    (toDate(a.nextFollowUpAt)?.getTime() ?? 0) -
    (toDate(b.nextFollowUpAt)?.getTime() ?? 0);

  result.overdue.sort(bySoonest);
  result.dueToday.sort(bySoonest);
  result.upcoming.sort(bySoonest);

  return result;
}

/** Suggested next follow-up date, `days` calendar days from `from`. */
export function suggestFollowUpDate(days: number, from: Date = new Date()): string {
  return addDays(from, days).toISOString();
}

/** Business-day variant for outreach cadences. */
export function suggestFollowUpBusinessDate(
  days: number,
  from: Date = new Date(),
): string {
  return addBusinessDays(from, days).toISOString();
}
