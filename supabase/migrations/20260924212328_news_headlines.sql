-- Headlines from established outlets' public RSS feeds, matched to the
-- countries and US states they name, refreshed every 30 minutes by the
-- refresh-data Edge Function (job "news").
--
-- Only the headline, link, outlet and time are kept - never article text;
-- the site links to the publisher. places holds "c:<ISO2>" for a country
-- and "s:<postal code>" for a state; a headline naming more than one place
-- is about their relations. Public read, no client writes.
create table public.news_items (
  url text primary key check (url ~ '^https://' and char_length(url) <= 600),
  title text not null check (char_length(title) between 15 and 400),
  outlet text not null check (char_length(outlet) between 1 and 80),
  published_at timestamptz not null,
  places text[] not null check (cardinality(places) between 1 and 20),
  fetched_at timestamptz not null default now()
);
comment on table public.news_items is
  'Headlines (title, link, outlet, time) from established outlets, tagged with the places they name. Refreshed by the refresh-data Edge Function.';
create index news_items_places_idx on public.news_items using gin (places);
create index news_items_published_idx on public.news_items (published_at desc);

alter table public.news_items enable row level security;
revoke all on public.news_items from anon, authenticated;
grant select on public.news_items to anon, authenticated;
create policy "Headlines are public"
  on public.news_items for select to anon, authenticated using (true);

-- The news job is logged like the others.
alter table public.data_refresh_runs drop constraint data_refresh_runs_job_check;
alter table public.data_refresh_runs add constraint data_refresh_runs_job_check
  check (job in ('wb', 'bls', 'governors', 'elections', 'bea', 'news'));

-- Every half hour: headlines move faster than statistics.
select cron.schedule(
  'refresh-news',
  '*/30 * * * *',
  $$select private.invoke_data_refresh(array['news'])$$
);
