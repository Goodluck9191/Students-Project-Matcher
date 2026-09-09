-- 003_teams.sql — project teams.

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null default '',
  status text not null default 'recruiting'
    check (status in ('recruiting', 'team_complete', 'in_progress', 'completed')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.teams.status is
  'App maps: recruiting→Recruiting, team_complete→Team Complete, in_progress→In Progress, completed→Completed.';
