# Project Matcher

Smart project team matching for university students — find teammates by skills,
interests, availability, program, year, and experience. **Matching, not dating.**

## Stack

- Next.js 16 (App Router, `proxy.ts` session sync) + TypeScript (strict) + React 19
- Tailwind CSS 4 + Lucide React icons
- Supabase: Auth + PostgreSQL + RLS + Realtime (optional; mock mode is default)

## Quickstart (mock mode — no backend needed)

```bash
npm install
npm run dev     # http://localhost:3000
```

```bash
npx tsc --noEmit        # type check
npm run build           # production build
npm run lint            # eslint
npm run test:matching   # matching engine tests
npm run test:teams      # team service tests
npm run test:requests   # request/notification tests
npm run test:chat       # chat service tests
npm run test:admin      # admin service tests
npm run test:supabase   # config/mappers/migration-guarantee tests
```

## Supabase backend (Stage 11)

The app runs fully in **mock mode** without env vars. To use the real backend:

1. Create a Supabase project (no local Postgres needed).
2. Copy `.env.example` → `.env.local`; set `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (`SUPABASE_SERVICE_ROLE_KEY` only for
   one-off server-side admin provisioning — never in app code, never committed).
3. Apply `supabase/migrations/*.sql` in order, then `supabase/seed.sql`
   (see `supabase/README.md` for the full checklist + demo logins).
4. Restart `npm run dev`. Register → profile setup → dashboard persists in Postgres.
5. Make an admin via SQL (`update profiles set role='admin' …`) — never from client code.

### Development vs production

| Concern | Development (mock / local Supabase) | Production |
|---|---|---|
| Auth | mock forms / local Supabase Auth | hosted Supabase Auth |
| Roles | localStorage demo switch (`?preview=admin`, mock mode only) | DB `profiles.role` + server checks + RLS |
| Data | `lib/mock/*` + localStorage session stores | PostgreSQL via services |
| Chat live updates | local state | Realtime on `team_messages` (enable replication) |
| Secrets | `.env.local` (git-ignored) | hosting provider env vars |

### Production security notes

- Authorization is enforced **server-side** (`lib/supabase/auth.ts`: `requireUser`/`requireAdmin`) **and** by **RLS** — frontend role state is display-only.
- The anon key is public by design; RLS policies are the real boundary (members-only teams/chat/requests/notifications; owners manage; admins manage platform rows but never private chats/notifications).
- Multi-write flows (invitation accept) run in the atomic `accept_team_request()` RPC.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser; never commit `.env.local`; never log tokens/passwords.

## Folder structure (Stage 11 additions)

```text
supabase/
  migrations/001_profiles … 009_server_functions.sql
  seed.sql · README.md
proxy.ts                # Next 16 session sync (replaces deprecated middleware)
app/auth/confirm/       # PKCE/magic-link code exchange route
app/(auth)/reset-password/  # set-new-password page

lib/
  supabase/             # config (mode gate), client, server, session(proxy),
                        # auth (server requireUser/requireAdmin), mappers (rows→types)
  actions/              # auth, profile, projects, teams, requests,
                        # notifications, chat, admin — validated Server Actions
  services/             # dual-mode: Supabase (RLS reads, actions for writes)
                        # or mock fallback; UI imports here in both modes
  matching/             # UNCHANGED engine (Stage 6 weights/tiers intact)

Architecture:
  Browser → App Router → Server Actions/Route Handlers → Services → Supabase
  → PostgreSQL (+RLS) → Realtime (chat)
```

## Supabase-ready contract (unchanged)

1. UI components import data from `lib/services/*`, **never** query Supabase directly.
2. Browser code uses the **anon key only**; RLS enforces access.
3. Matching/business logic lives in `lib/matching/*`, not in components.
4. Mutations requiring authorization go through `lib/actions/*` (server).
5. `senderId`/`ownerId`/`role` are always re-derived server-side, never trusted from the client.
