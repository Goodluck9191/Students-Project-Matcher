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
  /** Per-skill proficiency; falls back to Intermediate when absent. */
  skillLevels?: SkillWithLevel[];
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

export type ProjectStatus = "Recruiting" | "Team Complete" | "In Progress" | "Completed";

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
  program: string;
  year?: number;
  maxTeamSize: number;
  currentMembers: number;
  status: ProjectStatus;
  deadline: string; // ISO date
  matchPercentage?: number; // 0-100 relative to viewer
  createdAt: string;
}

export const PROJECT_STATUS_OPTIONS: ProjectStatus[] = [
  "Recruiting",
  "Team Complete",
  "In Progress",
  "Completed",
];

export const PROJECT_CATEGORY_OPTIONS: ProjectCategory[] = [
  "Web Development",
  "AI",
  "Cybersecurity",
  "IoT",
  "Mobile Apps",
  "Networking",
  "Data Science",
  "Software Engineering",
];

export interface TeamMember {
  studentId: string;
  name: string;
  avatarUrl?: string;
  role: string;
  skills: string[];
  matchScore: number;
  /** Enriched from the student profile at render time (IDs link, not copies). */
  program?: string;
  year?: number;
  availability?: string[];
  status?: TeamMemberStatus;
}

export type TeamMemberStatus = "active" | "invited";

export interface Team {
  id: string;
  projectId: string;
  projectTitle: string;
  /** Student id of the team owner (usually the project creator). */
  ownerId: string;
  status: ProjectStatus;
  members: TeamMember[];
  maxMembers: number;
  skillsCovered: string[];
  progress: number; // 0-100
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

/** Assignable team roles — deliberately independent from skills. */
export const TEAM_ROLE_OPTIONS = [
  "Project Lead",
  "Frontend Developer",
  "Backend Developer",
  "Database Developer",
  "UI/UX Designer",
  "Mobile Developer",
  "Tester / QA",
  "Documentation",
  "Researcher",
  "Other",
] as const;

export type TeamRole = (typeof TEAM_ROLE_OPTIONS)[number];

export interface TeamActivityItem {
  id: string;
  teamId: string;
  title: string;
  detail?: string;
  createdAt: string;
}

/** Display-level skill gap state (counts come from the engine's team analysis). */
export interface TeamSkillGap {
  skill: string;
  status: "covered" | "partial" | "missing";
  holders: number;
}

export interface MatchRecommendation {
  student: Student;
  score: number; // 0-100
  tier: MatchTier;
  matchingSkills: string[];
  complementarySkills: string[];
  missingSkillsCovered: string[];
  /** Overlap between project interests and student interests. */
  matchingInterests: string[];
  /** 0-1 overlap between team availability and student availability. */
  availabilityMatch: number;
  /** Weighted 0-1 sub-scores per dimension (Stage 6 model). */
  breakdown: MatchBreakdown;
  reasons: string[];
}

/** 0-1 sub-scores per matching dimension. Weights live in lib/matching/weights. */
export interface MatchBreakdown {
  skill: number;
  interest: number;
  availability: number;
  program: number;
  experience: number;
  year: number;
}

export type MatchTier = "excellent" | "strong" | "good" | "moderate" | "low";

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

/** Recent-activity feed entry (dashboard). Derived from notifications + requests. */
export interface ActivityItem {
  id: string;
  title: string;
  detail?: string;
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

/* ------------------------------------------------------------------ */
/* Stage 3 — extended profile model (additive; existing types above   */
/* are unchanged). Shapes mirror the future Supabase `profiles` table */
/* so mock data can be swapped for queries without touching UI.        */
/* ------------------------------------------------------------------ */

export type SkillProficiency = "Beginner" | "Intermediate" | "Advanced";

export interface SkillWithLevel {
  skill: string;
  level: SkillProficiency;
}

export type WorkStyle = "Online" | "In Person" | "Hybrid";

export type Weekday =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

export type DayTime = "Morning" | "Afternoon" | "Evening" | "Night";

export interface StudentProfile {
  id: string;
  fullName: string;
  avatarUrl?: string;
  bio: string;
  university: string;
  department?: string;
  program: string;
  year: number;
  graduationYear?: string;
  skills: SkillWithLevel[];
  interests: string[];
  availableDays: Weekday[];
  dayTimes: DayTime[];
  workStyle?: WorkStyle;
  availability: AvailabilitySlot[];
  experienceLevel: ExperienceLevel;
  previousExperience?: string;
  profileCompletion: number; // 0-100
  updatedAt: string;
}

export const WEEKDAY_OPTIONS: Weekday[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const DAY_TIME_OPTIONS: DayTime[] = ["Morning", "Afternoon", "Evening", "Night"];

export const WORK_STYLE_OPTIONS: WorkStyle[] = ["Online", "In Person", "Hybrid"];

export const SKILL_LEVEL_OPTIONS: SkillProficiency[] = [
  "Beginner",
  "Intermediate",
  "Advanced",
];

export const PROGRAM_OPTIONS = [
  "Computer Engineering",
  "Computer Science",
  "Information Technology",
  "Software Engineering",
  "Electrical Engineering",
  "Electronics Engineering",
] as const;

/** Full searchable skill catalogue for the SkillSelector (Stage 3). */
export const SKILL_CATALOGUE = [
  "React",
  "Next.js",
  "JavaScript",
  "TypeScript",
  "HTML",
  "CSS",
  "Tailwind CSS",
  "Node.js",
  "Express",
  "Java",
  "Spring Boot",
  "Python",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Supabase",
  "UI/UX",
  "Figma",
  "Git",
  "GitHub",
  "Networking",
  "Cybersecurity",
  "Machine Learning",
  "Data Science",
  "Mobile Development",
  "IoT",
  "Testing",
  "Documentation",
  "Project Management",
] as const;

/** Extended interest catalogue for the InterestSelector (Stage 3). */
export const INTEREST_CATALOGUE = [
  "Web Development",
  "Artificial Intelligence",
  "Machine Learning",
  "Cybersecurity",
  "Networking",
  "IoT",
  "Mobile Development",
  "Cloud Computing",
  "Data Science",
  "Software Engineering",
  "Robotics",
  "Embedded Systems",
  "UI/UX",
  "Entrepreneurship",
  "Open Source",
] as const;
