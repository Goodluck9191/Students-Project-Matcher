-- 008_indexes_rls.sql — updated_at automation, indexes, Row Level Security.
--
-- Model: authenticated users + team membership + ownership + admin role.
-- Admins purposefully do NOT get blanket read over private team chat
-- or other users' notifications (see team_messages / notifications below).

-- Reusable updated_at bump.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_projects_updated on public.projects;
create trigger trg_projects_updated
  before update on public.projects
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_teams_updated on public.teams;
create trigger trg_teams_updated
  before update on public.teams
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_team_messages_updated on public.team_messages;
create trigger trg_team_messages_updated
  before update on public.team_messages
  for each row execute function public.touch_updated_at();

-- Membership / role helpers (security definer, fixed search_path).
create or replace function public.is_team_member(p_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.team_members
    where team_id = p_team_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_team_owner(p_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.teams
    where id = p_team_id and owner_id = auth.uid()
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active
  );
$$;

-- Indexes for common queries.
create index if not exists idx_profiles_role on public.profiles (role);
create index if not exists idx_profiles_program on public.profiles (academic_program);
create index if not exists idx_projects_creator on public.projects (creator_id);
create index if not exists idx_projects_status on public.projects (status);
create index if not exists idx_teams_project on public.teams (project_id);
create index if not exists idx_teams_owner on public.teams (owner_id);
create index if not exists idx_teams_status on public.teams (status);
create index if not exists idx_team_members_team on public.team_members (team_id);
create index if not exists idx_team_members_user on public.team_members (user_id);
create index if not exists idx_team_requests_recipient on public.team_requests (recipient_id);
create index if not exists idx_team_requests_sender on public.team_requests (sender_id);
create index if not exists idx_team_requests_team on public.team_requests (team_id);
create index if not exists idx_team_requests_status on public.team_requests (status);
create index if not exists idx_notifications_user on public.notifications (user_id);
create index if not exists idx_notifications_read on public.notifications (user_id, read);
create index if not exists idx_team_messages_team on public.team_messages (team_id);
create index if not exists idx_team_messages_created on public.team_messages (team_id, created_at);

-- ─── RLS ───
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_requests enable row level security;
alter table public.notifications enable row level security;
alter table public.team_messages enable row level security;

-- profiles: readable by authenticated users; self-edit except role/is_active; admin manage.
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from public.profiles where id = auth.uid())
    and is_active = (select is_active from public.profiles where id = auth.uid())
  );

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- projects: readable by authenticated; creators manage own; admin manage.
drop policy if exists projects_read on public.projects;
create policy projects_read on public.projects
  for select to authenticated using (true);

drop policy if exists projects_creator_insert on public.projects;
create policy projects_creator_insert on public.projects
  for insert to authenticated with check (creator_id = auth.uid());

drop policy if exists projects_creator_modify on public.projects;
create policy projects_creator_modify on public.projects
  for update to authenticated
  using (creator_id = auth.uid()) with check (creator_id = auth.uid());

drop policy if exists projects_creator_delete on public.projects;
create policy projects_creator_delete on public.projects
  for delete to authenticated using (creator_id = auth.uid());

drop policy if exists projects_admin_all on public.projects;
create policy projects_admin_all on public.projects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- teams: members read; owner manages; admin manages.
drop policy if exists teams_member_read on public.teams;
create policy teams_member_read on public.teams
  for select to authenticated using (public.is_team_member(id));

drop policy if exists teams_owner_modify on public.teams;
create policy teams_owner_modify on public.teams
  for update to authenticated
  using (public.is_team_owner(id)) with check (public.is_team_owner(id));

drop policy if exists teams_admin_all on public.teams;
create policy teams_admin_all on public.teams
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- team creation happens through the app's server action (owner + project
-- creator verified there); allow owners-to-be to insert their own row.
drop policy if exists teams_creator_insert on public.teams;
create policy teams_creator_insert on public.teams
  for insert to authenticated with check (owner_id = auth.uid());

-- team_members: members read roster; owner adds/removes; self can leave.
drop policy if exists members_roster_read on public.team_members;
create policy members_roster_read on public.team_members
  for select to authenticated using (public.is_team_member(team_id));

drop policy if exists members_owner_add on public.team_members;
create policy members_owner_add on public.team_members
  for insert to authenticated with check (public.is_team_owner(team_id));

drop policy if exists members_owner_remove on public.team_members;
create policy members_owner_remove on public.team_members
  for delete to authenticated using (
    public.is_team_owner(team_id) or user_id = auth.uid()
  );

drop policy if exists members_admin_all on public.team_members;
create policy members_admin_all on public.team_members
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- team_requests: participants read; sender creates/cancels; recipient decides.
drop policy if exists requests_participant_read on public.team_requests;
create policy requests_participant_read on public.team_requests
  for select to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid() or public.is_admin());

drop policy if exists requests_sender_create on public.team_requests;
create policy requests_sender_create on public.team_requests
  for insert to authenticated with check (sender_id = auth.uid());

drop policy if exists requests_participant_update on public.team_requests;
create policy requests_participant_update on public.team_requests
  for update to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid())
  with check (sender_id = auth.uid() or recipient_id = auth.uid());

-- notifications: strictly own rows (admins included — no peeking).
drop policy if exists notifications_own_all on public.notifications;
create policy notifications_own_all on public.notifications
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- team_messages: members read; members insert OWN user messages;
-- own-message edit/delete; NO admin blanket read.
drop policy if exists messages_member_read on public.team_messages;
create policy messages_member_read on public.team_messages
  for select to authenticated using (public.is_team_member(team_id));

drop policy if exists messages_member_send on public.team_messages;
create policy messages_member_send on public.team_messages
  for insert to authenticated
  with check (
    public.is_team_member(team_id)
    and message_type = 'user'
    and sender_id = auth.uid()
  );

drop policy if exists messages_own_edit on public.team_messages;
create policy messages_own_edit on public.team_messages
  for update to authenticated
  using (sender_id = auth.uid() and message_type = 'user')
  with check (sender_id = auth.uid() and message_type = 'user');

drop policy if exists messages_own_delete on public.team_messages;
create policy messages_own_delete on public.team_messages
  for delete to authenticated
  using (sender_id = auth.uid() and message_type = 'user');

-- platform_settings: readable authenticated; writable by admins only.
create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_platform_settings_updated on public.platform_settings;
create trigger trg_platform_settings_updated
  before update on public.platform_settings
  for each row execute function public.touch_updated_at();

alter table public.platform_settings enable row level security;

drop policy if exists settings_read on public.platform_settings;
create policy settings_read on public.platform_settings
  for select to authenticated using (true);

drop policy if exists settings_admin_write on public.platform_settings;
create policy settings_admin_write on public.platform_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
