/**
 * useCrmStore — the single reactive source of truth for the UI.
 *
 * The store mirrors the repositories in memory for fast, synchronous reads in
 * React, while every mutation is written through the repository (and therefore
 * the configured StorageProvider). Because all persistence flows through the
 * data layer, switching LocalStorage → Supabase requires no change here.
 */

"use client";

import { create } from "zustand";
import {
  leadRepository,
  activityRepository,
  noteRepository,
  taskRepository,
  settingsRepository,
  exportAllData,
  importAllData,
  clearAllData,
  reseed,
  seedIfEmpty,
  DEFAULT_SETTINGS,
  type BackupBundle,
} from "@/lib/repositories";
import { STAGE_MAP } from "@/lib/constants";
import { nowIso } from "@/lib/id";
import type { NewTaskInput } from "@/lib/repositories/task-repository";
import type { LogActivityInput } from "@/lib/repositories/activity-repository";
import type {
  Activity,
  AppSettings,
  Lead,
  NewLeadInput,
  Note,
  PipelineStage,
  Task,
} from "@/lib/types";

const CONTACT_TYPES: Activity["type"][] = [
  "email_sent",
  "email_received",
  "call",
  "meeting",
];

interface CrmState {
  hydrated: boolean;
  leads: Lead[];
  activities: Activity[];
  notes: Note[];
  tasks: Task[];
  settings: AppSettings;

  /* lifecycle */
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;

  /* leads */
  addLead: (input: NewLeadInput) => Promise<Lead>;
  updateLead: (id: string, patch: Partial<Lead>) => Promise<void>;
  updateLeadStatus: (id: string, status: PipelineStage) => Promise<void>;
  scheduleFollowUp: (id: string, dateIso: string | undefined) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  deleteLeads: (ids: string[]) => Promise<void>;
  bulkUpdateStatus: (ids: string[], status: PipelineStage) => Promise<void>;
  importLeads: (inputs: NewLeadInput[], source?: string) => Promise<number>;

  /* activities */
  logTouchpoint: (input: LogActivityInput) => Promise<void>;

  /* notes */
  addNote: (leadId: string, content: string) => Promise<void>;
  updateNote: (id: string, content: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;

  /* tasks */
  addTask: (input: NewTaskInput) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  /* settings */
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;

  /* data management */
  exportData: () => Promise<BackupBundle>;
  importData: (bundle: Partial<BackupBundle>) => Promise<void>;
  clearData: () => Promise<void>;
  loadSampleData: () => Promise<void>;
}

export const useCrmStore = create<CrmState>((set, get) => ({
  hydrated: false,
  leads: [],
  activities: [],
  notes: [],
  tasks: [],
  settings: DEFAULT_SETTINGS,

  hydrate: async () => {
    if (get().hydrated) return;
    await seedIfEmpty();
    await get().refresh();
    set({ hydrated: true });
  },

  refresh: async () => {
    const [leads, activities, notes, tasks, settings] = await Promise.all([
      leadRepository.getAll(),
      activityRepository.getAll(),
      noteRepository.getAll(),
      taskRepository.getAll(),
      settingsRepository.get(),
    ]);
    set({ leads, activities, notes, tasks, settings });
  },

  addLead: async (input) => {
    const lead = await leadRepository.create(input);
    const activity = await activityRepository.log({
      leadId: lead.id,
      type: "created",
      title: "Lead created",
      description: "Added manually",
    });
    set((s) => ({ leads: [lead, ...s.leads], activities: [activity, ...s.activities] }));
    return lead;
  },

  updateLead: async (id, patch) => {
    const prev = get().leads.find((l) => l.id === id);
    const updated = await leadRepository.update(id, patch);
    if (!updated) return;

    const newActivities: Activity[] = [];
    if (patch.status && prev && patch.status !== prev.status) {
      newActivities.push(
        await activityRepository.log({
          leadId: id,
          type: "status_change",
          title: `Moved to ${STAGE_MAP[patch.status].label}`,
        }),
      );
    }
    if (patch.nextFollowUpAt && patch.nextFollowUpAt !== prev?.nextFollowUpAt) {
      newActivities.push(
        await activityRepository.log({
          leadId: id,
          type: "follow_up_scheduled",
          title: "Follow-up scheduled",
        }),
      );
    }

    set((s) => ({
      leads: s.leads.map((l) => (l.id === id ? updated : l)),
      activities: [...newActivities, ...s.activities],
    }));
  },

  updateLeadStatus: async (id, status) => {
    await get().updateLead(id, status === "client" ? { status, closedAt: nowIso() } : { status });
  },

  scheduleFollowUp: async (id, dateIso) => {
    await get().updateLead(id, { nextFollowUpAt: dateIso });
  },

  deleteLead: async (id) => {
    await Promise.all([
      leadRepository.deleteById(id),
      activityRepository.deleteByLead(id),
      noteRepository.deleteByLead(id),
      taskRepository.deleteByLead(id),
    ]);
    set((s) => ({
      leads: s.leads.filter((l) => l.id !== id),
      activities: s.activities.filter((a) => a.leadId !== id),
      notes: s.notes.filter((n) => n.leadId !== id),
      tasks: s.tasks.filter((t) => t.leadId !== id),
    }));
  },

  deleteLeads: async (ids) => {
    const set_ = new Set(ids);
    await leadRepository.deleteMany(ids);
    await Promise.all(ids.map((id) => activityRepository.deleteByLead(id)));
    await Promise.all(ids.map((id) => noteRepository.deleteByLead(id)));
    await Promise.all(ids.map((id) => taskRepository.deleteByLead(id)));
    set((s) => ({
      leads: s.leads.filter((l) => !set_.has(l.id)),
      activities: s.activities.filter((a) => !set_.has(a.leadId)),
      notes: s.notes.filter((n) => !set_.has(n.leadId)),
      tasks: s.tasks.filter((t) => !(t.leadId && set_.has(t.leadId))),
    }));
  },

  bulkUpdateStatus: async (ids, status) => {
    for (const id of ids) {
      await leadRepository.update(id, status === "client" ? { status, closedAt: nowIso() } : { status });
    }
    const activities = await activityRepository.logMany(
      ids.map((id) => ({
        leadId: id,
        type: "status_change" as const,
        title: `Moved to ${STAGE_MAP[status].label}`,
      })),
    );
    const updatedLeads = await leadRepository.getAll();
    set((s) => ({ leads: updatedLeads, activities: [...activities, ...s.activities] }));
  },

  importLeads: async (inputs, source = "CSV import") => {
    const created = await leadRepository.createMany(inputs);
    const activities = await activityRepository.logMany(
      created.map((lead) => ({
        leadId: lead.id,
        type: "imported" as const,
        title: "Imported lead",
        description: `Imported via ${source}`,
      })),
    );
    set((s) => ({
      leads: [...created, ...s.leads],
      activities: [...activities, ...s.activities],
    }));
    return created.length;
  },

  logTouchpoint: async (input) => {
    const activity = await activityRepository.log(input);
    let updatedLead: Lead | null = null;
    if (CONTACT_TYPES.includes(input.type)) {
      updatedLead = await leadRepository.update(input.leadId, {
        lastContactedAt: nowIso(),
      });
    }
    set((s) => ({
      activities: [activity, ...s.activities],
      leads: updatedLead
        ? s.leads.map((l) => (l.id === updatedLead!.id ? updatedLead! : l))
        : s.leads,
    }));
  },

  addNote: async (leadId, content) => {
    const note = await noteRepository.create({ leadId, content, author: "You" });
    const activity = await activityRepository.log({
      leadId,
      type: "note_added",
      title: "Note added",
    });
    set((s) => ({ notes: [note, ...s.notes], activities: [activity, ...s.activities] }));
  },

  updateNote: async (id, content) => {
    const updated = await noteRepository.updateContent(id, content);
    if (!updated) return;
    set((s) => ({ notes: s.notes.map((n) => (n.id === id ? updated : n)) }));
  },

  deleteNote: async (id) => {
    await noteRepository.deleteById(id);
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }));
  },

  addTask: async (input) => {
    const task = await taskRepository.create(input);
    const activities: Activity[] = [];
    if (input.leadId) {
      activities.push(
        await activityRepository.log({
          leadId: input.leadId,
          type: "task_created",
          title: `Task: ${input.title}`,
        }),
      );
    }
    set((s) => ({ tasks: [task, ...s.tasks], activities: [...activities, ...s.activities] }));
  },

  toggleTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const updated = await taskRepository.setCompleted(id, !task.completed);
    if (!updated) return;
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? updated : t)) }));
  },

  updateTask: async (id, patch) => {
    const updated = await taskRepository.update(id, patch);
    if (!updated) return;
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? updated : t)) }));
  },

  deleteTask: async (id) => {
    await taskRepository.deleteById(id);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },

  updateSettings: async (patch) => {
    const next = await settingsRepository.update(patch);
    set({ settings: next });
  },

  resetSettings: async () => {
    const next = await settingsRepository.reset();
    set({ settings: next });
  },

  exportData: async () => exportAllData(),

  importData: async (bundle) => {
    await importAllData(bundle);
    await get().refresh();
  },

  clearData: async () => {
    await clearAllData();
    set({
      leads: [],
      activities: [],
      notes: [],
      tasks: [],
      settings: { ...DEFAULT_SETTINGS, updatedAt: nowIso() },
    });
  },

  loadSampleData: async () => {
    await reseed();
    await get().refresh();
  },
}));
