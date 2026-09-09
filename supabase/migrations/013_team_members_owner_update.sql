-- 013_team_members_owner_update.sql — close the UPDATE gap.
--
-- 008 gave owners insert/delete on the roster but no UPDATE, so role
-- changes (project_role) and ownership transfer fail closed in Supabase
-- mode. Owners may update rows of teams they own; team_role promotion is
-- still mediated by the transferOwnership server action (which demotes
-- the previous owner in the same flow).

drop policy if exists members_owner_update on public.team_members;
create policy members_owner_update on public.team_members
  for update to authenticated
  using (public.is_team_owner(team_id))
  with check (public.is_team_owner(team_id));
