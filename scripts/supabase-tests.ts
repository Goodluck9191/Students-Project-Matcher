/**
 * Supabase integration tests — run with:  npm run test:supabase
 * (Plain Node via scripts/ts-resolve-loader.mjs; no test framework.)
 *
 * Covers the config gate, row mappers, matching-model preservation,
 * and migration file guarantees (tables, RLS, constraints, RPC).
 * Live-database tests are intentionally out of scope here; they run
 * against a configured project per README/supabase docs.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { isSupabaseConfigured, NOT_CONFIGURED_ERROR } from "../lib/supabase/config";
import { isPublicPath } from "../lib/supabase/session";
import { transferOwnership, leaveTeam } from "../lib/services/teams";
import {
  mapNotification,
  mapProfile,
  mapProfileExtra,
  mapProject,
  mapTeamMessage,
  mapTeamRequest,
  toAppProjectStatus,
  toAppTeamStatus,
  toDbStatus,
} from "../lib/supabase/mappers";
import { MATCH_WEIGHTS } from "../lib/matching/weights";
import { getMatchTier } from "../lib/matching/score";

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failed++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

const ROOT = process.cwd();

// Config gate (no env in test runner → mock mode)
{
  check("Config — unconfigured without env", !isSupabaseConfigured());
  check("Config — helpful error text", NOT_CONFIGURED_ERROR.includes("NEXT_PUBLIC_SUPABASE_URL"));
}

// Status mappings round-trip
{
  check("Status — db→app project", toAppProjectStatus("in_progress") === "In Progress");
  check("Status — db→app archived", toAppProjectStatus("archived") === "Archived");
  check("Status — db→app team", toAppTeamStatus("team_complete") === "Team Complete");
  check("Status — app→db", toDbStatus("Team Complete") === "team_complete" && toDbStatus("In Progress") === "in_progress");
  check("Status — unknown falls back safely", toAppProjectStatus("weird") === "Recruiting");
}

// Row mappers
{
  const profile = mapProfile({
    id: "u1", full_name: "Test User", email: "t@x.edu", avatar_url: null,
    academic_program: "Computer Science", year: 2, bio: "hi",
    experience_level: "Advanced", skills: ["React"], interests: ["AI"],
    availability: ["Evening"], role: "admin", is_active: true,
    profile_completed: true, university: null, department: null,
    graduation_year: null, previous_experience: null, available_days: [],
    day_times: [], work_style: null, skill_levels: [],
    created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  });
  check("Mapper — profile", profile.fullName === "Test User" && profile.role === "admin" && profile.isActive && profile.profileCompletion === 100);

  const project = mapProject(
    { id: "p1", creator_id: "u1", name: "X", description: "d", category: "AI", required_team_size: 4, required_skills: ["Python"], deadline: null, status: "in_progress", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
    "Alex", 2
  );
  check("Mapper — project", project.title === "X" && project.status === "In Progress" && project.maxTeamSize === 4 && project.currentMembers === 2);

  const req = mapTeamRequest({
    id: "r1", project_id: "p1", team_id: "t1", sender_id: "a", recipient_id: "b",
    type: "join_request", status: "bogus", message: null, created_at: "2026-01-01T00:00:00Z", responded_at: null,
  });
  check("Mapper — request type + status fallback", req.type === "join_request" && req.status === "pending");

  const notif = mapNotification({
    id: "n1", user_id: "u1", type: "team_full", title: "T", message: null,
    read: null, created_at: "2026-01-01T00:00:00Z", action_url: "/teams/x", related_id: null,
  });
  check("Mapper — notification", notif.isRead === false && notif.linkHref === "/teams/x" && notif.body === "");

  const msg = mapTeamMessage({
    id: "m1", team_id: "t1", sender_id: null, content: "Joined.", message_type: "system", created_at: "2026-01-01T00:00:00Z",
  });
  check("Mapper — system message", msg.type === "system" && msg.senderId === null);

  const extra = mapProfileExtra({
    id: "u1", full_name: "T", email: null, avatar_url: null, academic_program: null,
    year: null, bio: null, experience_level: null, skills: [], interests: [],
    availability: [], role: "student", is_active: true, profile_completed: false,
    university: "MUST", department: "CSE", graduation_year: "2028",
    previous_experience: "Built X.", available_days: ["Monday"], day_times: ["Evening"],
    work_style: "Hybrid", skill_levels: "not-an-array",
    created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  });
  check("Mapper — extra fields tolerate garbage", extra.skillLevels.length === 0 && extra.university === "MUST");
  const extra2 = mapProfileExtra({
    id: "u1", full_name: "T", email: null, avatar_url: null, academic_program: null,
    year: null, bio: null, experience_level: null, skills: [], interests: [],
    availability: [], role: "student", is_active: true, profile_completed: false,
    university: "MUST", department: "CSE", graduation_year: "2028",
    previous_experience: "Built X.", available_days: ["Monday"], day_times: ["Evening"],
    work_style: "Hybrid",
    skill_levels: [
      { skill: "React", level: "Advanced" },
      { skill: "Nope", level: "Guru" },
      "junk",
    ],
    created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
  });
  check(
    "Mapper — profile extra fields",
    extra2.university === "MUST" &&
      extra2.department === "CSE" &&
      extra2.availableDays.join() === "Monday" &&
      extra2.workStyle === "Hybrid"
  );
  check(
    "Mapper — skill levels validated",
    extra2.skillLevels.length === 1 &&
      extra2.skillLevels[0].skill === "React" &&
      extra2.skillLevels[0].level === "Advanced"
  );
}

// Matching model preserved (§31)
{
  const total = Object.values(MATCH_WEIGHTS).reduce((a, b) => a + b, 0);
  check("Matching — weights sum to 1", Math.abs(total - 1) < 1e-9, `${total}`);
  check(
    "Matching — weights unchanged",
    MATCH_WEIGHTS.skill === 0.4 && MATCH_WEIGHTS.interest === 0.2 &&
    MATCH_WEIGHTS.availability === 0.15 && MATCH_WEIGHTS.program === 0.1 &&
    MATCH_WEIGHTS.experience === 0.1 && MATCH_WEIGHTS.year === 0.05
  );
  check(
    "Matching — tiers unchanged",
    getMatchTier(94) === "excellent" && getMatchTier(80) === "strong" &&
    getMatchTier(65) === "good" && getMatchTier(50) === "moderate" && getMatchTier(10) === "low"
  );
}

// Migration guarantees (static analysis of SQL files)
{
  const dir = join(ROOT, "supabase", "migrations");
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".sql")) : [];
  check("Migrations — 15 files present", files.length === 15, `${files.length}`);
  const all = files.map((f) => readFileSync(join(dir, f), "utf8")).join("\n");
  const tables = ["profiles", "projects", "teams", "team_members", "team_requests", "notifications", "team_messages", "platform_settings"];
  check("Migrations — all tables created", tables.every((t) => all.includes(`create table if not exists public.${t}`)));
  check("Migrations — profiles→auth.users FK", all.includes("references auth.users(id)"));
  check("Migrations — RLS enabled everywhere", tables.every((t) => all.includes(`alter table public.${t} enable row level security`)));
  check("Migrations — membership uniqueness", all.includes("unique (team_id, user_id)"));
  check("Migrations — pending-invite partial indexes", all.includes("where type = 'invitation' and status = 'pending'"));
  check("Migrations — no-drop rules", !all.includes("drop table"));
  check("Migrations — atomic accept RPC", all.includes("create or replace function public.accept_team_request"));
  check("Migrations — notify + system RPCs", all.includes("public.notify_user") && all.includes("public.post_system_message"));
  check("Migrations — member-only chat read", all.includes("messages_member_read"));
  check("Migrations — no admin blanket chat read", !all.includes("team_messages") || !/create policy \w+ on public\.team_messages[\s\S]{0,200}is_admin\(\)/.test(all));
  check("Migrations — role check constraint", all.includes("check (role in ('student', 'admin'))"));
  check("Migrations — self-insert policy", all.includes("profiles_self_insert") && all.includes("id = auth.uid()"));
  check(
    "Migrations — role/is_active immutable to self",
    all.includes("profiles_self_update") && all.includes("and role = (select role from public.profiles where id = auth.uid())")
  );
  check("Migrations — self-invite check", all.includes("sender_id <> recipient_id"));
  check("Migrations — extra profile columns", ["university", "available_days", "day_times", "work_style", "skill_levels"].every((c) => all.includes(c)));
  check(
    "Migrations — avatars bucket locked to own folder",
    all.includes("create policy avatars_own_insert") && all.includes("(storage.foldername(name))[1] = auth.uid()::text")
  );
  check("Migrations — owner member-update policy", all.includes("members_owner_update"));
  check("Migrations — one team per project", all.includes("teams_project_unique"));
  check("Migrations — ensure team RPC", all.includes("create or replace function public.ensure_project_team"));
  check(
    "Proxy — public vs protected paths",
    isPublicPath("/") &&
      isPublicPath("/login") &&
      isPublicPath("/auth/confirm") &&
      !isPublicPath("/dashboard") &&
      !isPublicPath("/admin/users") &&
      !isPublicPath("/teams/team-asset/chat")
  );

  // Ownership transfer (mock store): owner → member → old owner can leave.
  const transfer = await transferOwnership("team-asset", "john-michael", "me");
  check("Transfer — owner hands over", transfer.ok && transfer.team.ownerId === "john-michael");
  const nonOwner = await transferOwnership("team-asset", "priya-nair", "priya-nair");
  check("Transfer — non-owner blocked", !nonOwner.ok && nonOwner.error === "NOT_OWNER");
  const stranger = await transferOwnership("team-asset", "david-kim", "john-michael");
  check("Transfer — non-member target blocked", !stranger.ok && stranger.error === "MEMBER_NOT_FOUND");
  const restored = await transferOwnership("team-asset", "me", "john-michael");
  check("Transfer — ownership restored", restored.ok && restored.team.ownerId === "me");
  const handBack = await transferOwnership("team-asset", "john-michael", "me");
  const departed = await leaveTeam("team-asset", "me");
  check("Transfer — old owner can now leave", handBack.ok && departed.ok);

  // saveProfileAction must never write role/is_active (static whitelist check).
  const actionSrc = readFileSync(join(ROOT, "lib", "actions", "profile.ts"), "utf8");
  const payload = actionSrc.slice(actionSrc.indexOf(".upsert("));
  check("Action — id is session-derived", payload.includes("id: check.profile.id"));
  check("Action — no role/is_active write", !/^\s*(role|is_active)\s*:/m.test(payload));
  check("Action — blob avatar URLs rejected", actionSrc.includes("startsWith(\"https://\")"));

  const serviceSrc = readFileSync(join(ROOT, "lib", "services", "profile.ts"), "utf8");
  check("Service — loads by session user id", serviceSrc.includes("supabase.auth.getUser()") && serviceSrc.includes(".eq(\"id\", user.id)"));

  // Realtime regression: supabase-js reuses cached channels by topic, and
  // .on() after subscribe() throws on remount — every subscribe helper
  // must use a unique channel name per call.
  for (const [file, topic] of [
    ["lib/services/notifications.ts", "notifications:"],
    ["lib/services/requests.ts", "requests:"],
    ["lib/services/chat.ts", "team-chat:"],
  ] as const) {
    const src = readFileSync(join(ROOT, ...file.split("/")), "utf8");
    check(
      `Realtime — unique channel per subscribe (${topic})`,
      src.includes(`.channel(\`${topic}\${`) && /\+\+\w*[Ss]eq/.test(src)
    );
  }

  const seed = existsSync(join(ROOT, "supabase", "seed.sql"))
    ? readFileSync(join(ROOT, "supabase", "seed.sql"), "utf8")
    : "";
  check("Seed — demo accounts documented", seed.includes("admin@projectmatcher.edu"));
  check("Seed — no real secrets", !/sk-|service_role/i.test(seed));

  const envExample = readFileSync(join(ROOT, ".env.example"), "utf8");
  check("Env — placeholders only", envExample.includes("NEXT_PUBLIC_SUPABASE_URL=") && !/https?:\/\//.test(envExample));
  check("Env — service key server-only", envExample.includes("SUPABASE_SERVICE_ROLE_KEY=") && !envExample.includes("NEXT_PUBLIC_SUPABASE_SERVICE"));
  const gitignore = readFileSync(join(ROOT, ".gitignore"), "utf8");
  check("Env — .env.local ignored, example kept", gitignore.includes(".env*") && gitignore.includes("!.env.example"));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
