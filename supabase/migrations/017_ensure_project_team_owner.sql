-- 017_ensure_project_team_owner.sql — return the owner alongside the team.
--
-- Fixes join requests failing with a misleading "project no longer exists":
-- after ensuring the workspace, sendJoinRequestAction re-read the teams row
-- with the REQUESTER's credentials, but teams_member_read requires
-- membership — which a requester never has — so the row was always
-- filtered to null. Returning owner_id from the definer function removes
-- the re-read entirely. RLS itself is untouched (not weakened).

drop function if exists public.ensure_project_team(uuid);

create function public.ensure_project_team(p_project_id uuid)
returns table (team_id uuid, owner_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project public.projects%rowtype;
  v_team_id uuid;
  v_owner_id uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select * into v_project from public.projects where id = p_project_id;
  if not found then
    raise exception 'PROJECT_NOT_FOUND';
  end if;

  select id, owner_id into v_team_id, v_owner_id
    from public.teams where project_id = p_project_id;
  if found then
    team_id := v_team_id;
    owner_id := v_owner_id;
    return next;
    return;
  end if;

  begin
    insert into public.teams (project_id, owner_id, name, status, progress)
    values (p_project_id, v_project.creator_id, v_project.name, 'recruiting', 0)
    returning id into v_team_id;
  exception when unique_violation then
    -- Lost a race with another creation → return the winner.
    select id, owner_id into v_team_id, v_owner_id
      from public.teams where project_id = p_project_id;
    if not found then
      raise exception 'TEAM_SETUP_FAILED';
    end if;
    team_id := v_team_id;
    owner_id := v_owner_id;
    return next;
    return;
  end;

  insert into public.team_members (team_id, user_id, team_role, project_role)
  values (v_team_id, v_project.creator_id, 'owner', 'Project Lead')
  on conflict (team_id, user_id) do nothing;

  perform public.post_system_message(v_team_id, 'Team workspace created.');
  team_id := v_team_id;
  owner_id := v_project.creator_id;
  return next;
  return;
end;
$$;
