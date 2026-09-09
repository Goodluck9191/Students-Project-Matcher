-- 004_team_members.sql — membership with split roles.
--
-- team_role  → authorization (owner | member). ONLY this drives permissions.
-- project_role → responsibility label (Frontend Developer, …). Never auth.

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  team_role text not null default 'member' check (team_role in ('owner', 'member')),
  project_role text,
  joined_at timestamptz not null default now(),
  unique (team_id, user_id)
);
