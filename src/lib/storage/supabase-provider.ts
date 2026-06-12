import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseClient } from "@/lib/supabase/client";
import type { StorageProvider } from "./storage-provider";

/**
 * SupabaseProvider — Phase 2 persistence backed by Postgres (Supabase).
 *
 * Implements the exact same `StorageProvider` contract as `LocalStorageProvider`,
 * so flipping `NEXT_PUBLIC_STORAGE_BACKEND=supabase` swaps the backend without
 * touching repositories, the store, or any component.
 *
 * Storage model: one `leadsync_records` table (see `supabase/schema.sql`) keyed
 * by (user_id, collection, id) with a `jsonb` payload. Row Level Security scopes
 * every query to the signed-in user, which is what turns the app multi-user.
 * Granular ops are implemented so single-record writes don't rewrite whole
 * collections.
 */

const TABLE = "leadsync_records";
/** Reserved row id for non-array values (settings, flags). */
const SINGLETON_ID = "__singleton__";

export class SupabaseProvider implements StorageProvider {
  readonly name = "Supabase";

  private get client(): SupabaseClient | null {
    return getSupabaseClient();
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  /** Resolve the client + signed-in user, failing loudly when unauthenticated. */
  private async ctx(): Promise<{ client: SupabaseClient; uid: string }> {
    const client = this.client;
    if (!client) {
      throw new Error(
        "Supabase backend selected but NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set.",
      );
    }
    const { data } = await client.auth.getSession();
    const uid = data.session?.user.id;
    if (!uid) throw new Error("Not signed in.");
    return { client, uid };
  }

  private fail(op: string, message: string): never {
    throw new Error(`[SupabaseProvider.${op}] ${message}`);
  }

  async getCollection<T>(key: string): Promise<T[]> {
    const { client } = await this.ctx();
    const { data, error } = await client
      .from(TABLE)
      .select("data")
      .eq("collection", key)
      .neq("id", SINGLETON_ID)
      .order("created_at", { ascending: false });
    if (error) this.fail("getCollection", error.message);
    return (data ?? []).map((row) => row.data as T);
  }

  async setCollection<T>(key: string, items: T[]): Promise<void> {
    const { client, uid } = await this.ctx();
    const del = await client.from(TABLE).delete().eq("collection", key);
    if (del.error) this.fail("setCollection", del.error.message);
    if (items.length === 0) return;

    const rows = items.map((item) => ({
      user_id: uid,
      collection: key,
      id: String((item as { id?: string }).id ?? crypto.randomUUID()),
      data: item,
    }));
    const ins = await client.from(TABLE).insert(rows);
    if (ins.error) this.fail("setCollection", ins.error.message);
  }

  async upsertInCollection<T extends { id: string }>(
    key: string,
    items: T[],
  ): Promise<void> {
    if (items.length === 0) return;
    const { client, uid } = await this.ctx();
    const rows = items.map((item) => ({
      user_id: uid,
      collection: key,
      id: item.id,
      data: item,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await client
      .from(TABLE)
      .upsert(rows, { onConflict: "user_id,collection,id" });
    if (error) this.fail("upsertInCollection", error.message);
  }

  async removeFromCollection(key: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const { client } = await this.ctx();
    const { error } = await client
      .from(TABLE)
      .delete()
      .eq("collection", key)
      .in("id", ids);
    if (error) this.fail("removeFromCollection", error.message);
  }

  async getItem<T>(key: string): Promise<T | null> {
    const { client } = await this.ctx();
    const { data, error } = await client
      .from(TABLE)
      .select("data")
      .eq("collection", key)
      .eq("id", SINGLETON_ID)
      .maybeSingle();
    if (error) this.fail("getItem", error.message);
    return (data?.data as T) ?? null;
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    const { client, uid } = await this.ctx();
    const { error } = await client.from(TABLE).upsert(
      {
        user_id: uid,
        collection: key,
        id: SINGLETON_ID,
        data: value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,collection,id" },
    );
    if (error) this.fail("setItem", error.message);
  }

  async remove(key: string): Promise<void> {
    const { client } = await this.ctx();
    const { error } = await client
      .from(TABLE)
      .delete()
      .eq("collection", key)
      .eq("id", SINGLETON_ID);
    if (error) this.fail("remove", error.message);
  }

  async clearAll(prefix = "leadsync."): Promise<void> {
    const { client } = await this.ctx();
    const { error } = await client
      .from(TABLE)
      .delete()
      .like("collection", `${prefix}%`);
    if (error) this.fail("clearAll", error.message);
  }
}
