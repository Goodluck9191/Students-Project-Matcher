import type { Team, TeamActivityItem } from "@/types";

/**
 * Mock teams — Stage 7 realistic dataset (4 teams formed via matching).
 * Members reference students by `studentId`; profile details resolve via
 * lib/services/students.ts so records are never duplicated.
 * TODO (Supabase): `teams` + `team_members` tables via lib/services/teams.ts.
 */

const daysFromNow = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

export const mockTeams: Team[] = [
  {
    id: "team-asset",
    projectId: "asset-management",
    projectTitle: "University Asset Management System",
    ownerId: "me",
    status: "Recruiting",
    maxMembers: 5,
    members: [
      {
        studentId: "me",
        name: "Alex Morgan",
        role: "Project Lead",
        skills: ["React", "TypeScript"],
        matchScore: 92,
        status: "active",
      },
      {
        studentId: "john-michael",
        name: "John Michael",
        role: "Backend Developer",
        skills: ["Node.js", "PostgreSQL"],
        matchScore: 91,
        status: "active",
      },
      {
        studentId: "priya-nair",
        name: "Priya Nair",
        role: "Frontend Developer",
        skills: ["React", "Supabase"],
        matchScore: 86,
        status: "active",
      },
    ],
    skillsCovered: ["Frontend", "Backend", "Database"],
    progress: 45,
    deadline: daysFromNow(42),
    createdAt: daysAgo(6),
    updatedAt: hoursAgo(2),
  },
  {
    id: "team-library",
    projectId: "smart-library",
    projectTitle: "Smart Library Management System",
    ownerId: "me",
    status: "In Progress",
    maxMembers: 3,
    members: [
      {
        studentId: "me",
        name: "Alex Morgan",
        role: "Frontend Developer",
        skills: ["React"],
        matchScore: 90,
        status: "active",
      },
      {
        studentId: "grace-lee",
        name: "Grace Lee",
        role: "Tester / QA",
        skills: ["Testing", "Documentation"],
        matchScore: 78,
        status: "active",
      },
      {
        studentId: "priya-nair",
        name: "Priya Nair",
        role: "Backend Developer",
        skills: ["Supabase"],
        matchScore: 84,
        status: "active",
      },
    ],
    skillsCovered: ["Frontend", "Backend", "Testing"],
    progress: 80,
    deadline: daysFromNow(14),
    createdAt: daysAgo(20),
    updatedAt: hoursAgo(26),
  },
  {
    id: "team-expense",
    projectId: "expense-buddy",
    projectTitle: "Student Expense Budget Assistant",
    ownerId: "priya-nair",
    status: "In Progress",
    maxMembers: 4,
    members: [
      {
        studentId: "priya-nair",
        name: "Priya Nair",
        role: "Project Lead",
        skills: ["React", "Supabase"],
        matchScore: 88,
        status: "active",
      },
      {
        studentId: "me",
        name: "Alex Morgan",
        role: "Frontend Developer",
        skills: ["React", "TypeScript"],
        matchScore: 88,
        status: "active",
      },
      {
        studentId: "mary-john",
        name: "Mary John",
        role: "UI/UX Designer",
        skills: ["Testing", "Documentation"],
        matchScore: 82,
        status: "active",
      },
      {
        studentId: "amina-juma",
        name: "Amina Juma",
        role: "UI/UX Designer",
        skills: ["UI/UX", "Figma"],
        matchScore: 87,
        status: "invited",
      },
    ],
    skillsCovered: ["Frontend", "Backend", "UI/UX"],
    progress: 60,
    deadline: daysFromNow(5),
    createdAt: daysAgo(3),
    updatedAt: hoursAgo(5),
  },
  {
    id: "team-health",
    projectId: "health-appointments",
    projectTitle: "Student Health Appointment System",
    ownerId: "sarah-michael",
    status: "Recruiting",
    maxMembers: 5,
    members: [
      {
        studentId: "sarah-michael",
        name: "Sarah Michael",
        role: "Project Lead",
        skills: ["UI/UX", "Figma"],
        matchScore: 90,
        status: "active",
      },
      {
        studentId: "me",
        name: "Alex Morgan",
        role: "Frontend Developer",
        skills: ["React", "TypeScript"],
        matchScore: 90,
        status: "active",
      },
    ],
    skillsCovered: ["Frontend", "UI/UX"],
    progress: 15,
    deadline: daysFromNow(28),
    createdAt: daysAgo(4),
    updatedAt: hoursAgo(30),
  },
];

export const mockTeamActivity: TeamActivityItem[] = [
  {
    id: "ta-1",
    teamId: "team-asset",
    title: "Sarah Michael was invited to the team",
    detail: "UI/UX Designer · 94% match",
    createdAt: hoursAgo(2),
  },
  {
    id: "ta-2",
    teamId: "team-asset",
    title: "Priya Nair joined the team",
    detail: "Frontend Developer",
    createdAt: hoursAgo(26),
  },
  {
    id: "ta-3",
    teamId: "team-asset",
    title: "Project status changed to Recruiting",
    createdAt: hoursAgo(50),
  },
  {
    id: "ta-4",
    teamId: "team-library",
    title: "Grace Lee joined the team",
    detail: "Tester / QA",
    createdAt: hoursAgo(26),
  },
  {
    id: "ta-5",
    teamId: "team-library",
    title: "Project status changed to In Progress",
    createdAt: hoursAgo(49),
  },
  {
    id: "ta-6",
    teamId: "team-expense",
    title: "Amina Juma was invited to the team",
    detail: "UI/UX Designer · 87% match",
    createdAt: hoursAgo(5),
  },
  {
    id: "ta-7",
    teamId: "team-expense",
    title: "Mary John was assigned UI/UX Designer",
    createdAt: hoursAgo(24),
  },
  {
    id: "ta-8",
    teamId: "team-health",
    title: "Alex Morgan joined the team",
    detail: "Frontend Developer",
    createdAt: hoursAgo(30),
  },
];
