-- Published figures and upcoming events, refreshed on a schedule by the
-- refresh-data Edge Function from the sources the build scripts use (World
-- Bank, BLS, Wikidata, BEA).
--
-- Everything here is public statistics: anyone may read it, and nothing but
-- the function, which writes with the service role, may change it. The site
-- only ever uses a refreshed figure when it is for the same or a later
-- period than the one it was built with, so a refresh can bring a figure
-- forward but never back.

-- ── Figures ──────────────────────────────────────────────────────────────
create table public.live_figures (
  -- wb: World Bank WDI; bls: BLS LAUS; wikidata: governors.
  source text not null check (source in ('wb', 'bls', 'wikidata')),
  -- The publisher's series code (NY.GDP.MKTP.CD, LASST480000000000003) or
  -- "governor".
  series text not null check (char_length(series) between 1 and 40),
  -- ISO 3166 alpha-2 for a country; the postal code for a US state.
  area text not null check (char_length(area) between 1 and 10),
  -- The period the value is for: a year, a month (YYYY-MM) or a date.
  period text not null check (period ~ '^\d{4}(-\d{2}(-\d{2})?)?$'),
  value double precision,
  text_value text check (char_length(text_value) <= 200),
  detail jsonb,
  fetched_at timestamptz not null default now(),
  primary key (source, series, area)
);
comment on table public.live_figures is
  'Latest published figure per series and place, refreshed by the refresh-data Edge Function. Public, read-only to clients.';

-- ── Upcoming events ──────────────────────────────────────────────────────
create table public.upcoming_events (
  -- "<source>:<its own id>", so a refresh replaces rather than duplicates.
  id text primary key check (char_length(id) between 1 and 160),
  scope text not null check (scope in ('states', 'economies', 'cities')),
  area text check (char_length(area) <= 10),
  kind text not null check (char_length(kind) between 1 and 40),
  title text not null check (char_length(title) between 1 and 300),
  event_date date not null,
  source text not null check (source in ('wikidata', 'bea')),
  source_url text not null check (source_url ~ '^https://' and char_length(source_url) <= 300),
  fetched_at timestamptz not null default now()
);
comment on table public.upcoming_events is
  'Dated upcoming events (elections, data releases) from published calendars, refreshed by the refresh-data Edge Function.';
create index upcoming_events_scope_date_idx on public.upcoming_events (scope, event_date);

-- ── Runs ─────────────────────────────────────────────────────────────────
create table public.data_refresh_runs (
  id bigint generated always as identity primary key,
  job text not null check (job in ('wb', 'bls', 'governors', 'elections', 'bea')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'ok', 'failed')),
  rows_written integer not null default 0 check (rows_written >= 0),
  message text check (char_length(message) <= 500)
);
comment on table public.data_refresh_runs is
  'One row per refresh job run: when it ran, whether it worked, how many rows it wrote.';
create index data_refresh_runs_job_started_idx on public.data_refresh_runs (job, started_at desc);

-- ── Access: read for everyone, write for no client ───────────────────────
alter table public.live_figures enable row level security;
alter table public.upcoming_events enable row level security;
alter table public.data_refresh_runs enable row level security;

revoke all on public.live_figures, public.upcoming_events, public.data_refresh_runs from anon, authenticated;
grant select on public.live_figures, public.upcoming_events, public.data_refresh_runs to anon, authenticated;

create policy "Published figures are public"
  on public.live_figures for select to anon, authenticated using (true);
create policy "Upcoming events are public"
  on public.upcoming_events for select to anon, authenticated using (true);
create policy "Refresh runs are public"
  on public.data_refresh_runs for select to anon, authenticated using (true);

-- ── The scheduler's credential ───────────────────────────────────────────
-- The cron job sends a random token that is generated inside the database
-- and kept in Vault (see the next migration); the function asks this, with
-- the service role, whether a token is the one. Nobody - no client, and no
-- person - ever needs to handle a key for the schedule to work.
create or replace function public.data_refresh_token_ok(token text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'data_refresh_token' and decrypted_secret = token
  );
$$;
revoke all on function public.data_refresh_token_ok(text) from public, anon, authenticated;
grant execute on function public.data_refresh_token_ok(text) to service_role;

-- ── Extensions for the schedule ──────────────────────────────────────────
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;
