-- Add rate limiting columns to newapi_config
-- Run via Supabase SQL editor

alter table public.newapi_config
  add column if not exists hourly_limit_rupiah bigint not null default 0,
  add column if not exists daily_limit_rupiah bigint not null default 0;

-- Update RLS policy to include new columns (already covered by existing policy)

-- Seed with default unlimited
update public.newapi_config set hourly_limit_rupiah = 0, daily_limit_rupiah = 0 where id = 1;
