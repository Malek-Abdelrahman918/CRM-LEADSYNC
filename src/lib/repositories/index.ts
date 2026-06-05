/**
 * Repository registry.
 *
 * Instantiates one repository per entity, all sharing the single configured
 * `StorageProvider`. Application code imports these singletons; it never touches
 * the storage provider directly. Swapping LocalStorage → Supabase happens in the
 * storage factory, invisible to everything here and above.
 */

import { getStorageProvider } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/constants";
import { buildSeedData } from "@/data/seed";
import type { Activity, AppSettings, Lead, Note, Task } from "@/lib/types";

import { LeadRepository } from "./lead-repository";
import { ActivityRepository } from "./activity-repository";
import { NoteRepository } from "./note-repository";
import { TaskRepository } from "./task-repository";
import { SettingsRepository, DEFAULT_SETTINGS } from "./settings-repository";

const storage = getStorageProvider();

export const leadRepository = new LeadRepository(storage);
export const activityRepository = new ActivityRepository(storage);
export const noteRepository = new NoteRepository(storage);
export const taskRepository = new TaskRepository(storage);
export const settingsRepository = new SettingsRepository(storage);

export {
  LeadRepository,
  ActivityRepository,
  NoteRepository,
  TaskRepository,
  SettingsRepository,
  DEFAULT_SETTINGS,
};

/* -------------------------------------------------------------------------- */
/*  Whole-database backup helpers (Settings → Export / Import Data)           */
/* -------------------------------------------------------------------------- */

export interface BackupBundle {
  app: "LeadSync OS";
  version: number;
  exportedAt: string;
  leads: Lead[];
  activities: Activity[];
  notes: Note[];
  tasks: Task[];
  settings: AppSettings;
}

export async function exportAllData(): Promise<BackupBundle> {
  const [leads, activities, notes, tasks, settings] = await Promise.all([
    leadRepository.getAll(),
    activityRepository.getAll(),
    noteRepository.getAll(),
    taskRepository.getAll(),
    settingsRepository.get(),
  ]);
  return {
    app: "LeadSync OS",
    version: 1,
    exportedAt: new Date().toISOString(),
    leads,
    activities,
    notes,
    tasks,
    settings,
  };
}

export async function importAllData(bundle: Partial<BackupBundle>): Promise<void> {
  await Promise.all([
    leadRepository.replaceAll(bundle.leads ?? []),
    activityRepository.replaceAll(bundle.activities ?? []),
    noteRepository.replaceAll(bundle.notes ?? []),
    taskRepository.replaceAll(bundle.tasks ?? []),
    bundle.settings ? settingsRepository.update(bundle.settings) : Promise.resolve(),
  ]);
  // Imported data is the user's own — never treat it as sample.
  await storage.setItem(STORAGE_KEYS.seeded, true);
  await storage.setItem(STORAGE_KEYS.sample, false);
}

export async function clearAllData(): Promise<void> {
  await storage.clearAll(STORAGE_KEYS.leads.split(".")[0] + ".");
  // Keep the seed guard set so the sample data does NOT reappear on next load,
  // and flag the (now empty) workspace as the user's own — not sample.
  await storage.setItem(STORAGE_KEYS.seeded, true);
  await storage.setItem(STORAGE_KEYS.sample, false);
}

/** Whether the workspace currently holds the untouched sample dataset. */
export async function isSampleData(): Promise<boolean> {
  const flag = await storage.getItem<boolean>(STORAGE_KEYS.sample);
  if (flag !== null) return flag;
  // Backfill for workspaces seeded before the sample flag existed: infer from
  // the presence of a known seed record, then persist the result.
  const inferred = (await leadRepository.getById("seed-1")) !== null;
  await storage.setItem(STORAGE_KEYS.sample, inferred);
  return inferred;
}

/** Stop treating the current data as sample (e.g. once the user adds their own). */
export async function markNotSample(): Promise<void> {
  await storage.setItem(STORAGE_KEYS.sample, false);
}

/* -------------------------------------------------------------------------- */
/*  First-run seeding                                                          */
/* -------------------------------------------------------------------------- */

async function writeSeed() {
  const seed = buildSeedData();
  await Promise.all([
    leadRepository.replaceAll(seed.leads),
    activityRepository.replaceAll(seed.activities),
    noteRepository.replaceAll(seed.notes),
    taskRepository.replaceAll(seed.tasks),
  ]);
  await storage.setItem(STORAGE_KEYS.seeded, true);
  await storage.setItem(STORAGE_KEYS.sample, true);
  return seed;
}

/** Seed realistic sample data on first run (no-op if data already exists). */
export async function seedIfEmpty(): Promise<boolean> {
  const seededFlag = await storage.getItem<boolean>(STORAGE_KEYS.seeded);
  const existing = await leadRepository.count();
  if (seededFlag || existing > 0) return false;
  await writeSeed();
  return true;
}

/** Wipe everything and re-load the sample dataset (Settings → "Load sample data"). */
export async function reseed(): Promise<void> {
  await clearAllData();
  await writeSeed();
}
