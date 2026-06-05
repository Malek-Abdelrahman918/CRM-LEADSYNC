/**
 * CRMProvider — Phase 2/3 abstraction for a remote system-of-record + SYNC.
 *
 * Concrete implementation target: **Supabase** (and/or external CRMs). NOT
 * implemented in Phase 1.
 *
 * Note the separation of concerns: `StorageProvider` is local persistence;
 * `CRMProvider` is multi-device sync / realtime on top of it. Supabase happens
 * to be a natural fit for both, but they remain distinct seams.
 */

import type { Lead } from "@/lib/types";

export interface CRMSyncResult {
  pulled: number;
  pushed: number;
  conflicts: number;
}

export interface CRMProvider {
  readonly id: string;

  /** Fetch leads changed since an ISO timestamp (or all when omitted). */
  pull(since?: string): Promise<Lead[]>;

  /** Push local leads upstream. */
  push(leads: Lead[]): Promise<void>;

  /** Two-way reconcile. */
  sync(localLeads: Lead[]): Promise<CRMSyncResult>;

  /** Optional realtime subscription; returns an unsubscribe fn. */
  subscribe?(onChange: (leads: Lead[]) => void): () => void;
}
