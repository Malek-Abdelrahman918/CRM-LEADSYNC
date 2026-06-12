import type { StorageProvider } from "@/lib/storage";

/**
 * Generic collection repository built on top of a `StorageProvider`.
 *
 * Entity repositories extend this to add domain behaviour (scoring, derived
 * fields, activity logging) while inheriting consistent CRUD semantics. Because
 * it depends only on the `StorageProvider` interface, the same repository code
 * runs unchanged against LocalStorage and Supabase.
 *
 * When the provider exposes granular ops (`upsertInCollection` /
 * `removeFromCollection`) they are used so single-record writes don't rewrite
 * the whole collection; otherwise we fall back to read-modify-write, which is
 * exactly right for LocalStorage.
 */
export abstract class BaseRepository<T extends { id: string }> {
  constructor(
    protected readonly storage: StorageProvider,
    protected readonly key: string,
  ) {}

  async getAll(): Promise<T[]> {
    return this.storage.getCollection<T>(this.key);
  }

  async getById(id: string): Promise<T | null> {
    const all = await this.getAll();
    return all.find((item) => item.id === id) ?? null;
  }

  /** Overwrite the entire collection (used by import / restore / seed). */
  async replaceAll(items: T[]): Promise<void> {
    await this.storage.setCollection(this.key, items);
  }

  async deleteById(id: string): Promise<void> {
    await this.deleteMany([id]);
  }

  async deleteMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    if (this.storage.removeFromCollection) {
      await this.storage.removeFromCollection(this.key, ids);
      return;
    }
    const set = new Set(ids);
    const all = await this.getAll();
    await this.replaceAll(all.filter((item) => !set.has(item.id)));
  }

  async deleteWhere(predicate: (item: T) => boolean): Promise<void> {
    const all = await this.getAll();
    const doomed = all.filter(predicate).map((item) => item.id);
    if (doomed.length === 0) return;
    if (this.storage.removeFromCollection) {
      await this.storage.removeFromCollection(this.key, doomed);
      return;
    }
    await this.replaceAll(all.filter((item) => !predicate(item)));
  }

  async count(): Promise<number> {
    return (await this.getAll()).length;
  }

  /** Insert a fully-formed entity at the head of the collection. */
  protected async insert(entity: T): Promise<T> {
    if (this.storage.upsertInCollection) {
      await this.storage.upsertInCollection(this.key, [entity]);
      return entity;
    }
    const all = await this.getAll();
    await this.replaceAll([entity, ...all]);
    return entity;
  }

  /** Insert many fully-formed entities in a single write. */
  protected async insertMany(entities: T[]): Promise<T[]> {
    if (entities.length === 0) return entities;
    if (this.storage.upsertInCollection) {
      await this.storage.upsertInCollection(this.key, entities);
      return entities;
    }
    const all = await this.getAll();
    await this.replaceAll([...entities, ...all]);
    return entities;
  }

  /** Patch an existing entity by id, returning the merged result. */
  protected async patch(id: string, patch: Partial<T>): Promise<T | null> {
    const existing = await this.getById(id);
    if (!existing) return null;
    const updated: T = { ...existing, ...patch, id: existing.id };
    if (this.storage.upsertInCollection) {
      await this.storage.upsertInCollection(this.key, [updated]);
      return updated;
    }
    const all = await this.getAll();
    await this.replaceAll(all.map((item) => (item.id === id ? updated : item)));
    return updated;
  }
}
