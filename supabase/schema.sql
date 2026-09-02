-- CommonSphere — profiles table
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New
-- query), then set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.
--
-- Row-level security is enabled before any policy is added, and every policy is
-- scoped to auth.uid(). The anon key ships in the browser bundle, so RLS is the
-- only thing standing between a visitor and everyone else's rows — a table left
-- unprotected here would be readable by anyone who opened devtools.

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

-- A user may read only their own row.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- A user may create only their own row.
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- A user may update only their own row, and cannot reassign it to someone else.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Keep updated_at honest rather than trusting the client to send it.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
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
