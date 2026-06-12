"use client";

import * as React from "react";
import type { Session } from "@supabase/supabase-js";

import { getSupabaseClient } from "./client";

/**
 * Reactive Supabase session.
 * `undefined` = still resolving · `null` = signed out · `Session` = signed in.
 */
export function useSession(): Session | null | undefined {
  const client = getSupabaseClient();
  const [session, setSession] = React.useState<Session | null | undefined>(
    client ? undefined : null,
  );

  React.useEffect(() => {
    if (!client) return;
    let mounted = true;

    client.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session);
    });

    const { data } = client.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, [client]);

  return session;
}

export async function signOut(): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  await client.auth.signOut();
  // Full reload guarantees the store re-hydrates cleanly for the next user.
  if (typeof window !== "undefined") window.location.reload();
}
