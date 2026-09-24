-- The notes page lists a person's notes newest first by created_at. The
-- initial schema indexed (user_id, updated_at) instead, plus (user_id) on its
-- own, which the composite already covers. One index that matches the query
-- replaces both; its leading user_id column still serves the foreign key and
-- the RLS predicate.
drop index if exists public.notes_user_id_idx;
drop index if exists public.notes_user_updated_idx;
create index if not exists notes_user_created_idx on public.notes (user_id, created_at desc);
