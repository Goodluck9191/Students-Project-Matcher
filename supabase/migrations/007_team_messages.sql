-- 007_team_messages.sql — team-only chat.
--
-- sender_id NULL + message_type 'system' = team event line.
-- Ordinary users may only insert their OWN user messages (see RLS).

create table if not exists public.team_messages (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  content text not null check (char_length(content) >= 1 and char_length(content) <= 1000),
  message_type text not null default 'user' check (message_type in ('user', 'system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (message_type = 'system' and sender_id is null) or
    (message_type = 'user' and sender_id is not null)
  )
);
