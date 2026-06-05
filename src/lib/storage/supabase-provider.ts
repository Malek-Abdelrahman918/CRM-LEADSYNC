import type { StorageProvider } from "./storage-provider";

/**
 * SupabaseProvider — Phase 2 persistence (NOT YET IMPLEMENTED).
 *
 * This class exists today purely to prove the abstraction holds: it implements
 * the exact same `StorageProvider` contract as `LocalStorageProvider`, so the
 * factory in `./index.ts` can return it instead with zero changes elsewhere.
 *
 * Implementation roadmap (Phase 2):
 *   1. `npm i @supabase/supabase-js`
 *   2. Create a client from APP_CONFIG.integrations.supabase.{url,anonKey}.
 *   3. Map each `key` (e.g. "leadsync.leads") to a Postgres table.
 *   4. Replace the bodies below with `.select()` / `.upsert()` / `.delete()`.
 *   5. Set NEXT_PUBLIC_STORAGE_BACKEND=supabase.
 *
 * Until then every method throws so misconfiguration fails loudly instead of
 * silently losing data.
 */
export class SupabaseProvider implements StorageProvider {
  readonly name = "Supabase";

  constructor(
    private readonly url?: string,
    private readonly anonKey?: string,
  ) {
    void this.url;
    void this.anonKey;
  }

  private notImplemented(method: string): never {
    throw new Error(
      `SupabaseProvider.${method}() is not implemented yet (Phase 2). ` +
        `Set NEXT_PUBLIC_STORAGE_BACKEND=local to use the Phase 1 backend.`,
    );
  }

  isAvailable(): boolean {
    return false;
  }

  async getCollection<T>(_key: string): Promise<T[]> {
    return this.notImplemented("getCollection");
  }

  async setCollection<T>(_key: string, _items: T[]): Promise<void> {
    return this.notImplemented("setCollection");
  }

  async getItem<T>(_key: string): Promise<T | null> {
    return this.notImplemented("getItem");
  }

  async setItem<T>(_key: string, _value: T): Promise<void> {
    return this.notImplemented("setItem");
  }

  async remove(_key: string): Promise<void> {
    return this.notImplemented("remove");
  }

  async clearAll(_prefix?: string): Promise<void> {
    return this.notImplemented("clearAll");
  }
}
