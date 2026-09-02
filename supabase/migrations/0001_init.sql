-- PakaiKuota.id – Supabase schema migration
-- Run via Supabase SQL editor or `supabase db push` after placing in supabase/migrations/

-- =====================================================================
-- Extensions
-- =====================================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =====================================================================
-- Enums
-- =====================================================================
do $$ begin
  create type user_role as enum ('user', 'super_admin', 'support');
exception when duplicate_object then null; end $$;

do $$ begin
  create type transaction_status as enum ('pending', 'success', 'failed', 'expired', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('qris', 'va');
exception when duplicate_object then null; end $$;

do $$ begin
  create type model_tier as enum ('murah', 'menengah', 'mahal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type limit_type as enum ('hourly', 'daily');
exception when duplicate_object then null; end $$;

do $$ begin
  create type recon_source as enum ('redis_vs_supabase', 'internal_vs_upstream');
exception when duplicate_object then null; end $$;

do $$ begin
  create type recon_status as enum ('ok', 'alert', 'resolved');
exception when duplicate_object then null; end $$;

do $$ begin
  create type reseller_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

-- =====================================================================
-- Helper: updated_at trigger
-- =====================================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =====================================================================
-- users (1:1 with auth.users)
-- =====================================================================
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  avatar_url text,
  role user_role not null default 'user',
  balance_rupiah bigint not null default 0 check (balance_rupiah >= 0),
  spending_limit_hourly bigint,
  spending_limit_daily bigint,
  is_suspended boolean not null default false,
  business_name text,
  business_phone text,
  npwp text,
  privacy_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_users_updated on public.users;
create trigger trg_users_updated before update on public.users
  for each row execute function set_updated_at();

create index if not exists idx_users_email on public.users (email);
create index if not exists idx_users_role on public.users (role);

-- =====================================================================
-- api_keys
-- =====================================================================
create table if not exists public.api_keys (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  is_active boolean not null default true,
  ip_whitelist text[],
  total_usage_tokens bigint not null default 0,
  total_cost_rupiah bigint not null default 0,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_api_keys_updated on public.api_keys;
create trigger trg_api_keys_updated before update on public.api_keys
  for each row execute function set_updated_at();

create index if not exists idx_api_keys_user on public.api_keys (user_id);
create index if not exists idx_api_keys_hash on public.api_keys (key_hash);

-- =====================================================================
-- transactions
-- =====================================================================
create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  order_id text not null unique,
  amount_rupiah bigint not null check (amount_rupiah > 0),
  status transaction_status not null default 'pending',
  payment_method payment_method,
  payment_channel text,
  pakasir_tx_id text,
  refunded_amount bigint,
  invoice_number text,
  expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_transactions_updated on public.transactions;
create trigger trg_transactions_updated before update on public.transactions
  for each row execute function set_updated_at();

create index if not exists idx_transactions_user on public.transactions (user_id);
create index if not exists idx_transactions_status on public.transactions (status);
create index if not exists idx_transactions_paid_at on public.transactions (paid_at);

-- =====================================================================
-- usage_logs
-- =====================================================================
create table if not exists public.usage_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  api_key_id uuid references public.api_keys(id) on delete set null,
  model text not null,
  prompt_tokens integer not null default 0,
  completion_tokens integer not null default 0,
  total_tokens integer not null default 0,
  cost_rupiah numeric(18, 8) not null default 0,
  request_metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_usage_user_time on public.usage_logs (user_id, created_at desc);
create index if not exists idx_usage_key_time on public.usage_logs (api_key_id, created_at desc);

-- =====================================================================
-- models
-- =====================================================================
create table if not exists public.models (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  provider text not null,
  tier model_tier not null,
  is_active boolean not null default true,
  upstream_price_per_token numeric(18, 10) not null,
  markup_price_per_token numeric(18, 10) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists trg_models_updated on public.models;
create trigger trg_models_updated before update on public.models
  for each row execute function set_updated_at();

create index if not exists idx_models_active on public.models (is_active);
create index if not exists idx_models_tier on public.models (tier);

-- =====================================================================
-- model_markup_history (audit)
-- =====================================================================
create table if not exists public.model_markup_history (
  id uuid primary key default uuid_generate_v4(),
  model_id uuid not null references public.models(id) on delete cascade,
  old_markup numeric(18, 10) not null,
  new_markup numeric(18, 10) not null,
  changed_by uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_markup_history_model on public.model_markup_history (model_id, created_at desc);

-- =====================================================================
-- admin_audit_logs
-- =====================================================================
create table if not exists public.admin_audit_logs (
  id uuid primary key default uuid_generate_v4(),
  admin_id uuid not null references public.users(id),
  action text not null,
  target_type text not null,
  target_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_admin_time on public.admin_audit_logs (admin_id, created_at desc);
create index if not exists idx_audit_target on public.admin_audit_logs (target_type, target_id);

-- =====================================================================
-- spending_limits
-- =====================================================================
create table if not exists public.spending_limits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  limit_type limit_type not null,
  max_cost_rupiah bigint not null check (max_cost_rupiah > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, limit_type)
);
drop trigger if exists trg_spending_updated on public.spending_limits;
create trigger trg_spending_updated before update on public.spending_limits
  for each row execute function set_updated_at();

-- =====================================================================
-- reconciliation_logs
-- =====================================================================
create table if not exists public.reconciliation_logs (
  id uuid primary key default uuid_generate_v4(),
  source recon_source not null,
  expected_amount numeric(18, 2) not null,
  actual_amount numeric(18, 2) not null,
  difference numeric(18, 2) not null,
  status recon_status not null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_recon_time on public.reconciliation_logs (created_at desc);

-- =====================================================================
-- playground_sessions
-- =====================================================================
create table if not exists public.playground_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  model text not null,
  prompt_tokens integer not null,
  completion_tokens integer not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_playground_user_time on public.playground_sessions (user_id, created_at desc);

-- =====================================================================
-- signup_log (per-IP rate limit)
-- =====================================================================
create table if not exists public.signup_log (
  id uuid primary key default uuid_generate_v4(),
  ip inet not null,
  email text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_signup_ip_time on public.signup_log (ip, created_at desc);

-- =====================================================================
-- refund_requests
-- =====================================================================
create table if not exists public.refund_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  amount bigint not null check (amount > 0),
  reason text,
  status text not null default 'pending',
  decided_by uuid references public.users(id),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_refund_status on public.refund_requests (status, created_at desc);

-- =====================================================================
-- reseller_applications (KYC)
-- =====================================================================
create table if not exists public.reseller_applications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  business_name text not null,
  business_phone text not null,
  npwp text,
  status reseller_status not null default 'pending',
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_reseller_status on public.reseller_applications (status);

-- =====================================================================
-- data_deletion_requests
-- =====================================================================
create table if not exists public.data_deletion_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  reason text,
  status text not null default 'pending',
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- forex_history
-- =====================================================================
create table if not exists public.forex_history (
  id uuid primary key default uuid_generate_v4(),
  base text not null,
  quote text not null,
  rate numeric(18, 6) not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_forex_time on public.forex_history (created_at desc);

-- =====================================================================
-- RLS
-- =====================================================================
alter table public.users enable row level security;
alter table public.api_keys enable row level security;
alter table public.transactions enable row level security;
alter table public.usage_logs enable row level security;
alter table public.refund_requests enable row level security;
alter table public.reseller_applications enable row level security;
alter table public.data_deletion_requests enable row level security;
alter table public.playground_sessions enable row level security;
alter table public.signup_log enable row level security;
alter table public.forex_history enable row level security;
alter table public.models enable row level security;
alter table public.model_markup_history enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.spending_limits enable row level security;
alter table public.reconciliation_logs enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role in ('super_admin', 'support')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'super_admin'
  );
$$;

-- users
drop policy if exists users_self_read on public.users;
create policy users_self_read on public.users
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists users_self_update on public.users;
create policy users_self_update on public.users
  for update using (auth.uid() = id);

drop policy if exists users_admin_update on public.users;
create policy users_admin_update on public.users
  for update using (public.is_super_admin());

-- api_keys
drop policy if exists api_keys_owner on public.api_keys;
create policy api_keys_owner on public.api_keys
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

-- transactions
drop policy if exists transactions_owner on public.transactions;
create policy transactions_owner on public.transactions
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

-- usage_logs
drop policy if exists usage_logs_owner on public.usage_logs;
create policy usage_logs_owner on public.usage_logs
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists usage_logs_insert_admin on public.usage_logs;
create policy usage_logs_insert_admin on public.usage_logs
  for insert with check (public.is_admin() or auth.uid() = user_id);

-- refund_requests
drop policy if exists refund_owner_read on public.refund_requests;
create policy refund_owner_read on public.refund_requests
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists refund_owner_insert on public.refund_requests;
create policy refund_owner_insert on public.refund_requests
  for insert with check (auth.uid() = user_id);

-- reseller_applications
drop policy if exists reseller_owner on public.reseller_applications;
create policy reseller_owner on public.reseller_applications
  for all using (auth.uid() = user_id or public.is_super_admin())
  with check (auth.uid() = user_id);

-- data_deletion_requests
drop policy if exists deletion_owner on public.data_deletion_requests;
create policy deletion_owner on public.data_deletion_requests
  for all using (auth.uid() = user_id or public.is_super_admin())
  with check (auth.uid() = user_id);

-- playground_sessions
drop policy if exists playground_owner on public.playground_sessions;
create policy playground_owner on public.playground_sessions
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

-- signup_log: insert by anyone (rate limiting), read admin only
drop policy if exists signup_log_insert on public.signup_log;
create policy signup_log_insert on public.signup_log
  for insert with check (true);

drop policy if exists signup_log_admin on public.signup_log;
create policy signup_log_admin on public.signup_log
  for select using (public.is_admin());

-- forex_history: public read, admin write
drop policy if exists forex_public_read on public.forex_history;
create policy forex_public_read on public.forex_history
  for select using (true);

drop policy if exists forex_admin_write on public.forex_history;
create policy forex_admin_write on public.forex_history
  for insert with check (public.is_super_admin());

-- models: public read, super_admin write
drop policy if exists models_public_read on public.models;
create policy models_public_read on public.models
  for select using (true);

drop policy if exists models_admin_write on public.models;
create policy models_admin_write on public.models
  for all using (public.is_super_admin())
  with check (public.is_super_admin());

-- model_markup_history
drop policy if exists markup_history_admin on public.model_markup_history;
create policy markup_history_admin on public.model_markup_history
  for all using (public.is_super_admin())
  with check (public.is_super_admin());

-- admin_audit_logs
drop policy if exists audit_admin on public.admin_audit_logs;
create policy audit_admin on public.admin_audit_logs
  for all using (public.is_admin())
  with check (public.is_admin());

-- spending_limits
drop policy if exists spending_owner on public.spending_limits;
create policy spending_owner on public.spending_limits
  for all using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id);

-- reconciliation_logs: admin only
drop policy if exists recon_admin on public.reconciliation_logs;
create policy recon_admin on public.reconciliation_logs
  for all using (public.is_super_admin())
  with check (public.is_super_admin());

-- =====================================================================
-- Seed: bootstrap first super_admin (replace email before running)
-- =====================================================================
-- After running, promote your own user:
-- update public.users set role = 'super_admin' where email = 'you@example.com';

-- =====================================================================
-- Cron: expire pending transactions
-- =====================================================================
create or replace function public.expire_pending_transactions()
returns void
language plpgsql
security definer
as $$
begin
  update public.transactions
  set status = 'expired', updated_at = now()
  where status = 'pending' and expires_at < now();
end;
$$;

-- Schedule via pg_cron (uncomment if extension available):
-- select cron.schedule('expire-pending', '*/5 * * * *', $$select public.expire_pending_transactions()$$);
