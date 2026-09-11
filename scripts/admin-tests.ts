/**
 * Admin tests — run with:  npm run test:admin
 * (Plain Node via scripts/ts-resolve-loader.mjs; no test framework.)
 *
 * Verifies role gating, stat consistency with mock state, search/filter
 * helpers, admin mutations, and report rendering inputs.
 */
import { canAccessAdmin } from "../lib/services/session";
import {
  adminArchiveProject,
  adminDeleteProject,
  adminDisbandTeam,
  adminSetProjectStatus,
  adminSetTeamStatus,
  adminSetUserStatus,
  filterAdminUsers,
  getAdminStats,
  getAdminUsers,
  getMatchingTierCutoffs,
  getProgramStats,
  getProjectStatusStats,
  getRecentActivity,
  getReports,
  getTeamStatusStats,
  getWeekdayActivity,
} from "../lib/services/admin";
import { mockStudents } from "../lib/mock/students";
import { mockProjects } from "../lib/mock/projects";
import { mockTeams } from "../lib/mock/teams";
import { esc, reportFileName, reportToCSV, reportToJSON } from "../lib/reports/export";
import { mockRequests } from "../lib/mock/requests";
import { filterProjects, EMPTY_FILTERS, getProject } from "../lib/services/projects";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();

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

// 1-2. Role gate
{
  check("Gate — admin allowed", canAccessAdmin("admin"));
  check("Gate — student denied", !canAccessAdmin("student"));
}

// 3. Dashboard statistics render (all sections present)
{
  const stats = await getAdminStats();
  const keys = Object.keys(stats);
  check(
    "Stats — all 8 cards present",
    ["totalStudents", "activeStudents", "totalProjects", "activeProjects", "totalTeams", "completedTeams", "pendingRequests", "successfulMatches"].every((k) => keys.includes(k))
  );
}

// 14-15. Consistency with mock state
{
  const stats = await getAdminStats();
  check("Consistent — total students = mocks + me", stats.totalStudents === mockStudents.length + 1, `${stats.totalStudents}`);
  check("Consistent — total teams = mock teams", stats.totalTeams === mockTeams.length, `${stats.totalTeams}`);
  check(
    "Consistent — pending = pending requests",
    stats.pendingRequests === mockRequests.filter((r) => r.status === "pending").length
  );
  check(
    "Consistent — matches = accepted requests",
    stats.successfulMatches === mockRequests.filter((r) => r.status === "accepted").length
  );
  check(
    "Consistent — archived excluded from totals",
    stats.totalProjects === mockProjects.filter((p) => p.status !== "Archived").length
  );
}

// 4-5. User search + filters (pure helper)
{
  const users = await getAdminUsers();
  const byName = filterAdminUsers(users, { query: "sarah", role: "", accountStatus: "", teamStatus: "", program: "" });
  check("Users — search by name", byName.length >= 1 && byName.every((u) => u.name.toLowerCase().includes("sarah")));
  const byEmail = filterAdminUsers(users, { query: "must.ac.tz", role: "", accountStatus: "", teamStatus: "", program: "" });
  check("Users — search matches emails", byEmail.length === users.length);
  const byProgram = filterAdminUsers(users, { query: "Data Science", role: "", accountStatus: "", teamStatus: "", program: "" });
  check("Users — search by program", byProgram.every((u) => u.program === "Data Science") && byProgram.length === 2, `${byProgram.length}`);
  const inactive = filterAdminUsers(users, { query: "", role: "", accountStatus: "inactive", teamStatus: "", program: "" });
  check("Users — inactive filter", inactive.length === 1 && inactive[0].id === "elias-mbise");
  const noTeam = filterAdminUsers(users, { query: "", role: "", accountStatus: "", teamStatus: "no-team", program: "" });
  check("Users — no-team filter non-empty", noTeam.length > 0 && noTeam.every((u) => !u.teamName));
}

// 6-8. Project/team search + filters
{
  const q = filterProjects(mockProjects, { ...EMPTY_FILTERS, query: "library" });
  check("Projects — search works", q.length === 1 && q[0].id === "smart-library");
  const rec = filterProjects(mockProjects, { ...EMPTY_FILTERS, status: "Recruiting" });
  check("Projects — status filter", rec.every((p) => p.status === "Recruiting") && rec.length > 0);
  const react = filterProjects(mockProjects, { ...EMPTY_FILTERS, skills: ["React"] });
  check("Projects — skill filter", react.every((p) => p.requiredSkills.includes("React")) && react.length > 0);
  const none = filterProjects(mockProjects, { ...EMPTY_FILTERS, query: "zzz-no-such-project" });
  check("Projects — empty result possible", none.length === 0);
}

// 9-11. Actions require permission; mutations work for admins
{
  const forbidden = await adminSetUserStatus("me", "inactive", "student");
  check("Actions — student cannot change users", !forbidden.ok && forbidden.error === "FORBIDDEN");

  const ok = await adminSetUserStatus("elias-mbise", "active", "admin");
  const users = await getAdminUsers();
  check("Users — activation works", ok.ok && users.find((u) => u.id === "elias-mbise")?.accountStatus === "active");
  await adminSetUserStatus("elias-mbise", "inactive", "admin");

  const svcSrc = readFileSync(join(ROOT, "lib", "services", "admin.ts"), "utf8");
  const actionsSrc = readFileSync(join(ROOT, "lib", "actions", "admin.ts"), "utf8");
  const usersPage = readFileSync(join(ROOT, "app", "admin", "users", "page.tsx"), "utf8");
  const userTable = readFileSync(join(ROOT, "components", "admin", "AdminUserTable.tsx"), "utf8");
  check("Users — role-change API removed from service", !svcSrc.includes("adminSetUserRole"));
  check("Users — role-change action removed", !actionsSrc.includes("adminSetUserRoleAction"));
  check("Users — no role UI on users page", !usersPage.includes("onChangeRole") && !usersPage.includes("handleRoleChange"));
  check("Users — no role select in user table", !userTable.includes("onChangeRole") && !userTable.includes("<select"));
  const meRow = (await getAdminUsers()).find((u) => u.id === "me");
  check("Users — single mock admin intact", meRow?.role === "student");

  const missing = await adminSetUserStatus("ghost", "active", "admin");
  check("Users — unknown user 404s", !missing.ok && missing.error === "NOT_FOUND");
}

// 12-13. Project + team status changes
{
  const ps = await adminSetProjectStatus("iot-weather", "In Progress", "admin");
  check("Projects — status change works", ps.ok && getProject("iot-weather")?.status === "In Progress");
  await adminSetProjectStatus("iot-weather", "Recruiting", "admin");

  const denied = await adminSetTeamStatus("team-asset", "Completed", "student");
  check("Teams — student cannot change status", !denied.ok && denied.error === "FORBIDDEN");
}

// 16. Reports render inputs
{
  const reports = await getReports();
  check("Reports — four sections present", Boolean(reports.students && reports.projects && reports.teams && reports.matching));
  check("Reports — success rate is a percent", reports.matching.successRate >= 0 && reports.matching.successRate <= 100);
  check("Reports — top skills derived", reports.matching.topRequestedSkills.length > 0);
  const recent = await getRecentActivity(5);
  check("Reports — recent activity capped", recent.length <= 5 && recent.length > 0);
  const week = await getWeekdayActivity();
  check("Reports — 7 weekday buckets", week.length === 7);
  const tiers = getMatchingTierCutoffs();
  check("Reports — live tier cutoffs exposed", tiers[0].tier === "Excellent" && tiers[0].min === 90);
  const programs = await getProgramStats();
  check("Reports — program slices sum to users", programs.reduce((s, p) => s + p.count, 0) === mockStudents.length + 1);
  const pst = await getProjectStatusStats();
  const tst = await getTeamStatusStats();
  check("Charts — status slices cover all", pst.reduce((s, p) => s + p.count, 0) === mockProjects.length && tst.reduce((s, t) => s + t.count, 0) === mockTeams.length);
}

// Archive / delete / disband (run last — mutating)
{
  const arch = await adminArchiveProject("cyber-awareness", "admin");
  check("Projects — archive works", arch.ok && getProject("cyber-awareness")?.status === "Archived");
  const hidden = filterProjects([getProject("cyber-awareness")!], EMPTY_FILTERS);
  check("Projects — archived hidden from discovery", hidden.length === 0);
  await adminSetProjectStatus("cyber-awareness", "Recruiting", "admin");

  const del = await adminDeleteProject("lost-and-found", "admin");
  check("Projects — delete works", del.ok && !getProject("lost-and-found"));
  const gone = filterProjects(mockProjects.filter((p) => p.id !== "lost-and-found"), { ...EMPTY_FILTERS, query: "lost and found" });
  check("Projects — deleted gone from results", gone.length === 0);

  const dis = await adminDisbandTeam("team-iot", "admin");
  const { getTeamById } = await import("../lib/services/teams");
  check("Teams — disband works", dis.ok && (await getTeamById("team-iot")) === null);
}

// Report export (same bundle the page downloads)
{
  const bundle = await getReports();
  const stamp = "2026-01-01T00:00:00.000Z";
  const csv = reportToCSV(bundle, stamp);
  check("Export — CSV has all sections", ["Student Statistics", "Project Statistics", "Team Statistics", "Matching Statistics", "Most Requested Skills", "Most Common Skill Gaps", "Students by Year", "Students by Program"].every((s) => csv.includes(s)));
  check("Export — CSV carries real numbers", csv.includes(`Total students,${bundle.students.total}`) && csv.includes(`Match success rate,${bundle.matching.successRate}%`));
  check("Export — CSV escapes commas/quotes", esc('A, "B"') === '"A, ""B"""' && esc("plain") === "plain" && esc(42) === "42");
  const tricky = { ...bundle };
  const csvEscaped = reportToCSV(tricky, stamp);
  check("Export — CSV header present", csvEscaped.startsWith("Project Matcher"));
  const json = JSON.parse(reportToJSON(bundle, stamp)) as { generatedAt: string; students: { total: number } };
  check("Export — JSON round-trips the bundle", json.generatedAt === stamp && json.students.total === bundle.students.total);
  check("Export — filenames are dated", reportFileName("csv").startsWith("project-matcher-report-") && reportFileName("json").endsWith(".json"));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
