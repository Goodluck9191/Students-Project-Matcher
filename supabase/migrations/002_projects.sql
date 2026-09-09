-- 002_projects.sql — academic projects.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) >= 3),
  description text not null default '',
  category text,
  required_team_size integer not null default 5 check (required_team_size >= 2 and required_team_size <= 8),
  required_skills jsonb not null default '[]'::jsonb,
  deadline timestamptz,
  status text not null default 'recruiting'
    check (status in ('draft', 'recruiting', 'in_progress', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.projects.status is
  'App maps: draft (unused in MVP), recruiting→Recruiting, in_progress→In Progress, completed→Completed, archived→Archived.';
