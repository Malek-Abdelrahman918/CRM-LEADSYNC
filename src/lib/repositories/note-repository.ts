import { BaseRepository } from "./base-repository";
import type { StorageProvider } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/constants";
import { generateId, nowIso } from "@/lib/id";
import type { Note } from "@/lib/types";

export class NoteRepository extends BaseRepository<Note> {
  constructor(storage: StorageProvider) {
    super(storage, STORAGE_KEYS.notes);
  }

  async create(input: { leadId: string; content: string; author?: string }): Promise<Note> {
    const now = nowIso();
    return this.insert({
      id: generateId("note"),
      leadId: input.leadId,
      content: input.content,
      author: input.author,
      createdAt: now,
      updatedAt: now,
    });
  }

  async updateContent(id: string, content: string): Promise<Note | null> {
    return this.patch(id, { content, updatedAt: nowIso() });
  }

  async getByLead(leadId: string): Promise<Note[]> {
    const all = await this.getAll();
    return all
      .filter((n) => n.leadId === leadId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async deleteByLead(leadId: string): Promise<void> {
    await this.deleteWhere((n) => n.leadId === leadId);
  }
}
