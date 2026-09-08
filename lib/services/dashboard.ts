import type {
  ActivityItem,
  AppNotification,
  MatchRecommendation,
  Project,
  ProjectStatus,
  Student,
  Team,
  TeamRequest,
} from "@/types";
import { mockCurrentStudent, mockStudents } from "@/lib/mock/students";
import { mockProfile } from "@/lib/mock/profile";
import { getMatchTier } from "@/lib/matching/score";
import { EMPTY_FILTERS, listProjects } from "./projects";
import { listTeams } from "./teams";
import { getReceivedRequests, getSentRequests } from "./requests";
import { getNotifications, getUnreadCount } from "./notifications";

/**
 * Dashboard data layer — Stage 4.
 *
 * The dashboard page calls `getDashboardData()` only. To move to Supabase,
 * replace each section below with a query (profiles, projects, teams,
 * team_requests, notifications) without touching UI components.
 *
 * TODO (Supabase): derive match scores server-side; paginate activity.
 */

export type { ProjectStatus };

export interface MyProject extends Team {
  role: string;
  status: ProjectStatus;
}

export interface DashboardData {
  student: Student;
  firstName: string;
  profileCompletion: number;
  stats: { myProjects: number; recommended: number; matches: number; pending: number };
  recommendedProjects: Project[];
  recommendedTeammates: MatchRecommendation[];
  myProjects: MyProject[];
  activity: ActivityItem[];
  pendingReceived: TeamRequest[];
  pendingSent: TeamRequest[];
  notifications: AppNotification[];
  unreadCount: number;
  strongestSkills: string[];
  missingSkills: string[];
}

function delay(ms = 650): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toTeammate(student: Student, projectNeeds: string[]): MatchRecommendation {
  const matchingSkills = student.skills.filter((s) => projectNeeds.includes(s));
  const complementary = student.skills.filter((s) => !projectNeeds.includes(s));
  const score = student.matchScore ?? 70;
  const reasons = [
    ...matchingSkills.slice(0, 2).map((s) => `Covers needed skill: ${s}`),
    ...complementary.slice(0, 1).map((s) => `Adds something new: ${s}`),
    `Available ${student.availability.join(" · ")}`,
  ];
  return {
    student,
    score,
    tier: getMatchTier(score),
    matchingSkills,
    complementarySkills: complementary,
    missingSkillsCovered: matchingSkills,
    matchingInterests: student.interests.slice(0, 2),
    availabilityMatch: 0.8,
    breakdown: {
      skill: 0.8,
      interest: 0.7,
      availability: 0.8,
      program: 0.7,
      experience: 0.8,
      year: 0.8,
    },
    reasons,
  };
}

export async function getDashboardData(): Promise<DashboardData> {
  await delay();

  const [allProjects, allTeams] = await Promise.all([
    listProjects(EMPTY_FILTERS),
    listTeams(),
  ]);

  const myProjects: MyProject[] = allTeams
    .filter((t) => t.members.some((m) => m.studentId === "me"))
    .map((t) => {
      const me = t.members.find((m) => m.studentId === "me");
      const full = t.members.length >= t.maxMembers;
      return {
        ...t,
        role: me?.role ?? "Member",
        status: full ? (t.progress >= 70 ? "In Progress" : "Team Complete") : "Recruiting",
      };
    });

  const recommendedProjects = allProjects
    .filter((p) => p.creatorId !== "me")
    .slice(0, 3);

  const projectNeeds = ["React", "Node.js", "PostgreSQL", "UI/UX"];
  const recommendedTeammates = [...mockStudents]
    .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
    .slice(0, 3)
    .map((s) => toTeammate(s, projectNeeds));

  const [received, sent, notifications, unreadCount] = await Promise.all([
    getReceivedRequests("me"),
    getSentRequests("me"),
    getNotifications("me"),
    getUnreadCount("me"),
  ]);
  const pendingReceived = received.filter((r) => r.status === "pending");
  const pendingSent = sent;

  const activity: ActivityItem[] = [
    {
      id: "act-1",
      title: "Sarah accepted your invitation",
      detail: "University Asset Management System",
      createdAt: notifications[2]?.createdAt ?? new Date().toISOString(),
      linkHref: "/teams",
    },
    {
      id: "act-2",
      title: "You received a new teammate recommendation",
      detail: "Sarah Michael · 94% match",
      createdAt: notifications[1]?.createdAt ?? new Date().toISOString(),
      linkHref: "/matches",
    },
    {
      id: "act-3",
      title: "You created “University Asset Management System”",
      createdAt:
        allProjects.find((p) => p.id === "asset-management")?.createdAt ??
        new Date().toISOString(),
      linkHref: "/projects/asset-management",
    },
    {
      id: "act-4",
      title: "John requested to join your project",
      detail: "University Asset Management System · 91%",
      createdAt: received[0]?.createdAt ?? new Date().toISOString(),
      linkHref: "/requests",
    },
    {
      id: "act-5",
      title: "Your profile reached 80% completion",
      createdAt: received[1]?.createdAt ?? new Date().toISOString(),
      linkHref: "/profile/setup",
    },
  ];

  return {
    student: mockCurrentStudent,
    firstName: mockProfile.fullName.split(" ")[0] || mockCurrentStudent.fullName.split(" ")[0],
    profileCompletion: mockCurrentStudent.profileCompletion,
    stats: {
      myProjects: myProjects.length,
      recommended: 12,
      matches: mockStudents.length + 2,
      pending: pendingReceived.length,
    },
    recommendedProjects,
    recommendedTeammates,
    myProjects,
    activity,
    pendingReceived,
    pendingSent,
    notifications: notifications.slice(0, 4),
    unreadCount,
    strongestSkills: ["React", "TypeScript", "Node.js"],
    missingSkills: ["UI/UX", "Testing", "Documentation"],
  };
}
