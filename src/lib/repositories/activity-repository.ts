import { BaseRepository } from "./base-repository";
import type { StorageProvider } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/constants";
import { generateId, nowIso } from "@/lib/id";
import type { Activity, ActivityType } from "@/lib/types";

export interface LogActivityInput {
  leadId: string;
  type: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
}

export class ActivityRepository extends BaseRepository<Activity> {
  constructor(storage: StorageProvider) {
    super(storage, STORAGE_KEYS.activities);
  }

  async log(input: LogActivityInput): Promise<Activity> {
    return this.insert({
      id: generateId("act"),
      createdAt: nowIso(),
      ...input,
    });
  }

  /** Batch log (single write) — used by CSV import. */
  async logMany(inputs: LogActivityInput[]): Promise<Activity[]> {
    const now = nowIso();
    const acts = inputs.map((input) => ({
      id: generateId("act"),
      createdAt: now,
      ...input,
    }));
    return this.insertMany(acts);
  }

  async getByLead(leadId: string): Promise<Activity[]> {
    const all = await this.getAll();
    return all
      .filter((a) => a.leadId === leadId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /** Most recent activity across all leads, newest first. */
  async getRecent(limit = 12): Promise<Activity[]> {
    const all = await this.getAll();
    return all
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  async deleteByLead(leadId: string): Promise<void> {
    await this.deleteWhere((a) => a.leadId === leadId);
  }
}
