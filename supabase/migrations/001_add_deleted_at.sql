-- Add soft-delete column to users table
alter table public.users add column if not exists deleted_at timestamptz;
