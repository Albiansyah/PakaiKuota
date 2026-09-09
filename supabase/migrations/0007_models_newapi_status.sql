create table if not exists public.models_backup_pre_schema_migration as select * from public.models;
alter table public.models add column if not exists slug text;
alter table public.models add column if not exists input_price_per_1k numeric;
alter table public.models add column if not exists output_price_per_1k numeric;
alter table public.models add column if not exists markup_percent numeric;
alter table public.models add column if not exists enabled boolean;
alter table public.models alter column tier type text using tier::text;
update public.models set
  slug = lower(regexp_replace(regexp_replace(name, '[/\\s]+', '-', 'g'), '[^a-z0-9\\-]', '', 'g')),
  input_price_per_1k = upstream_price_per_token * 1000,
  output_price_per_1k = upstream_price_per_token * 1000,
  markup_percent = case when upstream_price_per_token > 0 then greatest(((markup_price_per_token / upstream_price_per_token) - 1) * 100, 0) else 0 end,
  enabled = is_active
where slug is null;
update public.models set tier = case tier when 'murah' then 'standard' when 'menengah' then 'premium' when 'mahal' then 'ultra' else tier end;
alter table public.models alter column slug set not null;
create unique index if not exists models_slug_key on public.models(slug);
alter table public.newapi_config add column if not exists last_test_status text check (last_test_status in ('success','failed'));
alter table public.newapi_config add column if not exists last_test_response_time_ms integer;
alter table public.newapi_config add column if not exists last_test_error text;
alter table public.newapi_config add column if not exists last_tested_at timestamptz;
