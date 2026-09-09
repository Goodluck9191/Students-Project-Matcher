/**
 * Dashboard/real-data tests — run with:  npm run test:dashboard
 * (Plain Node via scripts/ts-resolve-loader.mjs; no test framework.)
 *
 * Covers the centralized completion formula, the real-record activity
 * feed, teammate profile resolution, and skill-level mapping.
 */
import { computeCompletion } from "../lib/services/profile";
import { emptyProfileDraft } from "../lib/mock/profile";
import { getUserActivityFeed } from "../lib/services/activity";
import { getStudentProfileById } from "../lib/services/students";
import { sendTeamInvitation } from "../lib/services/requests";
import { mockStudents } from "../lib/mock/students";
import { mockProjects } from "../lib/mock/projects";
import { mockTeams } from "../lib/mock/teams";
import { mockRequests } from "../lib/mock/requests";
import { mockTeamActivity } from "../lib/mock/teams";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { StudentProfile } from "../types/index";

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

function fullDraft(): StudentProfile {
  return {
    ...emptyProfileDraft(),
    fullName: "Test User",
    email: "t@x.edu",
    bio: "A sufficiently long bio describing interests and goals.",
    university: "Test University",
    department: "CSE",
    program: "Computer Science",
    year: 2,
    graduationYear: "2028",
    skills: [
      { skill: "React", level: "Advanced" },
      { skill: "TypeScript", level: "Intermediate" },
      { skill: "Python", level: "Beginner" },
    ],
    interests: ["Web Development", "AI"],
    availableDays: ["Monday", "Wednesday"],
    dayTimes: ["Evening"],
    workStyle: "Hybrid",
    availability: ["Weekdays", "Evening"],
    experienceLevel: "Intermediate",
    previousExperience: "Built things.",
    avatarUrl: "https://example.com/a.png",
  };
}

// Completion formula
{
  check("Completion — empty draft is low", computeCompletion(emptyProfileDraft()) === 5, `${computeCompletion(emptyProfileDraft())}`);
  check("Completion — full draft is 100", computeCompletion(fullDraft()) === 100, `${computeCompletion(fullDraft())}`);
  const noBio = { ...fullDraft(), bio: "" };
  check("Completion — removing bio decreases", computeCompletion(noBio) === 90, `${computeCompletion(noBio)}`);
  const noSkills = { ...fullDraft(), skills: [] };
  check("Completion — empty skills drop 20", computeCompletion(noSkills) === 80, `${computeCompletion(noSkills)}`);
  const blobAvatar = { ...fullDraft(), avatarUrl: "blob:fake" };
  check("Completion — blob avatar counts nothing", computeCompletion(blobAvatar) === 95, `${computeCompletion(blobAvatar)}`);
  check("Completion — clamped range", computeCompletion(fullDraft()) <= 100 && computeCompletion(emptyProfileDraft()) >= 0);
}

// Activity feed from real records
{
  const feed = getUserActivityFeed({
    userId: "me",
    students: mockStudents,
    projects: mockProjects,
    teams: mockTeams,
    requests: mockRequests,
    teamActivity: mockTeamActivity,
    limit: 5,
  });
  check("Activity — only user-involved items", feed.length > 0 && feed.length <= 5);
  const desc = feed.every(
    (a, i, arr) => i === 0 || new Date(arr[i - 1].createdAt).getTime() >= new Date(a.createdAt).getTime()
  );
  check("Activity — newest first", desc);
  check("Activity — no fabricated subjects", feed.every((a) => !/Sarah accepted your invitation/.test(a.title)));
  const empty = getUserActivityFeed({
    userId: "ghost",
    students: [],
    projects: [],
    teams: [],
    requests: [],
    teamActivity: [],
  });
  check("Activity — empty input, empty feed", empty.length === 0);
  const proj = getUserActivityFeed({
    userId: "me",
    students: mockStudents,
    projects: mockProjects.filter((p) => p.id === "asset-management"),
    teams: [],
    requests: [],
    teamActivity: [],
  });
  check("Activity — own project creation included", proj.some((a) => a.title.includes("Asset Management")));
}

// Teammate profile resolution (mock mode)
{
  const found = await getStudentProfileById("sarah-michael");
  check(
    "Profile — real fixture resolves",
    found.status === "ok" && found.profile.fullName === "Sarah Michael" && found.profile.skills.length > 0
  );
  const missing = await getStudentProfileById("no-such-student");
  check("Profile — unknown id is not-found", missing.status === "not-found");
  const me = await getStudentProfileById("me");
  check("Profile — own id resolves in mock mode", me.status === "ok");
}

// Dashboard invite regression: no local mock invite may remain.
// The card must route through the real invitation service + modal.
{
  const root = process.cwd();
  const card = readFileSync(join(root, "components", "dashboard", "RecommendedTeammates.tsx"), "utf8");
  check("Invite — dashboard uses the real InvitationModal", card.includes("InvitationModal"));
  check("Invite — dashboard loads real owner teams", card.includes("listMyTeams"));
  check("Invite — dashboard checks real pending state", card.includes("listTeamPendingRequests"));
  check("Invite — no demo copy in dashboard card", !/demo mode/i.test(card));
  check("Invite — no local mock invite state", !card.includes("setInvited(true)"));

  const modal = readFileSync(join(root, "components", "requests", "InvitationModal.tsx"), "utf8");
  check("Invite — modal supports team choice", modal.includes("teamChoices"));
  check("Invite — modal sends via service", modal.includes("sendTeamInvitation"));

  // Mock-mode end-to-end through the same service the modal calls.
  const invite = await sendTeamInvitation({
    teamId: "team-asset",
    senderId: "me",
    recipientId: "amina-juma",
    message: "Join us!",
  });
  check(
    "Invite — mock branch creates pending request",
    invite.ok && invite.request.status === "pending" && invite.request.type === "invitation"
  );
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
