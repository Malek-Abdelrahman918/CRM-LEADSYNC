import { APP_CONFIG } from "@/lib/config/app-config";
import { LocalStorageProvider } from "./local-storage-provider";
import { SupabaseProvider } from "./supabase-provider";
import type { StorageProvider } from "./storage-provider";

export type { StorageProvider } from "./storage-provider";
export { LocalStorageProvider } from "./local-storage-provider";
export { SupabaseProvider } from "./supabase-provider";

let cached: StorageProvider | null = null;

/**
 * Factory that returns the active storage provider based on configuration.
 * This is the ONLY place that knows which concrete provider is in use.
 */
export function getStorageProvider(): StorageProvider {
  if (cached) return cached;

  switch (APP_CONFIG.storage.backend) {
    case "supabase":
      cached = new SupabaseProvider();
      break;
    case "local":
    default:
      cached = new LocalStorageProvider();
      break;
  }

  return cached;
}

/** Test/teardown helper — forces the factory to rebuild on next call. */
export function resetStorageProvider(): void {
  cached = null;
}
