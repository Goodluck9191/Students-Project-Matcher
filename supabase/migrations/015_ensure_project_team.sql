-- 015_ensure_project_team.sql — idempotent workspace creation for any project.
--
-- Join requests (and first invites) need a team row, but projects created
-- before teams existed — or via paths that skip team setup — have none.
-- This definer function returns the existing team or creates one owned by
-- the PROJECT CREATOR (never the caller) with the creator as first member.
-- Callers gain nothing except a valid team_id to reference; team RLS still
-- governs every subsequent read/write.

create or replace function public.ensure_project_team(p_project_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project public.projects%rowtype;
  v_team_id uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select * into v_project from public.projects where id = p_project_id;
  if not found then
    raise exception 'PROJECT_NOT_FOUND';
  end if;

  select id into v_team_id from public.teams where project_id = p_project_id;
  if found then
    return v_team_id;
  end if;

  begin
    insert into public.teams (project_id, owner_id, name, status, progress)
    values (p_project_id, v_project.creator_id, v_project.name, 'recruiting', 0)
    returning id into v_team_id;
  exception when unique_violation then
    -- Lost a race with another creation → return the winner.
    select id into v_team_id from public.teams where project_id = p_project_id;
    if not found then
      raise exception 'TEAM_SETUP_FAILED';
    end if;
    return v_team_id;
  end;

  insert into public.team_members (team_id, user_id, team_role, project_role)
  values (v_team_id, v_project.creator_id, 'owner', 'Project Lead')
  on conflict (team_id, user_id) do nothing;

  perform public.post_system_message(v_team_id, 'Team workspace created.');
  return v_team_id;
end;
$$;
