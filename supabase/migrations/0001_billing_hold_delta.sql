-- ============================================================================
-- Migration: v1.2/v1.3 billing delta  (PakaiKuota — final.md §6, §7, §14)
--
-- Adds the reserve/hold wallet model on top of the 19 base tables that ALREADY
-- exist in the Supabase project. This migration is additive and idempotent.
-- RPC functions live in a separate migration (0002).
--
-- Apply with:   supabase db push       (review the diff first)
-- Then regen:   npm run gen:types
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. users.balance_held  (§6.3)
--    balance_available = balance_rupiah - balance_held  (never < 0)
-- ---------------------------------------------------------------------------
alter table public.users
  add column if not exists balance_held numeric not null default 0;

alter table public.users
  drop constraint if exists users_balance_held_nonneg;
alter table public.users
  add constraint users_balance_held_nonneg check (balance_held >= 0);

alter table public.users
  drop constraint if exists users_balance_rupiah_nonneg;
alter table public.users
  add constraint users_balance_rupiah_nonneg check (balance_rupiah >= 0);

-- Hold must never exceed the real balance.
alter table public.users
  drop constraint if exists users_held_not_over_balance;
alter table public.users
  add constraint users_held_not_over_balance check (balance_held <= balance_rupiah);

-- ---------------------------------------------------------------------------
-- 2. wallet_ledger  (§6.1) — append-only audit trail of every balance change
-- ---------------------------------------------------------------------------
create table if not exists public.wallet_ledger (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users (id) on delete restrict,
  type            text not null check (type in (
                    'topup', 'usage', 'refund',
                    'admin_adjustment', 'bonus', 'hold_release'
                  )),
  amount          numeric not null,
  balance_before  numeric not null,
  balance_after   numeric not null,
  reference_type  text check (reference_type in (
                    'transaction', 'ai_usage_logs', 'refund_request', 'admin'
                  )),
  reference_id    uuid,
  description     text,
  created_at      timestamptz not null default now()
);

create index if not exists wallet_ledger_user_created_idx
  on public.wallet_ledger (user_id, created_at desc);
create index if not exists wallet_ledger_reference_idx
  on public.wallet_ledger (reference_type, reference_id);

-- ---------------------------------------------------------------------------
-- 3. ai_usage_logs forex columns  (§3.1)
--    forex_rate_at_hold : kurs saat 'authorized' (nominal hold)
--    forex_rate_used    : kurs saat 'completed'  (immutable actual charge)
-- ---------------------------------------------------------------------------
alter table public.ai_usage_logs
  add column if not exists forex_rate_at_hold numeric;
alter table public.ai_usage_logs
  add column if not exists forex_rate_used numeric;

-- ---------------------------------------------------------------------------
-- 4. transactions.order_id — DB-level idempotency for Pakasir webhooks (§7.1)
--    Pakasir does not provide a transaction signature/id. order_id is our
--    merchant-generated invoice identifier and must be unique.
-- ---------------------------------------------------------------------------
create unique index if not exists transactions_order_id_key
  on public.transactions (order_id);

-- ---------------------------------------------------------------------------
-- 5. reconciliation_logs — orphaned-hold + hold_insufficient anomalies (§6.5)
--    (created here if the base schema does not already define it)
-- ---------------------------------------------------------------------------
create table if not exists public.reconciliation_logs (
  id          uuid primary key default gen_random_uuid(),
  category    text not null,          -- 'usage_ledger' | 'orphaned_hold' | 'hold_insufficient'
  status      text not null default 'ok' check (status in ('ok', 'alert')),
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists reconciliation_logs_status_idx
  on public.reconciliation_logs (status, created_at desc);
