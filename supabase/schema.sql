-- CommonSphere — profiles table
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New
-- query), then set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.
--
-- Row-level security is enabled before any policy is added, and every policy is
-- scoped to the calling user. The anon key ships in the browser bundle, so RLS
-- is the only thing standing between a visitor and everyone else's rows — a
-- table left unprotected here would be readable by anyone who opened devtools.

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  username     text unique,
  email        text,
  updated_at   timestamptz not null default now()
);

-- Usernames are compared case-insensitively; without this, "Ada" and "ada"
-- would both be accepted as distinct handles.
create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username));

alter table public.profiles enable row level security;

-- Policies use (select auth.uid()) rather than a bare auth.uid(). The bare
-- call is re-evaluated for every candidate row; wrapping it in a subquery lets
-- Postgres evaluate it once. Negligible on a one-row-per-user table, but it is
-- the correct pattern and costs nothing to adopt here.

-- A user may read only their own row.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

-- A user may create only their own row.
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- A user may update only their own row, and cannot reassign it to someone else.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Table-level privileges are separate from RLS. RLS decides which *rows* are
-- visible once a table is reachable; these grants decide whether the role can
-- reach the table through the Data API at all. Depending on the project's Data
-- API settings a newly created table may not be exposed, and the client then
-- fails with a permission error even though the policies above are correct.
--
-- Least privilege: only `authenticated` is granted anything, and only the three
-- verbs the app actually issues. `anon` gets nothing — a signed-out visitor has
-- no business reading profiles — and no DELETE is granted, since the app never
-- deletes a profile and the row goes with the user via the cascade above.
grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;

-- Keep updated_at honest rather than trusting the client to send it.
-- search_path is pinned empty so the function cannot be hijacked by a
-- shadowing object in a caller-controlled schema.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();
