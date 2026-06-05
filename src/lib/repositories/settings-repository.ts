import type { StorageProvider } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/constants";
import { nowIso } from "@/lib/id";
import { APP_CONFIG } from "@/lib/config/app-config";
import type { AppSettings } from "@/lib/types";

export const DEFAULT_SETTINGS: AppSettings = {
  agencyName: "LeadSync Agency",
  brandColor: "#7c5cff",
  monthlyLeadGoal: 120,
  monthlyRevenueGoal: 60000,
  pipelineValueGoal: 300000,
  currency: "USD",
  averageDealValue: 5000,
  defaultFollowUpDays: 3,
  storageBackend: APP_CONFIG.storage.backend,
  updatedAt: "1970-01-01T00:00:00.000Z",
};

/** Settings are a singleton record, so this repository is intentionally flat. */
export class SettingsRepository {
  constructor(private readonly storage: StorageProvider) {}

  async get(): Promise<AppSettings> {
    const stored = await this.storage.getItem<AppSettings>(STORAGE_KEYS.settings);
    return { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
  }

  async update(patch: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.get();
    const next: AppSettings = { ...current, ...patch, updatedAt: nowIso() };
    await this.storage.setItem(STORAGE_KEYS.settings, next);
    return next;
  }

  async reset(): Promise<AppSettings> {
    const next: AppSettings = { ...DEFAULT_SETTINGS, updatedAt: nowIso() };
    await this.storage.setItem(STORAGE_KEYS.settings, next);
    return next;
  }
}
