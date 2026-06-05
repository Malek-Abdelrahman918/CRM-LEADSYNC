import { BaseRepository } from "./base-repository";
import type { StorageProvider } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/constants";
import { generateId, nowIso } from "@/lib/id";
import type { Task, TaskPriority } from "@/lib/types";

export interface NewTaskInput {
  leadId?: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
}

export class TaskRepository extends BaseRepository<Task> {
  constructor(storage: StorageProvider) {
    super(storage, STORAGE_KEYS.tasks);
  }

  async create(input: NewTaskInput): Promise<Task> {
    return this.insert({
      id: generateId("task"),
      leadId: input.leadId,
      title: input.title,
      description: input.description,
      dueDate: input.dueDate,
      priority: input.priority ?? "medium",
      completed: false,
      createdAt: nowIso(),
    });
  }

  async update(id: string, changes: Partial<Task>): Promise<Task | null> {
    return this.patch(id, changes);
  }

  async setCompleted(id: string, completed: boolean): Promise<Task | null> {
    return this.patch(id, {
      completed,
      completedAt: completed ? nowIso() : undefined,
    });
  }

  async getByLead(leadId: string): Promise<Task[]> {
    const all = await this.getAll();
    return all
      .filter((t) => t.leadId === leadId)
      .sort((a, b) => Number(a.completed) - Number(b.completed));
  }

  async getOpen(): Promise<Task[]> {
    const all = await this.getAll();
    return all.filter((t) => !t.completed);
  }

  async deleteByLead(leadId: string): Promise<void> {
    await this.deleteWhere((t) => t.leadId === leadId);
  }
}
