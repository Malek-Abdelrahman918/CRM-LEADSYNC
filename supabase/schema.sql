-- ============================================================================
-- LeadSync OS — Supabase schema (Phase 2)
-- Run this once in your Supabase project: SQL Editor → New query → paste → Run.
-- ============================================================================

-- One generic, RLS-protected document table backs the whole CRM. Each row is a
-- record in a named collection (leads, activities, notes, tasks, settings…),
-- scoped to the signed-in user. This mirrors the StorageProvider contract 1:1,
-- which is what lets the app swap LocalStorage → Supabase with zero code
-- changes. If you later want typed columns, migrate collection-by-collection
-- into dedicated tables behind the same interface.

create table if not exists public.leadsync_records (
  user_id    uuid        not null default auth.uid(),
  collection text        not null,
  id         text        not null,
  data       jsonb       not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, collection, id)
);

-- Fast collection scans in insertion order (newest first).
create index if not exists leadsync_records_scan_idx
  on public.leadsync_records (user_id, collection, created_at desc);

-- ── Row Level Security: every user sees only their own rows ────────────────
alter table public.leadsync_records enable row level security;

drop policy if exists "leadsync_select_own" on public.leadsync_records;
create policy "leadsync_select_own"
  on public.leadsync_records for select
  using (auth.uid() = user_id);

drop policy if exists "leadsync_insert_own" on public.leadsync_records;
create policy "leadsync_insert_own"
  on public.leadsync_records for insert
  with check (auth.uid() = user_id);

drop policy if exists "leadsync_update_own" on public.leadsync_records;
create policy "leadsync_update_own"
  on public.leadsync_records for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "leadsync_delete_own" on public.leadsync_records;
create policy "leadsync_delete_own"
  on public.leadsync_records for delete
  using (auth.uid() = user_id);
