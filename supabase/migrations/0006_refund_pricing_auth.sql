-- Additive backend contracts for auth roles, pricing, refunds, and Pakasir expiry.
alter table public.users add column if not exists role text not null default 'user';
alter table public.users add column if not exists suspended_at timestamptz;
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check check (role in ('user','support','super_admin'));

alter table public.transactions add column if not exists payment_method text;
alter table public.transactions add column if not exists payment_number text;
alter table public.transactions add column if not exists payment_fee numeric;
alter table public.transactions add column if not exists total_payment numeric;
alter table public.transactions add column if not exists expires_at timestamptz;

create table if not exists public.refund_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete restrict,
  amount_rupiah numeric not null check (amount_rupiah > 0),
  reason text not null,
  status text not null default 'requested' check (status in ('requested','approved','rejected','refunded')),
  reviewed_by uuid references public.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.models (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  input_price_per_1k numeric not null check (input_price_per_1k >= 0),
  output_price_per_1k numeric not null check (output_price_per_1k >= 0),
  markup_percent numeric not null default 0 check (markup_percent >= 0),
  tier text not null default 'standard' check (tier in ('standard','premium','ultra')),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.token_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  token_amount bigint not null check (token_amount > 0),
  price_rupiah numeric not null check (price_rupiah > 0),
  duration_days integer not null check (duration_days > 0),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.create_pending_topup(
  p_user_id uuid, p_order_id text, p_amount_rupiah numeric
) returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  if p_amount_rupiah < 10000 then raise exception 'INVALID_AMOUNT'; end if;
  if not exists (select 1 from users where id=p_user_id and suspended_at is null) then raise exception 'USER_NOT_FOUND'; end if;
  insert into transactions(user_id,order_id,amount_rupiah,status) values(p_user_id,p_order_id,p_amount_rupiah,'pending') returning id into v_id;
  return v_id;
end; $$;

create or replace function public.mark_topup_payment(
  p_transaction_id uuid, p_payment_method text, p_payment_number text,
  p_fee numeric, p_total_payment numeric, p_expires_at timestamptz
) returns void language plpgsql security definer set search_path=public as $$
begin
  update transactions set payment_method=p_payment_method,payment_number=p_payment_number,
    payment_fee=p_fee,total_payment=p_total_payment,expires_at=p_expires_at
  where id=p_transaction_id and status='pending';
  if not found then raise exception 'TRANSACTION_NOT_PENDING'; end if;
end; $$;

create or replace function public.expire_pending_topups()
returns integer language plpgsql security definer set search_path=public as $$
declare v_count integer;
begin
 update transactions set status='expired' where status='pending' and expires_at is not null and expires_at < now();
 get diagnostics v_count = row_count; return v_count;
end; $$;

create or replace function public.approve_refund(p_refund_id uuid, p_reviewer uuid)
returns void language plpgsql security definer set search_path=public as $$
declare r record; u record;
begin
 select * into r from refund_requests where id=p_refund_id for update;
 if not found or r.status <> 'requested' then raise exception 'REFUND_NOT_REQUESTED'; end if;
 select balance_rupiah into u from users where id=r.user_id for update;
 if u.balance_rupiah < r.amount_rupiah then raise exception 'INSUFFICIENT_BALANCE'; end if;
 update users set balance_rupiah=balance_rupiah-r.amount_rupiah where id=r.user_id;
 insert into wallet_ledger(user_id,type,amount,balance_before,balance_after,reference_type,reference_id,description)
 values(r.user_id,'refund',-r.amount_rupiah,u.balance_rupiah,u.balance_rupiah-r.amount_rupiah,'refund_request',r.id,'Refund approved');
 update refund_requests set status='refunded',reviewed_by=p_reviewer,reviewed_at=now() where id=r.id;
end; $$;

revoke all on function public.mark_topup_payment(uuid,text,text,numeric,numeric,timestamptz) from public,anon,authenticated;
revoke all on function public.expire_pending_topups() from public,anon,authenticated;
revoke all on function public.approve_refund(uuid,uuid) from public,anon,authenticated;
grant execute on function public.mark_topup_payment(uuid,text,text,numeric,numeric,timestamptz) to service_role;
grant execute on function public.expire_pending_topups() to service_role;
grant execute on function public.approve_refund(uuid,uuid) to service_role;
