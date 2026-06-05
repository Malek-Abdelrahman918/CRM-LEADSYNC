/**
 * LeadSync OS — Domain Types
 * ---------------------------------------------------------------------------
 * Single source of truth for every entity in the CRM. These interfaces are
 * intentionally backend-agnostic: the same shapes are returned by the Phase 1
 * LocalStorage provider and will be returned by the Phase 2 Supabase provider.
 */

/* -------------------------------------------------------------------------- */
/*  Enumerations (string-literal unions + companion const maps)               */
/* -------------------------------------------------------------------------- */

/**
 * A lead's status === its pipeline stage. Keeping them unified means the
 * Kanban board, the Leads table and the dashboard counters all read from the
 * same field.
 */
export type PipelineStage =
  | "new"
  | "researching"
  | "contacted"
  | "follow_up"
  | "replied"
  | "call_scheduled"
  | "proposal_sent"
  | "client"
  | "lost";

export type LeadStatus = PipelineStage;

export type LeadSource =
  | "apollo"
  | "csv_import"
  | "manual"
  | "linkedin"
  | "referral"
  | "website"
  | "cold_outreach"
  | "event"
  | "other";

export type Industry =
  | "real_estate"
  | "technology"
  | "finance"
  | "healthcare"
  | "construction"
  | "hospitality"
  | "retail"
  | "consulting"
  | "marketing"
  | "manufacturing"
  | "education"
  | "legal"
  | "other";

export type CompanySize =
  | "1-10"
  | "11-50"
  | "51-200"
  | "201-500"
  | "501-1000"
  | "1001-5000"
  | "5000+";

export type TaskPriority = "low" | "medium" | "high";

export type ActivityType =
  | "created"
  | "imported"
  | "status_change"
  | "note_added"
  | "email_sent"
  | "email_received"
  | "call"
  | "meeting"
  | "follow_up_scheduled"
  | "task_created"
  | "task_completed"
  | "enriched"
  | "field_updated";

/* -------------------------------------------------------------------------- */
/*  Core entities                                                              */
/* -------------------------------------------------------------------------- */

export interface Lead {
  id: string;

  /* Profile */
  firstName: string;
  lastName: string;
  /** Cached `${firstName} ${lastName}` for cheap search/sort. */
  fullName: string;
  role: string;
  avatarUrl?: string;

  /* Company */
  company: string;
  companyWebsite?: string;
  industry?: Industry;
  companySize?: CompanySize;
  location?: string;

  /* Contact */
  email?: string;
  phone?: string;
  linkedinUrl?: string;

  /* CRM state */
  status: PipelineStage;
  source: LeadSource;
  /** Computed 0–100 score. Persisted so tables can sort without recompute. */
  score: number;
  tags: string[];
  /** Per-lead expected deal value; falls back to settings.averageDealValue. */
  dealValue?: number;

  /* Lifecycle dates (all ISO-8601 strings) */
  createdAt: string;
  updatedAt: string;
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  /** Set when the lead transitions to `client`. */
  closedAt?: string;

  /* Phase 2 placeholders — populated by the EnrichmentProvider later. */
  enriched?: boolean;
  enrichmentSource?: string;
  enrichmentData?: Record<string, unknown>;
}

/** Fields a user supplies when creating a lead; the rest are derived. */
export type NewLeadInput = Partial<Lead> &
  Pick<Lead, "firstName" | "lastName" | "company">;

export interface Activity {
  id: string;
  leadId: string;
  type: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  createdBy?: string;
}

export interface Note {
  id: string;
  leadId: string;
  content: string;
  author?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  leadId?: string;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  priority: TaskPriority;
  createdAt: string;
  completedAt?: string;
}

export interface AppSettings {
  agencyName: string;
  logoUrl?: string;
  brandColor?: string;

  /* Goals */
  monthlyLeadGoal: number;
  monthlyRevenueGoal: number;
  pipelineValueGoal: number;

  /* Financial assumptions */
  currency: string;
  averageDealValue: number;

  /* Follow-up automation */
  defaultFollowUpDays: number;

  /* Backend selection — flip to "supabase" once that provider is wired up. */
  storageBackend: "local" | "supabase";

  updatedAt: string;
}

/* -------------------------------------------------------------------------- */
/*  Derived / view-model types                                                */
/* -------------------------------------------------------------------------- */

export interface ScoreBreakdownItem {
  label: string;
  points: number;
}

export interface ScoreResult {
  score: number;
  breakdown: ScoreBreakdownItem[];
}

export type FollowUpState = "overdue" | "due_today" | "upcoming" | "none";

export interface FollowUpInfo {
  state: FollowUpState;
  /** Negative when overdue, 0 today, positive when upcoming. */
  daysUntil: number | null;
  date: string | null;
}

export interface DashboardMetrics {
  totalLeads: number;
  newLeads: number;
  contacted: number;
  replies: number;
  callsBooked: number;
  clients: number;
  pipelineValue: number;
  monthlyRevenue: number;
}

export interface FunnelStep {
  stage: PipelineStage;
  label: string;
  count: number;
}

export interface TimeseriesPoint {
  label: string;
  value: number;
}

export interface SourceBreakdown {
  source: LeadSource;
  label: string;
  count: number;
}

/* -------------------------------------------------------------------------- */
/*  Sorting / filtering / pagination contracts (Leads table)                  */
/* -------------------------------------------------------------------------- */

export type SortDirection = "asc" | "desc";

export type LeadSortField =
  | "score"
  | "fullName"
  | "company"
  | "status"
  | "source"
  | "createdAt"
  | "lastContactedAt"
  | "nextFollowUpAt";

export interface LeadFilterState {
  search: string;
  statuses: PipelineStage[];
  sources: LeadSource[];
  industries: Industry[];
  scoreMin: number;
  scoreMax: number;
}

export interface LeadQuery {
  filter: LeadFilterState;
  sortField: LeadSortField;
  sortDirection: SortDirection;
  page: number;
  pageSize: number;
}
