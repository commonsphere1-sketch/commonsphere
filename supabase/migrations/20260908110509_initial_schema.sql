-- CommonSphere initial schema
--
-- Scope is deliberately narrow: only the data the app already keeps per person
-- moves to the server. Everything the site shows — countries, states, cities,
-- economies, policy, crime, boundaries — is static curated data compiled into
-- the bundle, and belongs in the bundle. Putting it in Postgres would add a
-- network round trip and a failure mode without making a single figure fresher.
--
-- What moves:
--   profiles      the display name, username, email and avatar that currently
--                 live in localStorage, so they follow a person between devices
--   notes         the only content a person authors here
--   note_links    URLs attached to a note, as rows rather than a JSON blob, so
--                 they can be constrained and indexed
--   pinned_items  the dashboard's pinned countries and states
--
-- What stays local, on purpose: theme and the filter-row open/closed state.
-- Those describe a device, not a person, and syncing them would make one
-- machine's choice override another's.

-- ─────────────────────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto" with schema extensions;

-- ─────────────────────────────────────────────────────────────────────────────
-- updated_at maintenance
--
-- SECURITY INVOKER and a pinned empty search_path: this runs on every write, so
-- it must not be a way to reach anything the caller could not reach itself.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
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

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles
--
-- Keyed by auth.users.id rather than carrying a surrogate key, so a profile
-- cannot exist without an account and cannot outlive one.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  display_name text,
  email text,
  avatar_color text not null default '#999999',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Constraints mirror the client-side validation in src/lib/security.ts, so a
  -- request that bypasses the UI cannot store what the UI would have refused.
  constraint profiles_username_format
    check (username is null or username ~ '^[a-zA-Z0-9_]{3,30}$'),
  constraint profiles_display_name_length
    check (display_name is null or char_length(display_name) <= 100),
  constraint profiles_email_length
    check (email is null or char_length(email) <= 254),
  -- 'glass' is the non-colour avatar option; anything else must be a hex value.
  constraint profiles_avatar_color_format
    check (avatar_color = 'glass' or avatar_color ~ '^#[0-9a-fA-F]{6}$')
);

comment on table public.profiles is
  'One row per account. Mirrors what the app used to keep in localStorage.';

-- ─────────────────────────────────────────────────────────────────────────────
-- notes
-- ─────────────────────────────────────────────────────────────────────────────
create table public.notes (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  content text not null default '',
  -- Where the note was taken from, e.g. 'countries' or a country id, so a note
  -- can be shown next to the thing it is about.
  context_type text,
  context_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint notes_title_length check (char_length(title) <= 120),
  constraint notes_content_length check (char_length(content) <= 10000)
);

comment on table public.notes is 'User-authored notes. The only content a person creates here.';

-- ─────────────────────────────────────────────────────────────────────────────
-- note_links
--
-- The scheme check is the server-side half of sanitizeUrl(): the client already
-- rejects anything that is not http/https, and so does the database, because a
-- policy enforced only in the browser is not enforced.
-- ─────────────────────────────────────────────────────────────────────────────
create table public.note_links (
  id uuid primary key default extensions.gen_random_uuid(),
  note_id uuid not null references public.notes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  url text not null,
  created_at timestamptz not null default now(),

  constraint note_links_url_length check (char_length(url) <= 2048),
  constraint note_links_url_scheme check (url ~* '^https?://')
);

comment on table public.note_links is 'URLs attached to a note; http/https only, enforced here as well as in the client.';

-- ─────────────────────────────────────────────────────────────────────────────
-- pinned_items
-- ─────────────────────────────────────────────────────────────────────────────
create table public.pinned_items (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  created_at timestamptz not null default now(),

  constraint pinned_items_entity_type check (entity_type in ('country', 'state')),
  -- Pinning the same thing twice is not a second pin.
  constraint pinned_items_unique unique (user_id, entity_type, entity_id)
);

comment on table public.pinned_items is 'Countries and states pinned to the dashboard strip.';

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
--
-- Postgres does not index foreign keys automatically, and every one of these
-- columns is also read by an RLS policy on each request — so the index earns
-- its keep twice.
-- ─────────────────────────────────────────────────────────────────────────────
create index notes_user_id_idx on public.notes (user_id);
create index notes_user_updated_idx on public.notes (user_id, updated_at desc);
create index note_links_note_id_idx on public.note_links (note_id);
create index note_links_user_id_idx on public.note_links (user_id);
create index pinned_items_user_id_idx on public.pinned_items (user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Triggers
-- ─────────────────────────────────────────────────────────────────────────────
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
--
-- Enabled on every table: these live in public, which is exposed to the Data
-- API, so without RLS a table is readable by anyone holding the publishable
-- key — which is, by design, everyone.
--
-- Each policy names its role with TO authenticated and pairs it with an
-- ownership predicate. TO authenticated on its own is authentication without
-- authorisation: it proves someone is signed in, not that the row is theirs.
--
-- auth.uid() is wrapped in a select so the planner evaluates it once per query
-- instead of once per row.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.notes enable row level security;
alter table public.note_links enable row level security;
alter table public.pinned_items enable row level security;

-- profiles
create policy "Users can read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can create their own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- Both USING and WITH CHECK: USING decides which row may be updated, WITH CHECK
-- decides what it may become. Without the latter a user could rewrite the id
-- and hand the row to someone else.
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users can delete their own profile"
  on public.profiles for delete
  to authenticated
  using ((select auth.uid()) = id);

-- notes
create policy "Users can read their own notes"
  on public.notes for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own notes"
  on public.notes for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own notes"
  on public.notes for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own notes"
  on public.notes for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- note_links
create policy "Users can read their own note links"
  on public.note_links for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own note links"
  on public.note_links for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own note links"
  on public.note_links for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own note links"
  on public.note_links for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- pinned_items
create policy "Users can read their own pins"
  on public.pinned_items for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own pins"
  on public.pinned_items for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own pins"
  on public.pinned_items for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Grants
--
-- RLS decides which rows are visible; it does not decide whether the table is
-- reachable at all. Depending on the project's Data API settings a new table
-- may not be exposed, so the roles are granted explicitly. anon gets nothing:
-- there is no row in any of these tables that a signed-out visitor should see.
-- ─────────────────────────────────────────────────────────────────────────────
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.notes to authenticated;
grant select, insert, update, delete on public.note_links to authenticated;
grant select, insert, delete on public.pinned_items to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Avatar storage
--
-- Upsert needs INSERT, SELECT and UPDATE together: granting INSERT alone lets a
-- first upload succeed and every replacement fail silently.
--
-- Each person may only write inside a folder named for their own uid, which is
-- what the storage.foldername check enforces.
-- ─────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MB; the client downscales well below this before uploading
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "Avatar images are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "Users can replace their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
