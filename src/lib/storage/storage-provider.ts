/**
 * StorageProvider — the persistence abstraction at the heart of the data layer.
 *
 * Repositories depend ONLY on this interface, never on a concrete store. That is
 * what lets us swap `LocalStorageProvider` (Phase 1) for `SupabaseProvider`
 * (Phase 2) without touching a single repository, hook or component.
 *
 * Every method is async on purpose: LocalStorage is synchronous, but Supabase
 * (and any future network-backed store) is not. Returning Promises now means
 * the swap is a configuration change, not a refactor.
 */
export interface StorageProvider {
  /** Human-readable provider name, useful for diagnostics / Settings. */
  readonly name: string;

  /** Whether the provider can actually be used in the current environment. */
  isAvailable(): boolean;

  /** Read an array collection. Returns `[]` when the key is absent. */
  getCollection<T>(key: string): Promise<T[]>;

  /** Replace an entire array collection. */
  setCollection<T>(key: string, items: T[]): Promise<void>;

  /** Read a single (non-array) value. Returns `null` when absent. */
  getItem<T>(key: string): Promise<T | null>;

  /** Write a single (non-array) value. */
  setItem<T>(key: string, value: T): Promise<void>;

  /** Remove a single key. */
  remove(key: string): Promise<void>;

  /** Remove every key owned by the app (optionally filtered by prefix). */
  clearAll(prefix?: string): Promise<void>;
}
