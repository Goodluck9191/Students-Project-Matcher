-- 006_notifications.sql — per-user event inbox.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in (
    'team_invitation', 'invitation_accepted', 'invitation_rejected',
    'team_member_joined', 'team_full', 'team_status_changed', 'system'
  )),
  title text not null,
  message text not null default '',
  read boolean not null default false,
  created_at timestamptz not null default now(),
  action_url text,
  related_id uuid
);
