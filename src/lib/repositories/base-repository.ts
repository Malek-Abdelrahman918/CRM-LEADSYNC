import type { StorageProvider } from "@/lib/storage";

/**
 * Generic collection repository built on top of a `StorageProvider`.
 *
 * Entity repositories extend this to add domain behaviour (scoring, derived
 * fields, activity logging) while inheriting consistent CRUD semantics. Because
 * it depends only on the `StorageProvider` interface, the same repository code
 * runs unchanged against LocalStorage today and Supabase tomorrow.
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
    const all = await this.getAll();
    await this.replaceAll(all.filter((item) => item.id !== id));
  }

  async deleteMany(ids: string[]): Promise<void> {
    const set = new Set(ids);
    const all = await this.getAll();
    await this.replaceAll(all.filter((item) => !set.has(item.id)));
  }

  async deleteWhere(predicate: (item: T) => boolean): Promise<void> {
    const all = await this.getAll();
    await this.replaceAll(all.filter((item) => !predicate(item)));
  }

  async count(): Promise<number> {
    return (await this.getAll()).length;
  }

  /** Insert a fully-formed entity at the head of the collection. */
  protected async insert(entity: T): Promise<T> {
    const all = await this.getAll();
    await this.replaceAll([entity, ...all]);
    return entity;
  }

  /** Insert many fully-formed entities in a single write. */
  protected async insertMany(entities: T[]): Promise<T[]> {
    const all = await this.getAll();
    await this.replaceAll([...entities, ...all]);
    return entities;
  }

  /** Patch an existing entity by id, returning the merged result. */
  protected async patch(id: string, patch: Partial<T>): Promise<T | null> {
    const all = await this.getAll();
    let updated: T | null = null;
    const next = all.map((item) => {
      if (item.id !== id) return item;
      updated = { ...item, ...patch };
      return updated;
    });
    if (updated) await this.replaceAll(next);
    return updated;
  }
}
