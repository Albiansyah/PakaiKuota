-- PakaiKuota.id — Settings table + deduct_quota function
-- Run via Supabase SQL editor or `supabase db push`

-- =====================================================================
-- settings: key-value store for runtime config (kurs USD→IDR, etc.)
-- =====================================================================
create table if not exists public.settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into public.settings (key, value) values ('usd_idr_rate', '15000')
  on conflict (key) do nothing;

drop trigger if exists trg_settings_updated on public.settings;
create trigger trg_settings_updated before update on public.settings
  for each row execute function set_updated_at();

alter table public.settings enable row level security;

drop policy if exists settings_public_read on public.settings;
create policy settings_public_read on public.settings
  for select using (true);

drop policy if exists settings_admin_write on public.settings;
create policy settings_admin_write on public.settings
  for all using (public.is_super_admin())
  with check (public.is_super_admin());

-- =====================================================================
-- deduct_quota: atomic quota deduction with hourly/daily spending limits
-- Replaces Redis/Lua approach. Native UPDATE per-row is atomic by default.
-- =====================================================================
create or replace function public.deduct_quota(
  p_user_id uuid,
  p_amount bigint,
  p_hourly_limit bigint default null,
  p_daily_limit bigint default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_spent_hourly bigint;
  v_spent_daily bigint;
begin
  if p_hourly_limit is not null then
    select coalesce(sum(cost_rupiah), 0) into v_spent_hourly
    from public.usage_logs
    where user_id = p_user_id and created_at > now() - interval '1 hour';
    if v_spent_hourly + p_amount > p_hourly_limit then
      return false;
    end if;
  end if;

  if p_daily_limit is not null then
    select coalesce(sum(cost_rupiah), 0) into v_spent_daily
    from public.usage_logs
    where user_id = p_user_id and created_at > now() - interval '1 day';
    if v_spent_daily + p_amount > p_daily_limit then
      return false;
    end if;
  end if;

  update public.users
  set balance_rupiah = balance_rupiah - p_amount
  where id = p_user_id and balance_rupiah >= p_amount;

  return found;
end;
$$;