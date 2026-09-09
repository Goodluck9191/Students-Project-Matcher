-- 009_server_functions.sql — SECURITY DEFINER helpers for multi-write flows.
--
-- RLS cannot express "recipient accepts → becomes member + notifies sender"
-- in one round trip, so these minimal, strictly-validated functions run
-- the writes atomically. All other logic stays in services/actions.

-- Notify another user (type/title/body validated; no arbitrary table access).
create or replace function public.notify_user(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_action_url text default null,
  p_related_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if p_type not in ('team_invitation', 'invitation_accepted', 'invitation_rejected',
                    'team_member_joined', 'team_full', 'team_status_changed', 'system') then
    raise exception 'INVALID_TYPE';
  end if;
  if char_length(p_title) < 1 or char_length(p_title) > 200 then
    raise exception 'INVALID_TITLE';
  end if;
  if char_length(coalesce(p_body, '')) > 1000 then
    raise exception 'INVALID_BODY';
  end if;
  insert into public.notifications (user_id, type, title, message, action_url, related_id)
  values (p_user_id, p_type, left(p_title, 200), left(coalesce(p_body, ''), 1000), p_action_url, p_related_id)
  returning id into v_id;
  return v_id;
end;
$$;

-- Post a team-event system message (members only; sender stays NULL).
create or replace function public.post_system_message(p_team_id uuid, p_content text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if not exists (
    select 1 from public.team_members where team_id = p_team_id and user_id = auth.uid()
  ) and not public.is_admin() then
    raise exception 'NOT_A_MEMBER';
  end if;
  if char_length(p_content) < 1 or char_length(p_content) > 500 then
    raise exception 'INVALID_CONTENT';
  end if;
  insert into public.team_messages (team_id, sender_id, content, message_type)
  values (p_team_id, null, p_content, 'system')
  returning id into v_id;
  return v_id;
end;
$$;

-- Atomic invitation/join acceptance. Invitation → recipient joins;
-- join request → sender joins (approved by the owner/recipient).
create or replace function public.accept_team_request(p_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.team_requests%rowtype;
  v_joiner uuid;
  v_member_count integer;
  v_capacity integer;
  v_project_name text;
  v_joiner_name text;
  v_team_status text;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select * into v_req from public.team_requests where id = p_request_id;
  if not found then
    raise exception 'REQUEST_NOT_FOUND';
  end if;
  if v_req.status <> 'pending' then
    raise exception 'NOT_PENDING';
  end if;
  if v_req.recipient_id <> auth.uid() then
    raise exception 'NOT_RECIPIENT';
  end if;

  if v_req.type = 'invitation' then
    v_joiner := v_req.recipient_id;
  else
    v_joiner := v_req.sender_id;
  end if;

  if exists (
    select 1 from public.team_members where team_id = v_req.team_id and user_id = v_joiner
  ) then
    raise exception 'ALREADY_MEMBER';
  end if;

  select count(*) into v_member_count from public.team_members where team_id = v_req.team_id;
  select required_team_size into v_capacity from public.projects where id = v_req.project_id;
  if v_member_count >= coalesce(v_capacity, 8) then
    raise exception 'TEAM_FULL';
  end if;

  insert into public.team_members (team_id, user_id, team_role, project_role)
  values (v_req.team_id, v_joiner, 'member', 'Member');

  update public.team_requests
  set status = 'accepted', responded_at = now()
  where id = p_request_id;

  select name into v_project_name from public.projects where id = v_req.project_id;
  select full_name into v_joiner_name from public.profiles where id = v_joiner;

  -- Flip to full when the last seat fills.
  if v_member_count + 1 >= coalesce(v_capacity, 8) then
    update public.teams set status = 'team_complete' where id = v_req.team_id;
    v_team_status := 'team_complete';
  else
    select status into v_team_status from public.teams where id = v_req.team_id;
  end if;

  -- Notify the other party + welcome the joiner.
  if v_req.type = 'invitation' then
    perform public.notify_user(
      v_req.sender_id, 'invitation_accepted',
      'Invitation accepted',
      coalesce(v_joiner_name, 'A student') || ' joined ' || coalesce(v_project_name, 'your project') || '.',
      '/teams/' || v_req.team_id::text, v_req.team_id
    );
  else
    perform public.notify_user(
      v_req.sender_id, 'invitation_accepted',
      'Join request approved',
      'Welcome to ' || coalesce(v_project_name, 'the team') || '!',
      '/teams/' || v_req.team_id::text, v_req.team_id
    );
  end if;

  if v_team_status = 'team_complete' then
    perform public.notify_user(
      (select owner_id from public.teams where id = v_req.team_id),
      'team_full', 'Team complete',
      coalesce(v_project_name, 'Your team') || ' has reached its maximum number of members.',
      '/teams/' || v_req.team_id::text, v_req.team_id
    );
  end if;

  return v_req.team_id;
end;
$$;
