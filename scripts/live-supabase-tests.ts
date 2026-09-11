/**
 * LIVE Supabase verification (Stage 12, Phase 16/66).
 * Run with:  npm run test:live
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL, ANON_KEY and
 * SUPABASE_SERVICE_ROLE_KEY (service key is used ONLY here, in this
 * local script, for provisioning + cleanup — never in app code).
 *
 * Creates 3 throwaway users (auto-confirmed, no emails sent), exercises
 * auth/RLS/RPC/security paths, then deletes everything it created.
 * Safe by design: unique stage12- prefix, full cleanup in finally.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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

function loadEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const file of [".env.local", ".env"]) {
    const p = join(process.cwd(), file);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  return out;
}

const env = loadEnv();
const URL = env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
if (!URL || !ANON) {
  console.log("SKIP — .env.local needs NEXT_PUBLIC_SUPABASE_URL + ANON_KEY");
  process.exit(0);
}

const admin =
  SERVICE.length > 0 ? createClient(URL, SERVICE, { auth: { persistSession: false } }) : null;
const stamp = Date.now().toString(36);
const mkEmail = (who: string) => `stage12-${who}-${stamp}@gmail.com`;
const PASSWORD = `Stage12-${stamp}!xQ`;

interface Ctx {
  id: string;
  email: string;
  client: SupabaseClient;
}
const createdIds: string[] = [];

async function makeUser(who: string): Promise<Ctx> {
  if (!admin) throw new Error("service key required");
  const svc = admin;
  const email = mkEmail(who);
  const { data, error } = await svc.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: `Stage12 ${who}` },
  });
  if (error || !data.user) throw new Error(`provision ${who}: ${error?.message}`);
  createdIds.push(data.user.id);
  const client = createClient(URL, ANON);
  const { error: signErr } = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signErr) throw new Error(`signin ${who}: ${signErr.message}`);
  return { id: data.user.id, email, client };
}

async function cleanup(projectIds: string[]) {
  if (!admin) return;
  for (const pid of projectIds) {
    await admin.from("projects").delete().eq("id", pid);
  }
  for (const uid of createdIds) {
    await admin.auth.admin.deleteUser(uid);
  }
}

const doomedProjects: string[] = [];
if (!SERVICE) {
  // No service key: verify logged-out denial across every table (proves
  // RLS is enabled and closed to anonymous access).
  // NOTE: Postgres RLS denies by filtering rows (empty set, no error),
  // so "denied" here means zero rows visible to anonymous callers.
  const anon = createClient(URL, ANON);
  for (const table of ["profiles", "projects", "teams", "team_members", "team_requests", "notifications", "team_messages"]) {
    const { data } = await anon.from(table).select("id").limit(1);
    check(`Anon — ${table} exposes nothing`, (data ?? []).length === 0);
  }
  const write = await anon.from("projects").insert({ creator_id: "00000000-0000-0000-0000-000000000000", name: "x", description: "x", required_team_size: 2 });
  check("Anon — project write denied", !!write.error, write.error?.message ?? "writable!");
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}
try {
  const A = await makeUser("owner");
  const B = await makeUser("member");
  const C = await makeUser("outsider");
  check("Live — 3 users provisioned + signed in", true);

  // --- single admin: exactly one active admin must exist; a second one
  // must be impossible even with the service key (constraint + trigger).
  // NOTE: this assumes the pre-existing production admin; the count check
  // below fails honestly if the database has zero or two+.
  {
    const svc = admin!;
    const { data: admins } = await svc
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .eq("is_active", true);
    const count = ((admins ?? []) as unknown[]).length;
    check("Single-admin — exactly one active admin exists", count === 1, `found ${count}`);
    const { error: promoteErr } = await svc
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", A.id);
    check(
      "Single-admin — second admin rejected (even via service key)",
      !!promoteErr &&
        (/ADMIN_CONSTRAINT|one_active_admin|duplicate|23505/i.test(promoteErr.message)),
      promoteErr?.message ?? "promotion allowed!"
    );
  }

  // --- profiles: own read/update; role escalation blocked ---
  {
    const { data, error } = await A.client.from("profiles").select("id").eq("id", A.id).single();
    check("RLS — own profile readable", !error && (data as { id: string } | null)?.id === A.id, error?.message);
    const upd = await A.client.from("profiles").update({ full_name: "Stage12 Owner Edited" }).eq("id", A.id);
    check("RLS — own profile updatable", !upd.error, upd.error?.message);
    const esc = await A.client.from("profiles").update({ role: "admin" }).eq("id", A.id);
    check("RLS — self-promote to admin blocked", !!esc.error, esc.error?.message ?? "no error!");
    const other = await A.client.from("profiles").update({ full_name: "Hacked" }).eq("id", B.id);
    check("RLS — cannot edit another profile", !!other.error, other.error?.message ?? "no error!");
  }

  // --- project + team provisioning as A ---
  let projectId = "";
  let teamId = "";
  {
    const { data: p, error } = await A.client
      .from("projects")
      .insert({ creator_id: A.id, name: "Stage12 Live Project", description: "RLS verification project for automated tests.", category: "Web Development", required_team_size: 3, required_skills: ["React"], status: "recruiting" })
      .select("id")
      .single();
    check("Live — project created by owner", !error && !!(p as { id: string } | null)?.id, error?.message);
    projectId = (p as { id: string }).id;
    doomedProjects.push(projectId);
    const { data: t, error: tErr } = await A.client
      .from("teams")
      .insert({ project_id: projectId, owner_id: A.id, name: "Stage12 Live Project", status: "recruiting" })
      .select("id")
      .single();
    check("Live — team created by owner", !tErr, tErr?.message);
    teamId = (t as { id: string }).id;
    const { error: mErr } = await A.client
      .from("team_members")
      .insert({ team_id: teamId, user_id: A.id, team_role: "owner", project_role: "Project Lead" });
    check("Live — owner membership row", !mErr, mErr?.message);
  }

  // --- cross-user isolation as B ---
  {
    const notifs = await B.client.from("notifications").select("id");
    const rows = (notifs.data as { id: string }[] | null) ?? [];
    check("RLS — B sees no foreign notifications", !notifs.error && rows.length === 0, notifs.error?.message);
    const chat = await B.client.from("team_messages").select("id").eq("team_id", teamId);
    check("RLS — non-member chat read denied", !!chat.error, chat.error?.message ?? "readable!");
    const send = await B.client.from("team_messages").insert({ team_id: teamId, sender_id: B.id, content: "intrusion", message_type: "user" });
    check("RLS — non-member chat write denied", !!send.error, send.error?.message ?? "writable!");
    const join = await B.client.from("team_members").insert({ team_id: teamId, user_id: B.id, team_role: "member" });
    check("RLS — non-owner cannot self-add", !!join.error, join.error?.message ?? "writable!");
    const editA = await B.client.from("projects").update({ name: "Hijacked" }).eq("id", projectId);
    const checkName = await A.client.from("projects").select("name").eq("id", projectId).single();
    check("RLS — B cannot edit A's project", (checkName.data as { name: string } | null)?.name !== "Hijacked", editA.error?.message);
  }

  // --- duplicate pending invitation blocked (A invites C twice) ---
  {
    const first = await A.client.from("team_requests").insert({
      project_id: projectId, team_id: teamId, sender_id: A.id, recipient_id: C.id,
      type: "invitation", status: "pending", message: "Join us",
    });
    check("Live — invitation created", !first.error, first.error?.message);
    const second = await A.client.from("team_requests").insert({
      project_id: projectId, team_id: teamId, sender_id: A.id, recipient_id: C.id,
      type: "invitation", status: "pending",
    });
    check("DB — duplicate pending invitation rejected", !!second.error, second.error?.message ?? "allowed!");
  }

  // --- accept RPC: C accepts A's invitation → member, capacity, notifications ---
  {
    const { data: req } = await C.client.from("team_requests").select("id").eq("recipient_id", C.id).eq("status", "pending").single();
    const reqId = (req as { id: string } | null)?.id ?? "";
    const { error } = await C.client.rpc("accept_team_request", { p_request_id: reqId });
    check("RPC — recipient accepts invitation", !error, error?.message);
    const { data: roster } = await A.client.from("team_members").select("user_id").eq("team_id", teamId);
    check("RPC — member added", ((roster ?? []) as { user_id: string }[]).some((m) => m.user_id === C.id));
    const again = await C.client.rpc("accept_team_request", { p_request_id: reqId });
    check("RPC — double accept rejected", !!again.error, again.error?.message ?? "allowed!");
    const senderNotes = await A.client.from("notifications").select("id").eq("user_id", A.id);
    check("RPC — sender notified", ((senderNotes.data ?? []) as unknown[]).length > 0);
    // C (now member) can chat; A sees it
    const spoke = await C.client.from("team_messages").insert({ team_id: teamId, sender_id: C.id, content: "Hello live team", message_type: "user" });
    check("Chat — new member can send", !spoke.error, spoke.error?.message);
    // Duplicate membership blocked at DB level
    const dupe = await A.client.from("team_members").insert({ team_id: teamId, user_id: C.id, team_role: "member" });
    check("DB — duplicate membership rejected", !!dupe.error, dupe.error?.message ?? "allowed!");
    // Stranger's accept attempt on someone else's request
    const strangerReq = await B.client.from("team_requests").insert({
      project_id: projectId, team_id: teamId, sender_id: B.id, recipient_id: A.id,
      type: "join_request", status: "pending",
    }).select("id").single();
    const jrId = (strangerReq.data as { id: string } | null)?.id ?? "";
    const hijack = await C.client.rpc("accept_team_request", { p_request_id: jrId });
    check("RPC — non-recipient accept rejected", !!hijack.error, hijack.error?.message ?? "allowed!");
  }

  // --- admin boundaries (no admin credentials available, so verify the
  // negative: students cannot perform admin-gated operations) ---
  {
    const all = await A.client.from("profiles").select("id");
    check("Profiles — authenticated list readable (by design)", !all.error, all.error?.message);
    const settings = await A.client.from("platform_settings").insert({ key: "x", value: {} });
    check("Admin — student cannot write platform settings", !!settings.error, settings.error?.message ?? "writable!");
    const upd = await C.client.from("team_members").update({ project_role: "QA" }).eq("team_id", teamId).eq("user_id", A.id);
    check("Admin — non-owner/non-admin cannot edit roster", !!upd.error, upd.error?.message ?? "writable!");
    const peek = await C.client.from("team_messages").select("id").eq("team_id", teamId);
    check("Admin — no blanket private-chat read", !!peek.error, peek.error?.message ?? "readable!");
    const othersNotes = await C.client.from("notifications").select("id").eq("user_id", A.id);
    check("Admin — no peeking at user notifications", ((othersNotes.data ?? []) as unknown[]).length === 0, othersNotes.error?.message);
  }

  // --- student admin-API attempt ---
  {
    const steal = await A.client.from("profiles").update({ is_active: false }).eq("id", B.id);
    check("RLS — student cannot deactivate others", !!steal.error, steal.error?.message ?? "allowed!");
  }
} catch (e) {
  console.log("LIVE_ERROR", e instanceof Error ? e.message : String(e));
  failed++;
} finally {
  await cleanup(doomedProjects);
  console.log("CLEANUP_DONE");
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
