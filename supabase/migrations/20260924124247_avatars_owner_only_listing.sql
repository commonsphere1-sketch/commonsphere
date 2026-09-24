-- ─────────────────────────────────────────────────────────────────────────────
-- avatars: stop anonymous listing of the bucket
--
-- The bucket is public, which is what lets an avatar load from its public URL
-- in an <img> tag. That path does not consult storage.objects policies at all.
-- The select policy granted to `public` did something else: it let anyone call
-- the storage list API on the bucket, and because every file lives in a folder
-- named for its owner's uid, that listing was a directory of every user id.
--
-- Owners still need SELECT on their own folder, because upsert (replace an
-- existing avatar) reads the row before updating it.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "Avatar images are publicly readable" on storage.objects;

create policy "Users can read their own avatar objects"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );
