-- seed.sql — development seed (DEMO data only, no real people/passwords).
--
-- Usage (local Supabase CLI or hosted SQL editor):
--   1. Apply supabase/migrations/*.sql first.
--   2. Run this file.
--   3. Log in with the demo accounts below (password: Password123!).
--
-- Demo accounts (all @projectmatcher.edu):
--   admin@projectmatcher.edu ............ admin
--   alex@projectmatcher.edu ............. student (project owner)
--   sarah@projectmatcher.edu ............ student
--   john@projectmatcher.edu ............. student
--   grace@projectmatcher.edu ............ student
--
-- NOTE: auth.users rows are created here with pgcrypto-hashed passwords.
-- On hosted Supabase this works from the SQL editor. Never commit real
-- credentials; rotate these demo passwords if the database is ever exposed.

-- pgcrypto for password hashing (available on Supabase).
create extension if not exists "pgcrypto";

-- Fixed demo UUIDs so FK references stay readable.
-- auth.users (minimal valid columns for Supabase Auth).
insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values
  ('11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'admin@projectmatcher.edu', crypt('Password123!', gen_salt('bf')), now(), '{"full_name":"Neema Admin"}', now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'alex@projectmatcher.edu', crypt('Password123!', gen_salt('bf')), now(), '{"full_name":"Alex Morgan"}', now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'sarah@projectmatcher.edu', crypt('Password123!', gen_salt('bf')), now(), '{"full_name":"Sarah Michael"}', now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'authenticated', 'authenticated', 'john@projectmatcher.edu', crypt('Password123!', gen_salt('bf')), now(), '{"full_name":"John Michael"}', now(), now()),
  ('55555555-5555-5555-5555-555555555555', 'authenticated', 'authenticated', 'grace@projectmatcher.edu', crypt('Password123!', gen_salt('bf')), now(), '{"full_name":"Grace Lee"}', now(), now())
on conflict (id) do nothing;

-- profiles (trigger also creates bare rows; upsert full demo data).
insert into public.profiles (id, full_name, email, academic_program, year, bio, experience_level, skills, interests, availability, role, is_active, profile_completed)
values
  ('11111111-1111-1111-1111-111111111111', 'Neema Admin', 'admin@projectmatcher.edu', 'Information Technology', 4, 'Platform administrator.', 'Advanced', '[]', '[]', '[]', 'admin', true, true),
  ('22222222-2222-2222-2222-222222222222', 'Alex Morgan', 'alex@projectmatcher.edu', 'Computer Science', 2, 'Second-year CS student into web dev and AI.', 'Intermediate', '["React","TypeScript","Python"]', '["Web Development","AI"]', '["Evening","Weekends"]', 'student', true, true),
  ('33333333-3333-3333-3333-333333333333', 'Sarah Michael', 'sarah@projectmatcher.edu', 'Computer Engineering', 2, 'Frontend-leaning engineer.', 'Intermediate', '["UI/UX","Figma","React"]', '["Web Development","UI/UX"]', '["Evening","Weekends"]', 'student', true, true),
  ('44444444-4444-4444-4444-444444444444', 'John Michael', 'john@projectmatcher.edu', 'Information Technology', 3, 'Backend developer.', 'Advanced', '["Node.js","PostgreSQL"]', '["Web Development"]', '["Afternoon","Weekdays"]', 'student', true, true),
  ('55555555-5555-5555-5555-555555555555', 'Grace Lee', 'grace@projectmatcher.edu', 'Computer Science', 1, 'First-year, keen on testing.', 'Beginner', '["Testing","Documentation"]', '["Web Development"]', '["Morning","Weekends"]', 'student', true, false)
on conflict (id) do update set
  full_name = excluded.full_name, email = excluded.email,
  academic_program = excluded.academic_program, year = excluded.year,
  bio = excluded.bio, experience_level = excluded.experience_level,
  skills = excluded.skills, interests = excluded.interests,
  availability = excluded.availability, role = excluded.role,
  is_active = excluded.is_active, profile_completed = excluded.profile_completed,
  updated_at = now();

-- projects
insert into public.projects (id, creator_id, name, description, category, required_team_size, required_skills, status, deadline)
values
  ('a1a1a1a1-1111-4111-8111-111111111111', '22222222-2222-2222-2222-222222222222', 'University Asset Management System', 'Track lab equipment, rooms, and maintenance requests.', 'Web Development', 5, '["React","Node.js","PostgreSQL","UI/UX"]', 'recruiting', now() + interval '42 days'),
  ('b2b2b2b2-2222-4222-8222-222222222222', '44444444-4444-4444-4444-444444444444', 'Campus Event Hub', 'Discover and RSVP to campus events.', 'Mobile Apps', 5, '["React","Node.js","Testing"]', 'recruiting', now() + interval '30 days')
on conflict (id) do nothing;

-- teams (+ owner membership)
insert into public.teams (id, project_id, owner_id, name, status, progress)
values
  ('c3c3c3c3-3333-4333-8333-333333333333', 'a1a1a1a1-1111-4111-8111-111111111111', '22222222-2222-2222-2222-222222222222', 'University Asset Management System', 'recruiting', 45)
on conflict (id) do nothing;

insert into public.team_members (team_id, user_id, team_role, project_role)
values
  ('c3c3c3c3-3333-4333-8333-333333333333', '22222222-2222-2222-2222-222222222222', 'owner', 'Project Lead'),
  ('c3c3c3c3-3333-4333-8333-333333333333', '44444444-4444-4444-4444-444444444444', 'member', 'Backend Developer')
on conflict (team_id, user_id) do nothing;

-- team request (pending invitation: alex → sarah)
insert into public.team_requests (project_id, team_id, sender_id, recipient_id, type, status, message)
values
  ('a1a1a1a1-1111-4111-8111-111111111111', 'c3c3c3c3-3333-4333-8333-333333333333', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'invitation', 'pending', 'Your UI/UX skills would fill our biggest gap.')
on conflict do nothing;

-- notifications
insert into public.notifications (user_id, type, title, message, action_url)
values
  ('33333333-3333-3333-3333-333333333333', 'team_invitation', 'New team invitation', 'Alex Morgan invited you to join University Asset Management System.', '/requests'),
  ('22222222-2222-2222-2222-222222222222', 'team_member_joined', 'New team member', 'John Michael joined University Asset Management System.', '/teams/c3c3c3c3-3333-4333-8333-333333333333');

-- team messages
insert into public.team_messages (team_id, sender_id, content, message_type)
values
  ('c3c3c3c3-3333-4333-8333-333333333333', '44444444-4444-4444-4444-444444444444', 'Hey everyone, should we meet tomorrow at 3 PM?', 'user'),
  ('c3c3c3c3-3333-4333-8333-333333333333', '22222222-2222-2222-2222-222222222222', '3 PM works — library, second floor.', 'user'),
  ('c3c3c3c3-3333-4333-8333-333333333333', null, 'John Michael joined the team.', 'system');
