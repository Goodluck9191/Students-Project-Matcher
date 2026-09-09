-- 011_profile_extra_fields.sql — persist the remaining setup fields.
--
-- The wizard collects these, but 001 had no columns for them, so they were
-- silently dropped on save. All are plain display data; the role/is_active
-- guards in 008/010 are unaffected (they only constrain role/is_active).

alter table public.profiles
  add column if not exists university text,
  add column if not exists department text,
  add column if not exists graduation_year text,
  add column if not exists previous_experience text,
  add column if not exists available_days jsonb not null default '[]'::jsonb,
  add column if not exists day_times jsonb not null default '[]'::jsonb,
  add column if not exists work_style text,
  add column if not exists skill_levels jsonb not null default '[]'::jsonb;
