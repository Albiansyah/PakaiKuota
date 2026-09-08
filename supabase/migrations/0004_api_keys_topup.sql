-- API keys and pending topup creation for the customer-facing backend.
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null default 'Default key',
  key_prefix text not null,
  key_hash text not null unique,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists api_keys_user_active_idx
  on public.api_keys(user_id, created_at desc)
  where revoked_at is null;

alter table public.transactions
  add column if not exists order_id text;

create unique index if not exists transactions_order_id_key
  on public.transactions(order_id);

-- This RPC creates a pending order while validating the authenticated user's
-- ownership. Payment creation with Pakasir remains an application-side call.
create or replace function public.create_pending_topup(
  p_user_id uuid,
  p_order_id text,
  p_amount_rupiah numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_amount_rupiah <= 0 then raise exception 'INVALID_AMOUNT'; end if;
  if not exists (select 1 from public.users where id = p_user_id) then
    raise exception 'USER_NOT_FOUND';
  end if;
  insert into public.transactions (user_id, order_id, amount_rupiah, status)
  values (p_user_id, p_order_id, p_amount_rupiah, 'pending')
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.create_pending_topup(uuid, text, numeric)
  from public, anon, authenticated;
grant execute on function public.create_pending_topup(uuid, text, numeric)
  to service_role;
