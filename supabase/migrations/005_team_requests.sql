-- 005_team_requests.sql — invitations + join requests.

create table if not exists public.team_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('invitation', 'join_request')),
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  message text,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check (sender_id <> recipient_id)
);

-- One live invitation per (team, recipient); one live join request per
-- (team, sender). History (accepted/rejected/cancelled) stays untouched.
create unique index if not exists team_requests_one_pending_invitation
  on public.team_requests (team_id, recipient_id)
  where type = 'invitation' and status = 'pending';

create unique index if not exists team_requests_one_pending_join
  on public.team_requests (team_id, sender_id)
  where type = 'join_request' and status = 'pending';
