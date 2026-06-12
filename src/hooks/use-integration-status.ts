"use client";

import * as React from "react";

export interface IntegrationStatus {
  supabase: boolean;
  anthropic: boolean;
  openai: boolean;
  apollo: boolean;
  n8n: boolean;
  ai: boolean;
}

const FALLBACK: IntegrationStatus = {
  supabase: false,
  anthropic: false,
  openai: false,
  apollo: false,
  n8n: false,
  ai: false,
};

let cache: Promise<IntegrationStatus> | null = null;

function fetchStatus(): Promise<IntegrationStatus> {
  cache ??= fetch("/api/integrations/status")
    .then((res) => (res.ok ? res.json() : FALLBACK))
    .catch(() => FALLBACK);
  return cache;
}

/**
 * Which integrations are configured on the server (booleans only).
 * `null` while loading; module-cached so the whole app makes one request.
 */
export function useIntegrationStatus(): IntegrationStatus | null {
  const [status, setStatus] = React.useState<IntegrationStatus | null>(null);

  React.useEffect(() => {
    let mounted = true;
    fetchStatus().then((s) => {
      if (mounted) setStatus(s);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return status;
}
