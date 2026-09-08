import type { Team } from "@/types";

/** TODO (Supabase): replace with `from("teams").select(...)` */

const daysFromNow = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();

export const mockTeams: Team[] = [
  {
    id: "team-asset",
    projectId: "asset-management",
    projectTitle: "University Asset Management System",
    maxMembers: 5,
    members: [
      {
        studentId: "me",
        name: "Alex Morgan",
        role: "Project Creator · Frontend",
        skills: ["React", "TypeScript"],
        matchScore: 92,
      },
      {
        studentId: "john-michael",
        name: "John Michael",
        role: "Backend",
        skills: ["Node.js", "PostgreSQL"],
        matchScore: 91,
      },
      {
        studentId: "priya-nair",
        name: "Priya Nair",
        role: "Full-stack",
        skills: ["React", "Supabase"],
        matchScore: 86,
      },
    ],
    skillsCovered: ["Frontend", "Backend", "Database"],
    progress: 45,
    deadline: daysFromNow(42),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "team-library",
    projectId: "smart-library",
    projectTitle: "Smart Library Management System",
    maxMembers: 3,
    members: [
      {
        studentId: "me",
        name: "Alex Morgan",
        role: "Frontend",
        skills: ["React"],
        matchScore: 90,
      },
      {
        studentId: "grace-lee",
        name: "Grace Lee",
        role: "Testing & Docs",
        skills: ["Testing", "Documentation"],
        matchScore: 78,
      },
      {
        studentId: "priya-nair",
        name: "Priya Nair",
        role: "Backend",
        skills: ["Supabase"],
        matchScore: 84,
      },
    ],
    skillsCovered: ["Frontend", "Backend", "Testing"],
    progress: 80,
    deadline: daysFromNow(14),
    updatedAt: new Date().toISOString(),
  },
];
