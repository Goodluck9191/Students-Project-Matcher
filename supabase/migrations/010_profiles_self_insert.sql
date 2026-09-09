-- 010_profiles_self_insert.sql — let users create their own profile row.
--
-- The handle_new_user() trigger normally creates the row at signup, but if
-- it ever misses (bulk imports, older accounts, trigger errors), the app's
-- profile-setup upsert must be able to insert the caller's OWN row.
-- Update/delete remain locked down by 008 (role/is_active immutable).

drop policy if exists profiles_self_insert on public.profiles;
create policy profiles_self_insert on public.profiles
  for insert to authenticated with check (id = auth.uid());
