/**
 * LeadProvider — Phase 2 abstraction for external lead SOURCES.
 *
 * Concrete implementation target: **Apollo API** (also FullEnrich / Vibe
 * Prospecting search). NOT implemented in Phase 1 — interface only.
 *
 * A provider returns `ProviderLead`s which map cleanly onto `NewLeadInput`, so
 * importing search results reuses the exact same path as CSV import.
 */

import type { CompanySize, Industry } from "@/lib/types";

export interface LeadSearchQuery {
  keywords?: string;
  titles?: string[];
  industries?: Industry[];
  locations?: string[];
  companySizes?: CompanySize[];
  page?: number;
  perPage?: number;
}

export interface ProviderLead {
  externalId: string;
  firstName: string;
  lastName: string;
  role?: string;
  company?: string;
  companyWebsite?: string;
  industry?: Industry;
  companySize?: CompanySize;
  location?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  raw?: unknown;
}

export interface LeadSearchResult {
  leads: ProviderLead[];
  total: number;
  page: number;
}

export interface LeadProvider {
  readonly id: string;
  search(query: LeadSearchQuery): Promise<LeadSearchResult>;
  fetchById(externalId: string): Promise<ProviderLead | null>;
}
