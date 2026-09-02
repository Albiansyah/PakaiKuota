-- PakaiKuota.id – Phase 2 migration
-- Run via Supabase SQL editor

-- =====================================================================
-- Add refund_requested to transaction_status enum
-- =====================================================================
do $$ begin
  alter type transaction_status add value if not exists 'refund_requested';
exception when duplicate_object then null; end $$;

-- =====================================================================
-- announcements table (for broadcast feature)
-- =====================================================================
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  created_by uuid not null references public.users(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_announcements_active on public.announcements (is_active, created_at desc);
