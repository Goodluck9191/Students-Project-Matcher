/**
 * Matching engine tests — run with:  npm run test:matching
 * (Node 22+ strips types natively; no test framework needed.)
 *
 * Each case builds small synthetic fixtures so the suite stays
 * independent of mock-data edits.
 */
import { scoreSkills } from "../lib/matching/skillMatcher";
import { scoreAvailability } from "../lib/matching/availabilityMatcher";
import { scoreProgram } from "../lib/matching/academicMatcher";
import { calculateMatches } from "../lib/matching/matchCalculator";
import type { Project, Student, Team } from "../types/index";

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

function student(over: Partial<Student> & { id: string }): Student {
  return {
    fullName: over.id,
    university: "Test University",
    program: "Computer Science",
    year: 2,
    bio: "",
    skills: [],
    interests: [],
    availability: [],
    experienceLevel: "Intermediate",
    profileCompletion: 100,
    createdAt: new Date().toISOString(),
    ...over,
  } as Student;
}

function project(over: Partial<Project> = {}): Project {
  return {
    id: "proj-1",
    title: "Test Project",
    description: "Test",
    category: "Web Development",
    projectType: "Coursework",
    creatorId: "me",
    creatorName: "Me",
    requiredSkills: ["React", "Node.js", "PostgreSQL", "UI/UX"],
    interests: ["Web Development", "AI"],
    program: "Computer Engineering",
    maxTeamSize: 5,
    currentMembers: 2,
    status: "Recruiting",
    deadline: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    createdAt: new Date().toISOString(),
    ...over,
  } as Project;
}

function team(over: Partial<Team> = {}): Team {
  return {
    id: "team-1",
    projectId: "proj-1",
    projectTitle: "Test Project",
    members: [
      { studentId: "john", name: "John", role: "Backend", skills: ["React", "Node.js"], matchScore: 80 },
      { studentId: "david", name: "David", role: "Backend", skills: ["PostgreSQL"], matchScore: 75 },
    ],
    maxMembers: 5,
    skillsCovered: ["Frontend", "Backend", "Database"],
    progress: 30,
    deadline: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...over,
  } as Team;
}

function byId(...students: Student[]): Map<string, Student> {
  return new Map(students.map((s) => [s.id, s]));
}

// Case 1 — strong skill match scores high
{
  const s = student({ id: "star", skills: ["React", "Node.js", "PostgreSQL"], availability: ["Weekends", "Evening"], interests: ["Web Development"] });
  const t = team();
  const res = calculateMatches(
    { project: project(), team: t, studentsById: byId(s, student({ id: "john", availability: ["Weekends"] }), student({ id: "david", availability: ["Evening"] })), currentUserId: "me" },
    [s]
  );
  check("Case 1 — strong skill match scores high", res.recommendations[0]?.score >= 60, `got ${res.recommendations[0]?.score}`);
}

// Case 2 — complementary gap-filler outranks overlap clone
{
  const clone = student({ id: "clone", skills: ["React", "Node.js", "JavaScript"], availability: ["Weekdays"], interests: ["AI"] });
  const gapFiller = student({
    id: "gapfiller",
    skills: ["UI/UX", "Figma"],
    skillLevels: [{ skill: "UI/UX", level: "Advanced" }],
    availability: ["Weekends", "Evening"],
    interests: ["Web Development"],
  });
  const t = team();
  const res = calculateMatches(
    { project: project(), team: t, studentsById: byId(clone, gapFiller, student({ id: "john", availability: ["Weekends"] }), student({ id: "david", availability: ["Evening"] })), currentUserId: "me" },
    [clone, gapFiller]
  );
  const [first, second] = res.recommendations;
  check(
    "Case 2 — gap-filler outranks overlap clone",
    first?.student.id === "gapfiller",
    `order: ${res.recommendations.map((r) => `${r.student.id}:${r.score}`).join(", ")}`
  );
  check("Case 2 — gap reason mentions UI/UX", (second ? first : first)?.reasons.some((r) => r.includes("UI/UX")) ?? false);
}

// Case 3 — weak match scores lower
{
  const weak = student({ id: "weak", skills: ["Cooking"], interests: ["Sports"], availability: ["Morning"], program: "History" });
  const strong = student({ id: "strong2", skills: ["UI/UX", "React"], availability: ["Weekends", "Evening"], interests: ["Web Development", "AI"] });
  const t = team();
  const res = calculateMatches(
    { project: project(), team: t, studentsById: byId(weak, strong), currentUserId: "me" },
    [weak, strong]
  );
  const weakScore = res.recommendations.find((r) => r.student.id === "weak")?.score ?? 100;
  const strongScore = res.recommendations.find((r) => r.student.id === "strong2")?.score ?? 0;
  check("Case 3 — weak match scores lower", weakScore < strongScore && weakScore < 60, `weak=${weakScore} strong=${strongScore}`);
}

// Case 4 — existing team member excluded
{
  const member = student({ id: "john", skills: ["UI/UX"] });
  const outsider = student({ id: "outsider", skills: ["UI/UX"] });
  const res = calculateMatches(
    { project: project(), team: team(), studentsById: byId(member, outsider), currentUserId: "me" },
    [member, outsider]
  );
  check(
    "Case 4 — existing member excluded",
    res.recommendations.length === 1 && res.recommendations[0]?.student.id === "outsider"
  );
}

// Case 5 — full team yields no recommendations
{
  const full = team({
    members: [
      { studentId: "a", name: "A", role: "Dev", skills: ["React"], matchScore: 80 },
      { studentId: "b", name: "B", role: "Dev", skills: ["Node.js"], matchScore: 80 },
      { studentId: "c", name: "C", role: "Dev", skills: ["PostgreSQL"], matchScore: 80 },
      { studentId: "d", name: "D", role: "Dev", skills: ["UI/UX"], matchScore: 80 },
      { studentId: "e", name: "E", role: "Dev", skills: ["Testing"], matchScore: 80 },
    ],
  });
  const res = calculateMatches(
    { project: project(), team: full, studentsById: byId(), currentUserId: "me" },
    [student({ id: "anyone", skills: ["UI/UX"] })]
  );
  check("Case 5 — full team → teamFull + empty", res.teamFull && res.recommendations.length === 0);
}

// Case 6 — availability mismatch lowers score
{
  const t = team();
  const aligned = student({ id: "aligned", skills: ["UI/UX"], availability: ["Weekends", "Evening"] });
  const misaligned = student({ id: "misaligned", skills: ["UI/UX"], availability: ["Morning"] });
  const res = calculateMatches(
    {
      project: project(),
      team: t,
      studentsById: byId(aligned, misaligned, student({ id: "john", availability: ["Weekends", "Evening"] }), student({ id: "david", availability: ["Weekends", "Evening"] })),
      currentUserId: "me",
    },
    [aligned, misaligned]
  );
  const a = res.recommendations.find((r) => r.student.id === "aligned")?.score ?? 0;
  const m = res.recommendations.find((r) => r.student.id === "misaligned")?.score ?? 100;
  check("Case 6 — availability mismatch lowers score", a > m, `aligned=${a} misaligned=${m}`);
  const availDirect = scoreAvailability(["Weekends", "Evening"], ["Morning"]);
  check("Case 6 — zero overlap scores 0", availDirect.score === 0);
}

// Case 7 — different program still recommendable with strong skills
{
  const outsider = student({
    id: "ee-star",
    program: "Electrical Engineering",
    skills: ["UI/UX"],
    skillLevels: [{ skill: "UI/UX", level: "Advanced" }],
    availability: ["Weekends", "Evening"],
    interests: ["Web Development", "AI"],
  });
  const res = calculateMatches(
    { project: project(), team: team(), studentsById: byId(outsider), currentUserId: "me" },
    [outsider]
  );
  check("Case 7 — different program, strong skills → solid score", (res.recommendations[0]?.score ?? 0) >= 60, `got ${res.recommendations[0]?.score}`);
  check("Case 7 — related program scores above unrelated", scoreProgram("Computer Engineering", "Electrical Engineering") > scoreProgram("Computer Engineering", "History"));
}

// Unit: advanced level beats beginner on the same gap skill
{
  const adv = scoreSkills({ required: ["PostgreSQL"], missing: ["PostgreSQL"], candidateSkills: ["PostgreSQL"], candidateLevels: [{ skill: "PostgreSQL", level: "Advanced" }] });
  const beg = scoreSkills({ required: ["PostgreSQL"], missing: ["PostgreSQL"], candidateSkills: ["PostgreSQL"], candidateLevels: [{ skill: "PostgreSQL", level: "Beginner" }] });
  check("Unit — Advanced outscores Beginner on gap skill", adv.score > beg.score, `adv=${adv.score} beg=${beg.score}`);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
