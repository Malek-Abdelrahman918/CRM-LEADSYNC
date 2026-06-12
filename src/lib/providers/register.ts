/**
 * Registers concrete Phase 2 providers into the registry declared in Phase 1.
 * Called once from the client root (StoreProvider). Future integrations
 * (Apollo LeadProvider/EnrichmentProvider, n8n OutreachProvider, Supabase
 * CRMProvider) register here the same way.
 */

import { registerProvider } from "@/lib/providers-future";
import { useCrmStore } from "@/store/use-crm-store";
import { ApiAIProvider } from "./api-ai-provider";

let registered = false;

export function registerRuntimeProviders(): void {
  if (registered) return;
  registered = true;

  registerProvider(
    "ai",
    new ApiAIProvider(() => useCrmStore.getState().settings.agencyName),
  );
}
