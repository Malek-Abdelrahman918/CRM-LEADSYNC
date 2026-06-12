"use client";

import * as React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

import { useCrmStore } from "@/store/use-crm-store";
import { Logo } from "@/components/layout/logo";
import { AuthScreen } from "@/components/auth/auth-screen";
import { APP_CONFIG } from "@/lib/config/app-config";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useSession } from "@/lib/supabase/use-session";
import { registerRuntimeProviders } from "@/lib/providers/register";

// Register concrete Phase 2 providers (AI today; Apollo/n8n later) exactly once
// per client. Components consume them via the provider registry.
registerRuntimeProviders();

function Splash({ label }: { label: string }) {
  return (
    <div className="bg-background flex min-h-dvh flex-col items-center justify-center gap-6">
      <Logo />
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" />
        {label}
      </div>
    </div>
  );
}

function ConfigError() {
  return (
    <div className="bg-background flex min-h-dvh items-center justify-center p-6">
      <div className="max-w-md space-y-3 rounded-xl border border-amber-400/30 bg-amber-500/10 p-6">
        <div className="flex items-center gap-2 font-medium text-amber-300">
          <AlertTriangle className="size-4" />
          Supabase backend selected, but not configured
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          <code className="text-foreground">NEXT_PUBLIC_STORAGE_BACKEND</code> is set
          to <code className="text-foreground">supabase</code>, but{" "}
          <code className="text-foreground">NEXT_PUBLIC_SUPABASE_URL</code> /{" "}
          <code className="text-foreground">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> are
          missing. Add them to your environment (see <code>.env.example</code>) or
          switch the backend back to <code className="text-foreground">local</code>.
        </p>
      </div>
    </div>
  );
}

/** Hydrates the CRM store from the active storage provider, then renders the app. */
function Hydrator({ children }: { children: React.ReactNode }) {
  const hydrated = useCrmStore((s) => s.hydrated);
  const hydrate = useCrmStore((s) => s.hydrate);

  React.useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!hydrated) return <Splash label="Loading your workspace…" />;
  return <>{children}</>;
}

/** Supabase mode: require a session before touching the database. */
function SupabaseGate({ children }: { children: React.ReactNode }) {
  const session = useSession();

  if (!isSupabaseConfigured()) return <ConfigError />;
  if (session === undefined) return <Splash label="Checking your session…" />;
  if (session === null) return <AuthScreen />;
  return <Hydrator>{children}</Hydrator>;
}

/**
 * Top-level data gate.
 *
 * - `local` backend (Phase 1 default): hydrate straight from LocalStorage.
 * - `supabase` backend (Phase 2): authenticate first, then hydrate via RLS-scoped
 *   queries. Same store, same repositories — only the gate differs.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  if (APP_CONFIG.storage.backend === "supabase") {
    return <SupabaseGate>{children}</SupabaseGate>;
  }
  return <Hydrator>{children}</Hydrator>;
}
