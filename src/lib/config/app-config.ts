/**
 * LeadSync OS — central runtime configuration.
 *
 * Every future integration (Supabase, OpenAI, Claude, Apollo, n8n) is declared
 * here behind a feature flag and reads from environment variables. Phase 1 ships
 * with everything disabled and the `local` storage backend selected, so the app
 * is fully functional with zero environment configuration.
 *
 * To go live with Phase 2 you only flip a flag / set an env var — no component
 * code needs to change.
 */

type StorageBackend = "local" | "supabase";

function env(key: string): string | undefined {
  // Guarded so this is safe in both server and browser bundles.
  if (typeof process === "undefined" || !process.env) return undefined;
  return process.env[key];
}

function flag(key: string, fallback = false): boolean {
  const v = env(key);
  if (v === undefined) return fallback;
  return v === "true" || v === "1";
}

export const APP_CONFIG = {
  appName: "LeadSync OS",
  appDescription: "AI-powered sales operating system",
  version: "1.0.0",
  phase: 1,

  storage: {
    /** Switch to "supabase" once the SupabaseProvider is implemented. */
    backend: (env("NEXT_PUBLIC_STORAGE_BACKEND") as StorageBackend) ?? "local",
  },

  /** Phase 2 / Phase 3 integrations — declared, not yet implemented. */
  integrations: {
    supabase: {
      enabled: flag("NEXT_PUBLIC_SUPABASE_ENABLED"),
      url: env("NEXT_PUBLIC_SUPABASE_URL"),
      anonKey: env("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    },
    openai: {
      enabled: flag("OPENAI_ENABLED"),
      apiKey: env("OPENAI_API_KEY"),
      model: env("OPENAI_MODEL") ?? "gpt-4o",
    },
    anthropic: {
      enabled: flag("ANTHROPIC_ENABLED"),
      apiKey: env("ANTHROPIC_API_KEY"),
      model: env("ANTHROPIC_MODEL") ?? "claude-opus-4-8",
    },
    apollo: {
      enabled: flag("APOLLO_ENABLED"),
      apiKey: env("APOLLO_API_KEY"),
    },
    n8n: {
      enabled: flag("N8N_ENABLED"),
      webhookBaseUrl: env("N8N_WEBHOOK_BASE_URL"),
    },
  },

  /** High-level capability switches the UI can read to reveal Phase 2 surfaces. */
  features: {
    leadEnrichment: flag("FEATURE_ENRICHMENT"),
    aiDrafting: flag("FEATURE_AI_DRAFTING"),
    outreachTracking: flag("FEATURE_OUTREACH"),
    realtimeSync: flag("FEATURE_REALTIME"),
  },
} as const;

export type AppConfig = typeof APP_CONFIG;
