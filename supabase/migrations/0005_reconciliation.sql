create or replace function public.run_billing_reconciliation()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ledger numeric;
  v_usage numeric;
  v_held numeric;
  v_expected numeric;
  v_status text;
begin
  select coalesce(sum(abs(amount)), 0) into v_ledger
  from public.wallet_ledger where type = 'usage';
  select coalesce(sum(cost_rupiah), 0) into v_usage
  from public.ai_usage_logs where status = 'completed';
  select coalesce(sum(balance_held), 0) into v_held from public.users;
  select coalesce(sum(nominal_hold), 0) into v_expected
  from public.ai_usage_logs
  where status in ('authorized', 'processing')
    and created_at >= now() - interval '5 minutes';

  v_status := case when v_ledger = v_usage and abs(v_held - v_expected) < 1 then 'ok' else 'alert' end;
  insert into public.reconciliation_logs(category, status, details)
  values ('billing', v_status, jsonb_build_object(
    'ledger_usage', v_ledger,
    'usage_logs', v_usage,
    'balance_held', v_held,
    'expected_held', v_expected
  ));
end;
$$;

revoke all on function public.run_billing_reconciliation() from public, anon, authenticated;
grant execute on function public.run_billing_reconciliation() to service_role;
