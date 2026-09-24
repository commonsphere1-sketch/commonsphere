-- ─────────────────────────────────────────────────────────────────────────────
-- Watch list and alerts
--
-- The places a person watches in Settings, and which topics they care about
-- for each. Alerts are worked out in the browser: `snapshot` holds the
-- watched figures as they stood when the person last looked, and the app
-- compares it with the figures the site carries now. When a data release
-- changes a head of state or an inflation rate, the difference is the alert.
--
-- Only topics the site has data for can be chosen: leadership and economy
-- for countries and states, and policy (minimum wage, tax rates) for states.
--
-- email_digest records that the person wants those changes by email. No
-- email is sent yet: that needs a mail provider this project does not have.
-- The preference is kept so a digest can start from the people who asked.
-- ─────────────────────────────────────────────────────────────────────────────

create table public.watchlist (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  topics text[] not null default array['leadership', 'economy'],
  snapshot jsonb not null default '{}'::jsonb,
  seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  constraint watchlist_entity_type check (entity_type in ('country', 'state')),
  constraint watchlist_entity_id_length check (char_length(entity_id) between 1 and 40),
  constraint watchlist_topics
    check (topics <@ array['leadership', 'economy', 'policy']::text[] and cardinality(topics) <= 3),
  -- A handful of figures per place; anything near this is not the app.
  constraint watchlist_snapshot_size check (pg_column_size(snapshot) <= 8192),
  constraint watchlist_unique unique (user_id, entity_type, entity_id)
);

comment on table public.watchlist is
  'Places a person watches, the topics they chose, and the figures as they last saw them.';

-- The unique constraint's index leads with user_id, so it also serves the
-- foreign key and the RLS predicate; no separate index is needed.

alter table public.watchlist enable row level security;

create policy "Users can read their own watch list"
  on public.watchlist for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add to their own watch list"
  on public.watchlist for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own watch list"
  on public.watchlist for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can remove from their own watch list"
  on public.watchlist for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- This project grants new public tables to anon by default; take that back.
revoke all on table public.watchlist from anon, authenticated;
grant select, insert, update, delete on public.watchlist to authenticated;

-- ── Email digest opt-in ──────────────────────────────────────────────────────
alter table public.profiles add column email_digest boolean not null default false;
grant update (email_digest) on public.profiles to authenticated;

-- ── Row cap ──────────────────────────────────────────────────────────────────
-- Same function as the other caps, with the watch list added.
create or replace function private.enforce_row_caps()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  n integer;
begin
  if tg_table_name = 'notes' then
    select count(*) into n from public.notes where user_id = new.user_id;
    if n >= 5000 then
      raise exception 'Note limit reached (5,000 per account).' using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'note_links' then
    select count(*) into n from public.note_links where note_id = new.note_id;
    if n >= 10 then
      raise exception 'A note can hold at most 10 links.' using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'pinned_items' then
    select count(*) into n from public.pinned_items where user_id = new.user_id;
    if n >= 500 then
      raise exception 'Pin limit reached (500 per account).' using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'watchlist' then
    select count(*) into n from public.watchlist where user_id = new.user_id;
    if n >= 200 then
      raise exception 'Watch list limit reached (200 places per account).' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger watchlist_row_cap before insert on public.watchlist
  for each row execute function private.enforce_row_caps();
