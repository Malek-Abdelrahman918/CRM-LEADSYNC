/**
 * Future provider registry (Phase 2 / Phase 3).
 *
 * These are the integration seams the whole app is designed around. In Phase 1
 * every slot is `null` — UI surfaces that depend on them stay hidden behind the
 * feature flags in `APP_CONFIG.features`. To activate an integration later you
 * implement the interface and register the instance here; nothing else changes.
 *
 *   LeadProvider        → Apollo API (lead sourcing)
 *   EnrichmentProvider  → Apollo / FullEnrich (auto-enrichment)
 *   AIProvider          → OpenAI / Claude API (drafting, summaries, scoring)
 *   OutreachProvider    → n8n Webhooks (send + open/click/reply tracking)
 *   CRMProvider         → Supabase (remote sync / realtime)
 */

export type { LeadProvider, LeadSearchQuery, LeadSearchResult, ProviderLead } from "./lead-provider";
export type { EnrichmentProvider, EnrichmentRequest, EnrichmentResult } from "./enrichment-provider";
export type { AIProvider, AIMessage, AICompletionOptions } from "./ai-provider";
export type {
  OutreachProvider,
  OutreachMessage,
  OutreachResult,
  OutreachEvent,
  OutreachChannel,
  OutreachEventType,
} from "./outreach-provider";
export type { CRMProvider, CRMSyncResult } from "./crm-provider";

import type { LeadProvider } from "./lead-provider";
import type { EnrichmentProvider } from "./enrichment-provider";
import type { AIProvider } from "./ai-provider";
import type { OutreachProvider } from "./outreach-provider";
import type { CRMProvider } from "./crm-provider";

interface ProviderRegistry {
  lead: LeadProvider | null;
  enrichment: EnrichmentProvider | null;
  ai: AIProvider | null;
  outreach: OutreachProvider | null;
  crm: CRMProvider | null;
}

/** Phase 1: all null. Phase 2+: assign concrete instances here. */
const registry: ProviderRegistry = {
  lead: null,
  enrichment: null,
  ai: null,
  outreach: null,
  crm: null,
};

export const getLeadProvider = (): LeadProvider | null => registry.lead;
export const getEnrichmentProvider = (): EnrichmentProvider | null => registry.enrichment;
export const getAIProvider = (): AIProvider | null => registry.ai;
export const getOutreachProvider = (): OutreachProvider | null => registry.outreach;
export const getCRMProvider = (): CRMProvider | null => registry.crm;

export function registerProvider<K extends keyof ProviderRegistry>(
  key: K,
  instance: ProviderRegistry[K],
): void {
  registry[key] = instance;
}
