-- 014_teams_one_per_project.sql — a project has at most one team.
--
-- The app creates a team's workspace on demand (first invite), so the
-- database must guarantee no duplicates under races. Existing seed data
-- already satisfies this (one team per project).

alter table public.teams
  add constraint teams_project_unique unique (project_id);
