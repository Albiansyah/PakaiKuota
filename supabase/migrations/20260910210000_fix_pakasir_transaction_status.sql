create or replace function public.process_pakasir_payment(
  p_order_id text,
  p_amount_rupiah numeric
)
returns boolean
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_transaction record;
begin
  select id, user_id, amount_rupiah, status
    into v_transaction
  from public.transactions
  where order_id = p_order_id
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_transaction.status <> 'pending' then
    return false;
  end if;

  if v_transaction.amount_rupiah <> p_amount_rupiah then
    raise exception 'AMOUNT_MISMATCH';
  end if;

  perform public.add_tokens(
    v_transaction.user_id,
    v_transaction.amount_rupiah,
    v_transaction.id,
    'Topup via Pakasir (order ' || p_order_id || ')'
  );

  update public.transactions
    set
      status = 'success',
      paid_at = now(),
      updated_at = now()
  where id = v_transaction.id;

  return true;
end;
$function$;

revoke all on function public.process_pakasir_payment(text, numeric)
  from public, anon, authenticated;

grant execute on function public.process_pakasir_payment(text, numeric)
  to service_role;