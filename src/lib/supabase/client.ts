import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { APP_CONFIG } from "@/lib/config/app-config";

let cached: SupabaseClient | null | undefined;

/**
 * Shared Supabase client singleton.
 *
 * Returns `null` when the NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
 * environment variables are not set, so the rest of the app can degrade
 * gracefully instead of crashing at import time.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const { url, anonKey } = APP_CONFIG.integrations.supabase;
  cached = url && anonKey ? createClient(url, anonKey) : null;
  return cached;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseClient() !== null;
}
