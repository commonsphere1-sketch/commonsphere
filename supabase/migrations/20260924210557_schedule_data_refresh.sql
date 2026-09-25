-- The schedule for the refresh-data Edge Function.
--
-- Two Vault secrets, created here if missing:
--   data_refresh_token  32 random bytes generated in the database, which the
--                       cron job sends and the function checks; it is never
--                       written anywhere else or shown to anyone.
--   project_url         this project's API URL. A local stack should replace
--                       it with http://api.supabase.internal:8000.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'data_refresh_token') then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'data_refresh_token',
      'Sent by the data-refresh cron job; checked by the refresh-data Edge Function'
    );
  end if;
  if not exists (select 1 from vault.secrets where name = 'project_url') then
    perform vault.create_secret(
      'https://diplptvvvibnrrntyrap.supabase.co',
      'project_url',
      'This project''s API URL, for scheduled calls to its Edge Functions'
    );
  end if;
end $$;

-- One call per job, so a slow or failing source cannot hold up the others.
-- Returns the pg_net request ids.
create or replace function private.invoke_data_refresh(jobs text[] default array['wb', 'bls', 'governors', 'elections', 'bea'])
returns bigint[]
language sql
security invoker
set search_path = ''
as $$
  select coalesce(array_agg(
    net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
             || '/functions/v1/refresh-data?job=' || j,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-refresh-token', (select decrypted_secret from vault.decrypted_secrets where name = 'data_refresh_token')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 10000
    )
  ), '{}')
  from unnest(jobs) as j;
$$;
revoke all on function private.invoke_data_refresh(text[]) from public, anon, authenticated;

-- Twice a day. The sources change at most daily (BLS monthly, the World
-- Bank a few times a year, BEA's calendar weekly, elections as they are
-- added), and the keyless BLS API allows 25 requests a day: each run uses 5.
select cron.schedule(
  'refresh-published-figures',
  '17 6,18 * * *',
  $$select private.invoke_data_refresh()$$
);
