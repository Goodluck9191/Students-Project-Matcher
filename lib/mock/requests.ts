import type { TeamRequest } from "@/types";

/** TODO (Supabase): replace with `from("team_requests").select(...)` */

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

export const mockRequests: TeamRequest[] = [
  {
    id: "req-1",
    direction: "received",
    studentId: "john-michael",
    studentName: "John Michael",
    projectId: "asset-management",
    projectTitle: "University Asset Management System",
    match: 91,
    status: "pending",
    createdAt: hoursAgo(26),
  },
  {
    id: "req-2",
    direction: "received",
    studentId: "grace-lee",
    studentName: "Grace Lee",
    projectId: "asset-management",
    projectTitle: "University Asset Management System",
    match: 78,
    status: "pending",
    createdAt: hoursAgo(7),
  },
  {
    id: "req-3",
    direction: "received",
    studentId: "tom-becker",
    studentName: "Tom Becker",
    projectId: "smart-library",
    projectTitle: "Smart Library Management System",
    match: 68,
    status: "pending",
    createdAt: hoursAgo(3),
  },
  {
    id: "req-4",
    direction: "sent",
    studentId: "sarah-michael",
    studentName: "Sarah Michael",
    projectId: "asset-management",
    projectTitle: "University Asset Management System",
    match: 94,
    status: "pending",
    createdAt: hoursAgo(30),
  },
  {
    id: "req-5",
    direction: "sent",
    studentId: "david-kim",
    studentName: "David Kim",
    projectId: "study-buddy",
    projectTitle: "Study Buddy Finder",
    match: 72,
    status: "accepted",
    createdAt: hoursAgo(50),
  },
];
