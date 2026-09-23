-- ─────────────────────────────────────────────────────────────────────────────
-- note_links: the parent note must belong to the same user
--
-- The original insert/update policies checked only that user_id was the
-- caller's own. They did not check note_id, so a signed-in user who learned
-- another user's note id could attach link rows to that note. The rows stayed
-- invisible to the note's owner (select is still scoped by user_id), but they
-- were written against someone else's data, and they would surface the moment
-- any query joined links by note_id.
--
-- The subquery reads public.notes, whose own RLS already limits it to the
-- caller's rows; the explicit user_id comparison is kept anyway so the policy
-- stays correct on its own terms if that ever changes. note_links_note_id_idx
-- and the notes primary key keep the lookup to an index probe.
-- ─────────────────────────────────────────────────────────────────────────────

drop policy if exists "Users can create their own note links" on public.note_links;
drop policy if exists "Users can update their own note links" on public.note_links;

create policy "Users can create their own note links"
  on public.note_links for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.notes n
      where n.id = note_id
        and n.user_id = (select auth.uid())
    )
  );

create policy "Users can update their own note links"
  on public.note_links for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.notes n
      where n.id = note_id
        and n.user_id = (select auth.uid())
    )
  );
