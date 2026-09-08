-- ============================================================================
-- Migration: billing RPC functions  (PakaiKuota — final.md §6.3, §7.0, §15)
--
-- authorize_request / finalize_request implement the reserve-hold lifecycle:
--   authorized (hold) -> processing -> completed (release + charge actual)
--                                   -> failed    (release full, no charge)
--
-- Concurrency: every function takes a row-level lock on public.users
-- (SELECT ... FOR UPDATE) before reading balance, so concurrent requests from
-- the SAME user serialize (§7.0). Other users are unaffected.
--
-- All functions are SECURITY DEFINER: callable only via the service role
-- (VPS gateway / server-side). Do NOT expose to the anon role.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- authorize_request — create a hold sized from max_tokens estimate.
--   nominal_hold = estimated_cost_usd * forex_rate_at_hold * 1.05   (§6.3)
-- Returns the created ai_usage_logs row id (status 'authorized').
-- Raises 'INSUFFICIENT_BALANCE' if balance_available < nominal_hold.
-- ---------------------------------------------------------------------------
create or replace function public.authorize_request(
  p_user_id            uuid,
  p_model_id           uuid,
  p_estimated_cost_usd numeric,   -- upstream+markup estimate from max_tokens, in USD
  p_forex_rate_at_hold numeric,   -- kurs from forex_history at authorize time
  p_idempotency_key    text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance        numeric;
  v_held           numeric;
  v_available      numeric;
  v_nominal_hold   numeric;
  v_request_id     uuid;
  v_existing_id    uuid;
begin
  if p_estimated_cost_usd is null or p_estimated_cost_usd < 0 then
    raise exception 'INVALID_ESTIMATE';
  end if;
  if p_forex_rate_at_hold is null or p_forex_rate_at_hold <= 0 then
    raise exception 'INVALID_FOREX_RATE';
  end if;

  -- Idempotency window (§7.2): reuse an existing recent authorization.
  if p_idempotency_key is not null then
    select id into v_existing_id
    from public.ai_usage_logs
    where idempotency_key = p_idempotency_key
      and created_at > now() - interval '60 seconds'
    limit 1;
    if v_existing_id is not null then
      return v_existing_id;
    end if;
  end if;

  -- 5% operational buffer over the estimate (§6.3).
  v_nominal_hold := round(p_estimated_cost_usd * p_forex_rate_at_hold * 1.05);

  -- Lock the user row BEFORE reading balance (§7.0).
  select balance_rupiah, balance_held
    into v_balance, v_held
  from public.users
  where id = p_user_id
  for update;

  if not found then
    raise exception 'USER_NOT_FOUND';
  end if;

  v_available := v_balance - v_held;
  if v_available < v_nominal_hold then
    raise exception 'INSUFFICIENT_BALANCE';
  end if;

  update public.users
    set balance_held = balance_held + v_nominal_hold
  where id = p_user_id;

  insert into public.ai_usage_logs (
    user_id, model_id, status,
    nominal_hold, forex_rate_at_hold, idempotency_key, created_at
  ) values (
    p_user_id, p_model_id, 'authorized',
    v_nominal_hold, p_forex_rate_at_hold, p_idempotency_key, now()
  )
  returning id into v_request_id;

  return v_request_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- finalize_request — release the hold and charge the actual cost.
--
--   p_status = 'completed' : charge actual, release remainder of the hold.
--                            actual is CAPPED at nominal_hold so the balance
--                            can never go negative; any shortfall is logged as
--                            a 'hold_insufficient' reconciliation alert (§6.3 #5).
--   p_status = 'failed'    : release the full hold, charge nothing.
-- ---------------------------------------------------------------------------
create or replace function public.finalize_request(
  p_request_id       uuid,
  p_status           text,            -- 'completed' | 'failed'
  p_actual_cost_usd  numeric default null,
  p_forex_rate_used  numeric default null,
  p_input_tokens     integer default null,
  p_output_tokens    integer default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id      uuid;
  v_hold         numeric;
  v_cur_status   text;
  v_balance      numeric;
  v_held         numeric;
  v_actual_rp    numeric;
  v_charge       numeric;
  v_shortfall    numeric;
begin
  if p_status not in ('completed', 'failed') then
    raise exception 'INVALID_STATUS';
  end if;

  -- Read the request; lock the user row for the balance mutation (§7.0).
  select user_id, nominal_hold, status
    into v_user_id, v_hold, v_cur_status
  from public.ai_usage_logs
  where id = p_request_id
  for update;

  if not found then
    raise exception 'REQUEST_NOT_FOUND';
  end if;

  -- Idempotent finalize: a request already finalized is a no-op.
  if v_cur_status in ('completed', 'failed') then
    return;
  end if;

  select balance_rupiah, balance_held
    into v_balance, v_held
  from public.users
  where id = v_user_id
  for update;

  if p_status = 'failed' then
    -- Release the full hold, charge nothing.
    update public.users
      set balance_held = greatest(balance_held - v_hold, 0)
    where id = v_user_id;

    update public.ai_usage_logs
      set status = 'failed',
          input_tokens = p_input_tokens,
          output_tokens = p_output_tokens
    where id = p_request_id;
    return;
  end if;

  -- completed ---------------------------------------------------------------
  if p_actual_cost_usd is null or p_actual_cost_usd < 0
     or p_forex_rate_used is null or p_forex_rate_used <= 0 then
    raise exception 'INVALID_ACTUAL_COST';
  end if;

  v_actual_rp := round(p_actual_cost_usd * p_forex_rate_used);

  -- Anti-minus cap (§6.3 #5): never charge more than the hold.
  v_charge := least(v_actual_rp, v_hold);
  v_shortfall := v_actual_rp - v_charge;   -- >0 only in the extreme edge case

  -- Release the full hold, then debit the capped actual charge.
  update public.users
    set balance_held  = greatest(balance_held - v_hold, 0),
        balance_rupiah = balance_rupiah - v_charge
  where id = v_user_id;

  update public.ai_usage_logs
    set status = 'completed',
        input_tokens = p_input_tokens,
        output_tokens = p_output_tokens,
        forex_rate_used = p_forex_rate_used,
        cost_rupiah = v_charge
  where id = p_request_id;

  -- Ledger entry for the actual usage debit.
  insert into public.wallet_ledger (
    user_id, type, amount, balance_before, balance_after,
    reference_type, reference_id, description
  ) values (
    v_user_id, 'usage', -v_charge, v_balance, v_balance - v_charge,
    'ai_usage_logs', p_request_id, 'AI request usage charge'
  );

  -- Extreme edge case: actual exceeded the buffered hold. Business absorbs it.
  if v_shortfall > 0 then
    insert into public.reconciliation_logs (category, status, details)
    values (
      'hold_insufficient', 'alert',
      jsonb_build_object(
        'request_id', p_request_id,
        'user_id', v_user_id,
        'nominal_hold', v_hold,
        'actual_rupiah', v_actual_rp,
        'shortfall_rupiah', v_shortfall
      )
    );
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- add_tokens — credit balance on a paid topup (§6.2, §15).
-- Atomic: lock user, credit balance, write ledger. Caller must have already
-- verified the webhook signature and idempotency BEFORE calling this.
-- ---------------------------------------------------------------------------
create or replace function public.add_tokens(
  p_user_id         uuid,
  p_amount_rupiah   numeric,
  p_transaction_id  uuid,
  p_description      text default 'Topup credit'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric;
begin
  if p_amount_rupiah is null or p_amount_rupiah <= 0 then
    raise exception 'INVALID_AMOUNT';
  end if;

  select balance_rupiah into v_balance
  from public.users
  where id = p_user_id
  for update;

  if not found then
    raise exception 'USER_NOT_FOUND';
  end if;

  update public.users
    set balance_rupiah = balance_rupiah + p_amount_rupiah
  where id = p_user_id;

  insert into public.wallet_ledger (
    user_id, type, amount, balance_before, balance_after,
    reference_type, reference_id, description
  ) values (
    p_user_id, 'topup', p_amount_rupiah, v_balance, v_balance + p_amount_rupiah,
    'transaction', p_transaction_id, p_description
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- sweep_orphaned_holds — release holds stuck in 'authorized' > 5 min (§6.3.1).
-- Called by the authorize-timeout-sweep cron (every 1 minute).
-- Returns the number of holds released.
-- ---------------------------------------------------------------------------
create or replace function public.sweep_orphaned_holds()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  r            record;
  v_count      integer := 0;
  v_balance    numeric;
begin
  for r in
    select id, user_id, nominal_hold
    from public.ai_usage_logs
    where status = 'authorized'
      and created_at < now() - interval '5 minutes'
    order by created_at
  loop
    -- Lock the user before touching balance_held.
    select balance_rupiah into v_balance
    from public.users
    where id = r.user_id
    for update;

    update public.users
      set balance_held = greatest(balance_held - r.nominal_hold, 0)
    where id = r.user_id;

    update public.ai_usage_logs
      set status = 'failed',
          fail_reason = 'timeout_orphaned_hold'
    where id = r.id
      and status = 'authorized';   -- guard against a concurrent finalize

    -- Audit-trail entry (amount 0: no charge, just records the release).
    insert into public.wallet_ledger (
      user_id, type, amount, balance_before, balance_after,
      reference_type, reference_id, description
    ) values (
      r.user_id, 'hold_release', 0, v_balance, v_balance,
      'ai_usage_logs', r.id, 'Orphaned hold auto-released (timeout)'
    );

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

-- Lock down execution: only the service role runs these.
revoke all on function public.authorize_request(uuid, uuid, numeric, numeric, text) from public, anon, authenticated;
revoke all on function public.finalize_request(uuid, text, numeric, numeric, integer, integer) from public, anon, authenticated;
revoke all on function public.add_tokens(uuid, numeric, uuid, text) from public, anon, authenticated;
revoke all on function public.sweep_orphaned_holds() from public, anon, authenticated;
grant execute on function public.authorize_request(uuid, uuid, numeric, numeric, text) to service_role;
grant execute on function public.finalize_request(uuid, text, numeric, numeric, integer, integer) to service_role;
grant execute on function public.add_tokens(uuid, numeric, uuid, text) to service_role;
grant execute on function public.sweep_orphaned_holds() to service_role;
