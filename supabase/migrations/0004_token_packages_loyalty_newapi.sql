-- PakaiKuota.id – Phase 3: Token Packages, Loyalty, NewAPI Config
-- Run via Supabase SQL editor or `supabase db push`

-- =====================================================================
-- Enums
-- =====================================================================
do $$ begin
  create type loyalty_tier as enum ('bronze', 'silver', 'gold');
exception when duplicate_object then null; end $$;

do $$ begin
  create type purchase_type as enum ('package', 'custom');
exception when duplicate_object then null; end $$;

-- =====================================================================
-- token_packages: predefined packages admin CRUD
-- =====================================================================
create table if not exists public.token_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  token_amount bigint not null check (token_amount > 0),
  price_rupiah bigint not null check (price_rupiah > 0),
  bonus_percent int not null default 0 check (bonus_percent >= 0),
  duration_days int, -- optional: token expiry in days
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_token_packages_active on public.token_packages (is_active, sort_order);

drop trigger if exists trg_token_packages_updated on public.token_packages;
create trigger trg_token_packages_updated before update on public.token_packages
  for each row execute function set_updated_at();

-- =====================================================================
-- loyalty_rules: tier thresholds & bonuses
-- =====================================================================
create table if not exists public.loyalty_rules (
  tier loyalty_tier primary key,
  min_total_purchased bigint not null default 0,
  purchase_bonus_percent int not null default 0,
  package_discount_percent int not null default 0,
  priority_support boolean not null default false,
  custom_model_access boolean not null default false,
  api_key_access boolean not null default false,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed default loyalty rules
insert into public.loyalty_rules (tier, min_total_purchased, purchase_bonus_percent, package_discount_percent, priority_support, custom_model_access, api_key_access, description)
values
  ('bronze', 0, 0, 0, false, false, false, 'Tier default untuk user baru'),
  ('silver', 1000000, 5, 5, true, false, false, 'Total beli ≥ 1M token'),
  ('gold', 5000000, 15, 15, true, true, true, 'Total beli ≥ 5M token')
on conflict (tier) do update set
  min_total_purchased = excluded.min_total_purchased,
  purchase_bonus_percent = excluded.purchase_bonus_percent,
  package_discount_percent = excluded.package_discount_percent,
  priority_support = excluded.priority_support,
  custom_model_access = excluded.custom_model_access,
  api_key_access = excluded.api_key_access,
  description = excluded.description,
  updated_at = now();

drop trigger if exists trg_loyalty_rules_updated on public.loyalty_rules;
create trigger trg_loyalty_rules_updated before update on public.loyalty_rules
  for each row execute function set_updated_at();

-- =====================================================================
-- newapi_config: single row config for NewAPI integration
-- =====================================================================
create table if not exists public.newapi_config (
  id int primary key default 1,
  base_url text not null default 'https://api.newapi.com',
  api_key text not null default '',
  default_model text not null default 'gpt-4o-mini',
  markup_percent int not null default 20 check (markup_percent >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);

drop trigger if exists trg_newapi_config_updated on public.newapi_config;
create trigger trg_newapi_config_updated before update on public.newapi_config
  for each row execute function set_updated_at();

-- =====================================================================
-- Add columns to users for token system
-- =====================================================================
alter table public.users
  add column if not exists token_balance bigint not null default 0 check (token_balance >= 0),
  add column if not exists total_purchased bigint not null default 0 check (total_purchased >= 0),
  add column if not exists loyalty_tier loyalty_tier not null default 'bronze',
  add column if not exists token_expiry timestamptz;

create index if not exists idx_users_loyalty on public.users (loyalty_tier);
create index if not exists idx_users_token_expiry on public.users (token_expiry) where token_expiry is not null;

-- =====================================================================
-- Extend transactions for token purchases
-- =====================================================================
alter table public.transactions
  add column if not exists purchase_type purchase_type not null default 'package',
  add column if not exists token_amount bigint,
  add column if not exists bonus_tokens bigint not null default 0,
  add column if not exists package_id uuid references public.token_packages(id) on delete set null,
  add column if not exists custom_token_amount bigint,
  add column if not exists custom_duration_days int,
  add column if not exists loyalty_tier_at_purchase loyalty_tier;

-- =====================================================================
-- ai_usage_logs: detailed AI usage tracking (extends usage_logs)
-- =====================================================================
create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  api_key_id uuid references public.api_keys(id) on delete set null,
  model text not null,
  prompt_tokens int not null default 0,
  completion_tokens int not null default 0,
  total_tokens int not null default 0,
  cost_usd numeric(18, 8) not null default 0,
  cost_rupiah bigint not null default 0,
  request_metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_usage_user_time on public.ai_usage_logs (user_id, created_at desc);
create index if not exists idx_ai_usage_model_time on public.ai_usage_logs (model, created_at desc);

-- =====================================================================
-- RLS Policies
-- =====================================================================
alter table public.token_packages enable row level security;
alter table public.loyalty_rules enable row level security;
alter table public.newapi_config enable row level security;
alter table public.ai_usage_logs enable row level security;

-- token_packages: public read active, admin write
drop policy if exists token_packages_public_read on public.token_packages;
create policy token_packages_public_read on public.token_packages
  for select using (is_active = true);

drop policy if exists token_packages_admin_write on public.token_packages;
create policy token_packages_admin_write on public.token_packages
  for all using (public.is_super_admin())
  with check (public.is_super_admin());

-- loyalty_rules: public read, super_admin write
drop policy if exists loyalty_rules_public_read on public.loyalty_rules;
create policy loyalty_rules_public_read on public.loyalty_rules
  for select using (true);

drop policy if exists loyalty_rules_admin_write on public.loyalty_rules;
create policy loyalty_rules_admin_write on public.loyalty_rules
  for all using (public.is_super_admin())
  with check (public.is_super_admin());

-- newapi_config: super_admin only
drop policy if exists newapi_config_admin on public.newapi_config;
create policy newapi_config_admin on public.newapi_config
  for all using (public.is_super_admin())
  with check (public.is_super_admin());

-- ai_usage_logs: user read own, admin read all, system insert
drop policy if exists ai_usage_logs_owner_read on public.ai_usage_logs;
create policy ai_usage_logs_owner_read on public.ai_usage_logs
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists ai_usage_logs_insert on public.ai_usage_logs;
create policy ai_usage_logs_insert on public.ai_usage_logs
  for insert with check (public.is_admin() or auth.uid() = user_id);

-- =====================================================================
-- Functions
-- =====================================================================

-- Update user loyalty tier based on total_purchased
create or replace function public.update_user_loyalty_tier(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total bigint;
  v_new_tier loyalty_tier;
begin
  select total_purchased into v_total from public.users where id = p_user_id;

  select tier into v_new_tier
  from public.loyalty_rules
  where min_total_purchased <= v_total
  order by min_total_purchased desc
  limit 1;

  update public.users
  set loyalty_tier = v_new_tier, updated_at = now()
  where id = p_user_id and loyalty_tier <> v_new_tier;
end;
$$;

-- Consume tokens atomically (for AI proxy)
create or replace function public.consume_tokens(
  p_user_id uuid,
  p_tokens_used int,
  p_model text,
  p_cost_rupiah bigint,
  p_cost_usd numeric default 0,
  p_metadata jsonb default '{}'
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance bigint;
begin
  -- Check and deduct balance atomically
  update public.users
  set token_balance = token_balance - p_tokens_used,
      updated_at = now()
  where id = p_user_id
    and token_balance >= p_tokens_used
    and (token_expiry is null or token_expiry > now())
  returning token_balance into v_balance;

  if not found then
    return false;
  end if;

  -- Log usage
  insert into public.ai_usage_logs (user_id, model, prompt_tokens, completion_tokens, total_tokens, cost_rupiah, cost_usd, request_metadata)
  values (p_user_id, p_model, 0, p_tokens_used, p_tokens_used, p_cost_rupiah, p_cost_usd, p_metadata);

  return true;
end;
$$;

-- Add tokens to user (for purchase/webhook)
create or replace function public.add_tokens(
  p_user_id uuid,
  p_token_amount bigint,
  p_bonus_tokens bigint default 0,
  p_duration_days int default null,
  p_transaction_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expiry timestamptz;
  v_current_expiry timestamptz;
begin
  -- Calculate new expiry
  if p_duration_days is not null and p_duration_days > 0 then
    v_expiry := now() + (p_duration_days || ' days')::interval;
  else
    v_expiry := null;
  end if;

  -- Get current expiry
  select token_expiry into v_current_expiry from public.users where id = p_user_id;

  -- If user has existing expiry and new expiry is later, extend. If no expiry, set new.
  if v_current_expiry is null or (v_expiry is not null and v_expiry > v_current_expiry) then
    update public.users
    set token_balance = token_balance + p_token_amount + p_bonus_tokens,
        total_purchased = total_purchased + p_token_amount + p_bonus_tokens,
        token_expiry = v_expiry,
        updated_at = now()
    where id = p_user_id;
  else
    update public.users
    set token_balance = token_balance + p_token_amount + p_bonus_tokens,
        total_purchased = total_purchased + p_token_amount + p_bonus_tokens,
        updated_at = now()
    where id = p_user_id;
  end if;

  -- Update loyalty tier
  perform public.update_user_loyalty_tier(p_user_id);
end;
$$;

-- Calculate package price with loyalty discount
create or replace function public.calculate_package_price(
  p_package_id uuid,
  p_user_id uuid default null
)
returns table (
  token_amount bigint,
  price_rupiah bigint,
  bonus_tokens bigint,
  final_price bigint,
  loyalty_tier loyalty_tier,
  discount_percent int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_package record;
  v_loyalty loyalty_tier := 'bronze';
  v_discount int := 0;
  v_bonus int := 0;
begin
  select * into v_package from public.token_packages where id = p_package_id and is_active = true;
  if not found then
    return;
  end if;

  if p_user_id is not null then
    select loyalty_tier into v_loyalty from public.users where id = p_user_id;
  end if;

  select package_discount_percent, purchase_bonus_percent
  into v_discount, v_bonus
  from public.loyalty_rules where tier = v_loyalty;

  return query select
    v_package.token_amount,
    v_package.price_rupiah,
    (v_package.token_amount * v_package.bonus_percent / 100)::bigint + (v_package.token_amount * v_bonus / 100)::bigint,
    (v_package.price_rupiah * (100 - v_discount) / 100)::bigint,
    v_loyalty,
    v_discount;
end;
$$;

-- Calculate custom purchase: user specifies token_amount, duration_days, nominal_rupiah
-- Returns token_amount they get (with loyalty bonus) and validates price
create or replace function public.calculate_custom_purchase(
  p_token_amount bigint,
  p_duration_days int,
  p_nominal_rupiah bigint,
  p_user_id uuid default null
)
returns table (
  token_amount bigint,
  bonus_tokens bigint,
  total_tokens bigint,
  price_per_token numeric,
  final_price bigint,
  loyalty_tier loyalty_tier,
  bonus_percent int,
  is_competitive boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_loyalty loyalty_tier := 'bronze';
  v_bonus_percent int := 0;
  v_markup int;
  v_base_price_per_token numeric;
  v_est_cost numeric;
begin
  if p_user_id is not null then
    select loyalty_tier into v_loyalty from public.users where id = p_user_id;
  end if;

  select purchase_bonus_percent into v_bonus_percent from public.loyalty_rules where tier = v_loyalty;

  -- Get markup from NewAPI config
  select markup_percent into v_markup from public.newapi_config where id = 1;

  -- Estimate base price per token from cheapest active model
  select min(markup_price_per_token) into v_base_price_per_token
  from public.models where is_active = true;

  if v_base_price_per_token is null then
    v_base_price_per_token := 0.000001; -- fallback
  end if;

  -- Estimated cost with markup
  v_est_cost := p_token_amount * v_base_price_per_token * (1 + v_markup / 100.0);

  -- Competitive if user nominal >= estimated cost
  return query select
    p_token_amount,
    (p_token_amount * v_bonus_percent / 100)::bigint,
    p_token_amount + (p_token_amount * v_bonus_percent / 100)::bigint,
    v_base_price_per_token * (1 + v_markup / 100.0),
    p_nominal_rupiah,
    v_loyalty,
    v_bonus_percent,
    (p_nominal_rupiah >= v_est_cost);
end;
$$;

-- =====================================================================
-- Seed default packages (competitive pricing)
-- =====================================================================
insert into public.token_packages (name, description, token_amount, price_rupiah, bonus_percent, duration_days, sort_order)
values
  ('Starter', 'Cocok untuk percobaan', 100000, 25000, 0, 30, 1),
  ('Popular', 'Paling diminati', 500000, 110000, 5, 60, 2),
  ('Pro', 'Untuk penggunaan intensif', 1000000, 200000, 10, 90, 3),
  ('Enterprise', 'Volume besar, harga terbaik', 5000000, 900000, 20, 180, 4)
on conflict do nothing;