-- ─────────────────────────────────────────────────────────────────────────────
-- Accounts on Supabase Auth
--
-- Sign-in moves from the Anima SDK to Supabase Auth, so the tables from the
-- initial schema start receiving rows. This migration adds what that needs:
--
--   · a profile row for every account, created by the database when the
--     account is, so the app never has to insert one itself
--   · the profile's email kept in step with the account's
--   · usernames matching what the sign-up form accepts, unique regardless
--     of case
--   · notes that record the place they are about, and an optional voice
--     recording held in a private bucket
--   · privileges narrowed to exactly what the app does
--   · per-account caps, so one account cannot fill the database
--
-- Privileged functions live in `private`, a schema the Data API does not
-- expose: SECURITY DEFINER in `public` would be callable by every visitor.
-- ─────────────────────────────────────────────────────────────────────────────

create schema if not exists private;
revoke all on schema private from public;

-- ─────────────────────────────────────────────────────────────────────────────
-- Profiles for new accounts
--
-- SECURITY DEFINER because the new user has no session yet when auth.users is
-- written, so RLS would refuse the insert. search_path is pinned empty and
-- every name is schema-qualified, so nothing can be substituted underneath it.
--
-- raw_user_meta_data is whatever the person typed at sign-up (or what an OAuth
-- provider sent). It is used here for display only, never for authorisation,
-- and is trimmed to the column limits: a value the constraints would refuse
-- must not be able to fail the sign-up itself.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  shown text := left(
    nullif(btrim(coalesce(meta ->> 'display_name', meta ->> 'full_name', meta ->> 'name')), ''),
    100
  );
  wanted text := nullif(btrim(meta ->> 'username'), '');
begin
  -- A requested username is kept only if it is well formed and free; if not,
  -- the account is still created and the person picks one in Settings.
  if wanted is not null
     and (wanted !~ '^[a-zA-Z0-9_.]{3,30}$'
          or exists (select 1 from public.profiles p where lower(p.username) = lower(wanted))) then
    wanted := null;
  end if;

  begin
    insert into public.profiles (id, email, display_name, username)
    values (new.id, new.email, shown, wanted)
    on conflict (id) do nothing;
  exception when unique_violation then
    -- Two sign-ups raced for the same username. The later one goes without.
    insert into public.profiles (id, email, display_name)
    values (new.id, new.email, shown)
    on conflict (id) do nothing;
  end;
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- The profile's copy of the email follows the account's, which changes only
-- after the person confirms the new address.
create or replace function private.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

revoke all on function private.sync_profile_email() from public;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function private.sync_profile_email();

-- Accounts that existed before the trigger get their row now.
insert into public.profiles (id, email)
select u.id, u.email from auth.users u
on conflict (id) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- Profile constraints
-- ─────────────────────────────────────────────────────────────────────────────

-- The sign-up form has always allowed dots; the original check did not, so a
-- username the form accepted would have been refused here.
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles
  add constraint profiles_username_format
  check (username is null or username ~ '^[a-zA-Z0-9_.]{3,30}$');

-- "Ada" and "ada" are the same handle to a reader.
create unique index if not exists profiles_username_lower_key
  on public.profiles (lower(username));

-- The app only ever stores the public URL of the person's own upload.
alter table public.profiles
  add constraint profiles_avatar_url_format
  check (avatar_url is null or (char_length(avatar_url) <= 1024 and avatar_url ~ '^https://'));

-- ─────────────────────────────────────────────────────────────────────────────
-- Notes: the place a note is about, and a voice recording
--
-- The initial schema called these context_type / context_id. What the app
-- stores is a type ("Country") and a name ("Kenya"), so they are named for that.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.notes rename column context_type to entity_type;
alter table public.notes rename column context_id to entity_name;

alter table public.notes
  add constraint notes_entity_type_length
  check (entity_type is null or char_length(entity_type) <= 40);
alter table public.notes
  add constraint notes_entity_name_length
  check (entity_name is null or char_length(entity_name) <= 120);

-- The storage path of the note's recording: <owner uid>/<uuid>.<ext>. The
-- folder must be the note owner's own, so a note cannot point at a file in
-- someone else's folder (the bucket policies would refuse to serve it anyway).
alter table public.notes add column voice_path text;
alter table public.notes
  add constraint notes_voice_path_format
  check (
    voice_path is null
    or (
      voice_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(webm|ogg|m4a|mp3)$'
      and split_part(voice_path, '/', 1) = user_id::text
    )
  );

alter table public.pinned_items
  add constraint pinned_items_entity_id_length
  check (char_length(entity_id) between 1 and 40);

-- ─────────────────────────────────────────────────────────────────────────────
-- Privileges
--
-- Projects created before Supabase stopped exposing new tables by default
-- grant ALL on public tables to anon and authenticated. RLS already hides
-- every row from anon, but a privilege nobody uses is a privilege to lose, so
-- each table is reset to exactly what the app does.
--
-- Profiles are created by the trigger above and removed with the account, so
-- the client may only read its own and change four columns. email is not one
-- of them: it follows the account.
-- ─────────────────────────────────────────────────────────────────────────────
revoke all on table public.profiles, public.notes, public.note_links, public.pinned_items
  from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (username, display_name, avatar_color, avatar_url) on public.profiles to authenticated;
grant select, insert, update, delete on public.notes to authenticated;
grant select, insert, update, delete on public.note_links to authenticated;
grant select, insert, delete on public.pinned_items to authenticated;

drop policy if exists "Users can create their own profile" on public.profiles;
drop policy if exists "Users can delete their own profile" on public.profiles;

-- ─────────────────────────────────────────────────────────────────────────────
-- Per-account caps
--
-- The column constraints bound each row; these bound the number of rows, so a
-- script holding one account's session cannot fill the database. Generous
-- next to what the interface can produce. SECURITY INVOKER: the count runs
-- under the caller's own RLS, which is exactly the set being capped.
-- ─────────────────────────────────────────────────────────────────────────────
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
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_row_caps() from public;

create trigger notes_row_cap before insert on public.notes
  for each row execute function private.enforce_row_caps();
create trigger note_links_row_cap before insert on public.note_links
  for each row execute function private.enforce_row_caps();
create trigger pinned_items_row_cap before insert on public.pinned_items
  for each row execute function private.enforce_row_caps();

-- ─────────────────────────────────────────────────────────────────────────────
-- Voice notes
--
-- Private: a recording is someone's voice, so it is never served from a public
-- URL. The app plays it through a short-lived signed URL, which only its
-- owner can create. Every policy is scoped to the owner's own folder.
-- ─────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'voice-notes',
  'voice-notes',
  false,
  10485760, -- 10 MB, several minutes of Opus audio
  array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg']
)
on conflict (id) do nothing;

create policy "Users can read their own voice notes"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'voice-notes'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "Users can upload their own voice notes"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'voice-notes'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "Users can replace their own voice notes"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'voice-notes'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'voice-notes'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own voice notes"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'voice-notes'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
