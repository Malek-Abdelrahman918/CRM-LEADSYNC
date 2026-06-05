/**
 * LeadSync OS — Application constants & display configuration.
 * Centralises every enum's label, ordering, colour and pipeline weighting so
 * the UI never hard-codes these values.
 */

import type {
  CompanySize,
  Industry,
  LeadSource,
  PipelineStage,
  TaskPriority,
} from "@/lib/types";

/** Namespaced LocalStorage keys (also reused as Supabase table names later). */
export const STORAGE_KEYS = {
  leads: "leadsync.leads",
  activities: "leadsync.activities",
  notes: "leadsync.notes",
  tasks: "leadsync.tasks",
  settings: "leadsync.settings",
  seeded: "leadsync.seeded",
  sample: "leadsync.sample",
  schemaVersion: "leadsync.schema_version",
} as const;

export const SCHEMA_VERSION = 1;

/** Semantic colour tokens → Tailwind utility classes (badges, dots, chips). */
export type Tone =
  | "slate"
  | "violet"
  | "blue"
  | "amber"
  | "cyan"
  | "indigo"
  | "fuchsia"
  | "emerald"
  | "rose"
  | "green"
  | "red";

export const TONE_BADGE: Record<Tone, string> = {
  slate: "bg-slate-500/12 text-slate-300 border-slate-400/20",
  violet: "bg-violet-500/15 text-violet-300 border-violet-400/25",
  blue: "bg-blue-500/15 text-blue-300 border-blue-400/25",
  amber: "bg-amber-500/15 text-amber-300 border-amber-400/25",
  cyan: "bg-cyan-500/15 text-cyan-300 border-cyan-400/25",
  indigo: "bg-indigo-500/15 text-indigo-300 border-indigo-400/25",
  fuchsia: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-400/25",
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-400/25",
  rose: "bg-rose-500/15 text-rose-300 border-rose-400/25",
  green: "bg-green-500/15 text-green-300 border-green-400/25",
  red: "bg-red-500/15 text-red-300 border-red-400/25",
};

export const TONE_DOT: Record<Tone, string> = {
  slate: "bg-slate-400",
  violet: "bg-violet-400",
  blue: "bg-blue-400",
  amber: "bg-amber-400",
  cyan: "bg-cyan-400",
  indigo: "bg-indigo-400",
  fuchsia: "bg-fuchsia-400",
  emerald: "bg-emerald-400",
  rose: "bg-rose-400",
  green: "bg-green-400",
  red: "bg-red-400",
};

export interface StageDefinition {
  id: PipelineStage;
  label: string;
  description: string;
  tone: Tone;
  /** Probability the deal closes from this stage — drives pipeline value. */
  probability: number;
}

/** Ordered pipeline — drives the Kanban board and the conversion funnel. */
export const PIPELINE_STAGES: StageDefinition[] = [
  { id: "new", label: "New", description: "Freshly added, not yet worked", tone: "slate", probability: 0.05 },
  { id: "researching", label: "Researching", description: "Qualifying fit & gathering context", tone: "violet", probability: 0.1 },
  { id: "contacted", label: "Contacted", description: "First outreach has been sent", tone: "blue", probability: 0.2 },
  { id: "follow_up", label: "Follow Up", description: "Awaiting / scheduling a follow-up", tone: "amber", probability: 0.3 },
  { id: "replied", label: "Replied", description: "Lead has responded", tone: "cyan", probability: 0.45 },
  { id: "call_scheduled", label: "Call Scheduled", description: "Discovery call booked", tone: "indigo", probability: 0.6 },
  { id: "proposal_sent", label: "Proposal Sent", description: "Proposal / quote delivered", tone: "fuchsia", probability: 0.75 },
  { id: "client", label: "Client", description: "Won — active client", tone: "emerald", probability: 1 },
  { id: "lost", label: "Lost", description: "Closed lost / disqualified", tone: "rose", probability: 0 },
];

export const STAGE_MAP: Record<PipelineStage, StageDefinition> = PIPELINE_STAGES.reduce(
  (acc, s) => {
    acc[s.id] = s;
    return acc;
  },
  {} as Record<PipelineStage, StageDefinition>,
);

/** Stages still "in play" for pipeline-value purposes. */
export const ACTIVE_STAGES: PipelineStage[] = PIPELINE_STAGES.filter(
  (s) => s.id !== "client" && s.id !== "lost",
).map((s) => s.id);

export interface OptionDef<T extends string> {
  value: T;
  label: string;
  tone?: Tone;
}

export const LEAD_SOURCES: OptionDef<LeadSource>[] = [
  { value: "apollo", label: "Apollo" },
  { value: "csv_import", label: "CSV Import" },
  { value: "manual", label: "Manual" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "referral", label: "Referral" },
  { value: "website", label: "Website" },
  { value: "cold_outreach", label: "Cold Outreach" },
  { value: "event", label: "Event" },
  { value: "other", label: "Other" },
];

export const SOURCE_MAP: Record<LeadSource, string> = LEAD_SOURCES.reduce(
  (acc, s) => {
    acc[s.value] = s.label;
    return acc;
  },
  {} as Record<LeadSource, string>,
);

export const INDUSTRIES: OptionDef<Industry>[] = [
  { value: "real_estate", label: "Real Estate" },
  { value: "technology", label: "Technology" },
  { value: "finance", label: "Finance" },
  { value: "healthcare", label: "Healthcare" },
  { value: "construction", label: "Construction" },
  { value: "hospitality", label: "Hospitality" },
  { value: "retail", label: "Retail" },
  { value: "consulting", label: "Consulting" },
  { value: "marketing", label: "Marketing" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "education", label: "Education" },
  { value: "legal", label: "Legal" },
  { value: "other", label: "Other" },
];

export const INDUSTRY_MAP: Record<Industry, string> = INDUSTRIES.reduce(
  (acc, s) => {
    acc[s.value] = s.label;
    return acc;
  },
  {} as Record<Industry, string>,
);

export const COMPANY_SIZES: OptionDef<CompanySize>[] = [
  { value: "1-10", label: "1–10" },
  { value: "11-50", label: "11–50" },
  { value: "51-200", label: "51–200" },
  { value: "201-500", label: "201–500" },
  { value: "501-1000", label: "501–1,000" },
  { value: "1001-5000", label: "1,001–5,000" },
  { value: "5000+", label: "5,000+" },
];

export const TASK_PRIORITIES: OptionDef<TaskPriority>[] = [
  { value: "low", label: "Low", tone: "slate" },
  { value: "medium", label: "Medium", tone: "amber" },
  { value: "high", label: "High", tone: "rose" },
];

export const PRIORITY_MAP: Record<TaskPriority, OptionDef<TaskPriority>> =
  TASK_PRIORITIES.reduce(
    (acc, p) => {
      acc[p.value] = p;
      return acc;
    },
    {} as Record<TaskPriority, OptionDef<TaskPriority>>,
  );

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
