-- 001_profiles.sql — user profiles (1:1 with auth.users).
--
-- profiles.id references auth.users.id. New signups get a minimal
-- student row via the handle_new_user() trigger below (safe + minimal:
-- no business logic inside the trigger).

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  avatar_url text,
  academic_program text,
  year integer check (year is null or (year >= 1 and year <= 8)),
  bio text,
  experience_level text check (experience_level is null or experience_level in ('Beginner', 'Intermediate', 'Advanced')),
  skills jsonb not null default '[]'::jsonb,
  interests jsonb not null default '[]'::jsonb,
  availability jsonb not null default '[]'::jsonb,
  role text not null default 'student' check (role in ('student', 'admin')),
  is_active boolean not null default true,
  profile_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Minimal signup hook: auth.users → profiles (student, active).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
