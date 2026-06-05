/**
 * EnrichmentProvider — Phase 2 abstraction for automated lead ENRICHMENT.
 *
 * Concrete implementation target: **Apollo / FullEnrich**. NOT implemented in
 * Phase 1 — interface only.
 *
 * Results are merged back onto a Lead (and `Lead.enriched` flipped to true),
 * after which `LeadRepository.recomputeScore` is called so newly discovered
 * emails / titles immediately affect the score.
 */

import type { CompanySize, Industry } from "@/lib/types";

export interface EnrichmentRequest {
  leadId?: string;
  fullName?: string;
  company?: string;
  domain?: string;
  email?: string;
  linkedinUrl?: string;
}

export interface EnrichmentResult {
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  role?: string;
  industry?: Industry;
  companySize?: CompanySize;
  location?: string;
  /** 0–1 confidence from the upstream provider. */
  confidence?: number;
  source?: string;
  raw?: unknown;
}

export interface EnrichmentProvider {
  readonly id: string;
  enrich(request: EnrichmentRequest): Promise<EnrichmentResult>;
  enrichBulk(requests: EnrichmentRequest[]): Promise<EnrichmentResult[]>;
}
