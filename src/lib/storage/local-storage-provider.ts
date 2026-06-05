import type { StorageProvider } from "./storage-provider";

/**
 * LocalStorageProvider — Phase 1 persistence backed by `window.localStorage`.
 *
 * SSR-safe: when `window` is unavailable (server render) reads resolve to empty
 * values and writes become no-ops, so the app renders a neutral shell on the
 * server and hydrates real data on the client.
 */
export class LocalStorageProvider implements StorageProvider {
  readonly name = "LocalStorage";

  private get store(): Storage | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage;
    } catch {
      // Private-mode / disabled storage.
      return null;
    }
  }

  isAvailable(): boolean {
    return this.store !== null;
  }

  async getCollection<T>(key: string): Promise<T[]> {
    const raw = this.store?.getItem(key);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      console.warn(`[LocalStorageProvider] Corrupt collection at "${key}"`);
      return [];
    }
  }

  async setCollection<T>(key: string, items: T[]): Promise<void> {
    this.store?.setItem(key, JSON.stringify(items));
  }

  async getItem<T>(key: string): Promise<T | null> {
    const raw = this.store?.getItem(key);
    if (raw === null || raw === undefined) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      console.warn(`[LocalStorageProvider] Corrupt item at "${key}"`);
      return null;
    }
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    this.store?.setItem(key, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    this.store?.removeItem(key);
  }

  async clearAll(prefix = "leadsync."): Promise<void> {
    const store = this.store;
    if (!store) return;
    const toRemove: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (key && key.startsWith(prefix)) toRemove.push(key);
    }
    toRemove.forEach((k) => store.removeItem(k));
  }
}
