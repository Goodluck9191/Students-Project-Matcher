# Project Matcher

Smart project team matching for university students — find teammates by skills,
interests, availability, program, year, and experience. **Matching, not dating.**

## Stack

- Next.js 16 (App Router) + TypeScript (strict) + React 19
- Tailwind CSS 4 + Lucide React icons
- Supabase-ready architecture (auth + Postgres land later; see below)

## Quickstart

```bash
npm install
npm run dev     # http://localhost:3000
```

```bash
npx tsc --noEmit   # type check
npm run build      # production build
npm run lint       # eslint
```

Copy `.env.example` to `.env.local` when Supabase integration begins. The app
runs fully in **mock mode** without env vars set.

## Folder structure

```text
app/
  layout.tsx          # root layout (font, metadata, ToastProvider)
  page.tsx            # Stage 1 foundation preview (marketing landing → Stage 2)
  globals.css         # Tailwind 4 theme tokens, base styles, utilities
  (app)/              # authenticated app routes sharing AppShell
    layout.tsx
    dashboard/ matches/ projects/ teams/ ...

components/
  ui/                 # Button, Input, Card, Badge, Avatar, Modal, Dropdown,
                      # Tabs, SearchInput, Filters, Progress, Skeleton,
                      # States (Empty/Error), PageHeader, Toast
  layout/             # AppShell, Sidebar, Navbar, MobileNav (+BottomNav),
                      # Logo, PublicHeader, PublicFooter
  projects/ matching/ teams/ profile/   # domain components (Stages 4+)

lib/
  mock/               # students, projects, teams, requests, notifications
  services/           # swap point: mock → Supabase queries (UI imports here)
  supabase/           # client.ts (browser) + server.ts (RSC/handlers), anon key only
  matching/           # pure match-score helpers, separate from UI
  navigation.ts       # student + admin nav definitions
  utils.ts            # cn(), getInitials(), formatDate(), timeAgo(), clamp()

types/                # domain types mirroring the future Postgres schema
```

## Supabase-ready contract

1. UI components import data from `lib/services/*`, **never** query Supabase directly.
2. `lib/mock/*` implements the same `types/*` shapes the Supabase queries will return.
3. Browser code uses the **anon key only** (`lib/supabase/client.ts`); RLS enforces
   access later. Service-role keys must never enter the frontend.
4. Matching/business logic lives in `lib/matching/*`, not in components.

## Build stages

- [x] Stage 1 — setup, theme, layout shell, design system, mock/service skeleton
- [ ] Stage 2 — landing page + auth UI
- [ ] Stage 3 — student profile setup
- [ ] Stage 4 — dashboard
- [ ] Stage 5 — projects + creation
- [ ] Stage 6 — matching / recommendations
- [ ] Stage 7 — teams
- [ ] Stage 8 — requests + notifications
- [ ] Stage 9 — admin dashboard
- [ ] Stage 10 — responsive / mobile polish
