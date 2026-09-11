-- 016_single_admin.sql — enforce exactly ONE active admin at the database level.
--
-- Platform roles remain student | admin, but there must be exactly one
-- ACTIVE admin account. Enforcement lives here (never in UI code):
--  1. Partial unique index: at most one row with role='admin' AND is_active.
--     Inactive ex-admin rows are permitted (history/audit).
--  2. Guard trigger: blocks any UPDATE that would remove the last active
--     admin (role change away from admin, or deactivation) and any DELETE
--     of the last active admin. Raises ADMIN_CONSTRAINT so callers can map
--     it to a friendly error instead of exposing internals.

create unique index if not exists one_active_admin
  on public.profiles ((role))
  where role = 'admin' and is_active is true;

create or replace function public.prevent_last_admin_loss()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  other_admins integer;
begin
  if TG_OP = 'DELETE' then
    if OLD.role = 'admin' and OLD.is_active is true then
      select count(*) into other_admins from public.profiles
      where role = 'admin' and is_active is true and id <> OLD.id;
      if other_admins = 0 then
        raise exception 'ADMIN_CONSTRAINT: cannot remove the last active admin';
      end if;
    end if;
    return OLD;
  end if;
  if OLD.role = 'admin' and OLD.is_active is true
     and (NEW.role <> 'admin' or NEW.is_active is not true) then
    select count(*) into other_admins from public.profiles
    where role = 'admin' and is_active is true and id <> OLD.id;
    if other_admins = 0 then
      raise exception 'ADMIN_CONSTRAINT: cannot remove the last active admin';
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_guard_last_admin on public.profiles;
create trigger trg_guard_last_admin
  before update or delete on public.profiles
  for each row execute function public.prevent_last_admin_loss();
