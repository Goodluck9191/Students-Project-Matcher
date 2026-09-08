/**
 * Central domain types for Project Matcher.
 *
 * These types mirror the future Supabase/Postgres schema so that
 * swapping `lib/mock/*` for Supabase queries requires no UI changes.
 */

export type ExperienceLevel = "Beginner" | "Intermediate" | "Advanced";

export type AvailabilitySlot =
  | "Weekdays"
  | "Weekends"
  | "Morning"
  | "Afternoon"
  | "Evening";

export type RequestStatus = "pending" | "accepted" | "rejected" | "cancelled";

export type NotificationType =
  | "invitation"
  | "request_accepted"
  | "request_rejected"
  | "match"
  | "team_added"
  | "project";

export interface Student {
  id: string;
  fullName: string;
  avatarUrl?: string;
  university: string;
  program: string;
  year: number;
  bio: string;
  skills: string[];
  interests: string[];
  availability: AvailabilitySlot[];
  experienceLevel: ExperienceLevel;
  profileCompletion: number; // 0-100
  matchScore?: number; // 0-100, context-dependent
  createdAt: string;
}

export type ProjectCategory =
  | "Web Development"
  | "AI"
  | "Cybersecurity"
  | "IoT"
  | "Mobile Apps"
  | "Networking"
  | "Data Science"
  | "Software Engineering";

export type ProjectType = "Coursework" | "Final Year" | "Hackathon" | "Research" | "Side Project";

export interface Project {
  id: string;
  title: string;
  description: string;
  category: ProjectCategory;
  projectType: ProjectType;
  creatorId: string;
  creatorName: string;
  requiredSkills: string[];
  interests: string[];
  maxTeamSize: number;
  currentMembers: number;
  deadline: string; // ISO date
  matchPercentage?: number; // 0-100 relative to viewer
  createdAt: string;
}

export interface TeamMember {
  studentId: string;
  name: string;
  avatarUrl?: string;
  role: string;
  skills: string[];
  matchScore: number;
}

export interface Team {
  id: string;
  projectId: string;
  projectTitle: string;
  members: TeamMember[];
  maxMembers: number;
  skillsCovered: string[];
  progress: number; // 0-100
  deadline: string;
  updatedAt: string;
}

export interface MatchRecommendation {
  student: Student;
  score: number; // 0-100
  matchingSkills: string[];
  complementarySkills: string[];
  missingSkillsCovered: string[];
  reasons: string[];
}

export interface TeamRequest {
  id: string;
  direction: "received" | "sent";
  studentId: string;
  studentName: string;
  avatarUrl?: string;
  projectId: string;
  projectTitle: string;
  match: number;
  status: RequestStatus;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  linkHref?: string;
}

/** Canonical skill / interest option lists (used by selectors). */
export const SKILL_OPTIONS = [
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Java",
  "JavaScript",
  "TypeScript",
  "PostgreSQL",
  "UI/UX",
  "Figma",
  "Networking",
  "Cybersecurity",
  "Machine Learning",
  "Mobile Development",
  "Testing",
  "Docker",
] as const;

export const INTEREST_OPTIONS = [
  "Web Development",
  "AI",
  "Cybersecurity",
  "IoT",
  "Mobile Apps",
  "Networking",
  "Data Science",
  "Software Engineering",
] as const;

export const AVAILABILITY_OPTIONS: AvailabilitySlot[] = [
  "Weekdays",
  "Weekends",
  "Morning",
  "Afternoon",
  "Evening",
];
