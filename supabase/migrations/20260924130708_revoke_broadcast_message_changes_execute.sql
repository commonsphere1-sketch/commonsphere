-- public.broadcast_message_changes() is the trigger function behind
-- messages_broadcast_trigger, on tables this repository does not define. It is
-- SECURITY DEFINER and, like every new function, was executable by PUBLIC, so
-- the linter flagged it as reachable at /rest/v1/rpc/. A trigger does not need
-- EXECUTE to fire, so only the direct call is removed; the trigger keeps
-- broadcasting.
--
-- Guarded, because a local database built from this repository alone has no
-- such function. (The hosted project ran the bare REVOKE.)
do $$
begin
  if to_regprocedure('public.broadcast_message_changes()') is not null then
    revoke execute on function public.broadcast_message_changes() from public, anon, authenticated;
  end if;
end;
$$;
