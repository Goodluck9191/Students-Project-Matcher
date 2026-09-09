# Supabase setup (Stage 11)

Mock mode is the default: without env vars the app runs on local/mock state.
To use the real backend:

## 1. Create a Supabase project
1. Go to https://supabase.com → New project (no local Postgres needed).
2. Wait for provisioning.

## 2. Configure environment
3. Project Settings → API: copy the **Project URL** and **anon public** key.
4. Copy `.env.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` — ONLY for one-off admin provisioning scripts; never in app code, never committed.
5. Restart `npm run dev`.

## 3. Apply migrations
Using SQL editor (in order) or CLI:
- `supabase/migrations/001_profiles.sql` … `012_avatars_storage.sql`
  (tables → indexes/RLS → RPCs → self-insert → extra profile columns → avatars bucket).
- CLI alternative: `npx supabase db push` (requires `supabase/` linked project).

## 4. Seed development data
- Run `supabase/seed.sql` in the SQL editor.
- Demo logins (password `Password123!`): `admin@`, `alex@`, `sarah@`, `john@`, `grace@projectmatcher.edu`.
- Never use these credentials outside local/dev databases.

## 5. Make an admin
Register normally (role defaults to `student`), then in the SQL editor:
```sql
update public.profiles set role = 'admin' where email = 'you@university.edu';
```
Never grant admin from client code. The old `?preview=admin` demo switch is disabled whenever Supabase is configured.

## 6. Verify
- `/register` → profile setup → `/dashboard` persists across reloads.
- `/login` as admin → `/admin` works; as student → Access Denied.
- RLS spot-checks: user A cannot read user B's notifications or another team's chat (see README “Production security”).

## Realtime
Chat subscribes to `team_messages` filtered by `team_id` when configured.
Enable Realtime for the `team_messages` table: Database → Replication → toggle `team_messages`.
