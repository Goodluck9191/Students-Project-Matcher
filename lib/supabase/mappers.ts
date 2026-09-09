import type {
  AppNotification,
  Message,
  Project,
  ProjectStatus,
  Student,
  Team,
  TeamMember,
  TeamRequest,
} from "@/types";

/**
 * PostgreSQL row → application type mappers (Stage 11).
 * DB uses snake_case + lowercase statuses; the app uses camelCase +
 * display statuses. All conversions live here — nowhere else.
 */

// Raw row shapes (loose on purpose: Supabase returns `any`-ish JSON).
export interface DbProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  academic_program: string | null;
  year: number | null;
  bio: string | null;
  experience_level: string | null;
  skills: unknown;
  interests: unknown;
  availability: unknown;
  role: string | null;
  is_active: boolean | null;
  profile_completed: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface DbProject {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  category: string | null;
  required_team_size: number;
  required_skills: unknown;
  deadline: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DbTeam {
  id: string;
  project_id: string;
  owner_id: string;
  name: string | null;
  status: string;
  progress: number | null;
  created_at: string;
  updated_at: string;
}

export interface DbTeamMember {
  id: string;
  team_id: string;
  user_id: string;
  team_role: string;
  project_role: string | null;
  joined_at: string;
}

export interface DbTeamRequest {
  id: string;
  project_id: string;
  team_id: string;
  sender_id: string;
  recipient_id: string;
  type: string;
  status: string;
  message: string | null;
  created_at: string;
  responded_at: string | null;
}

export interface DbNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  read: boolean | null;
  created_at: string;
  action_url: string | null;
  related_id: string | null;
}

export interface DbTeamMessage {
  id: string;
  team_id: string;
  sender_id: string | null;
  content: string;
  message_type: string | null;
  created_at: string;
}

const DB_PROJECT_STATUS: Record<string, ProjectStatus> = {
  draft: "Recruiting",
  recruiting: "Recruiting",
  in_progress: "In Progress",
  completed: "Completed",
  archived: "Archived",
};

const DB_TEAM_STATUS: Record<string, ProjectStatus> = {
  recruiting: "Recruiting",
  team_complete: "Team Complete",
  in_progress: "In Progress",
  completed: "Completed",
};

const APP_PROJECT_STATUS: Record<string, string> = {
  Recruiting: "recruiting",
  "Team Complete": "team_complete",
  "In Progress": "in_progress",
  Completed: "completed",
  Archived: "archived",
};

export function toAppProjectStatus(db: string): ProjectStatus {
  return DB_PROJECT_STATUS[db] ?? "Recruiting";
}

export function toAppTeamStatus(db: string): ProjectStatus {
  return DB_TEAM_STATUS[db] ?? "Recruiting";
}

export function toDbStatus(app: ProjectStatus): string {
  return APP_PROJECT_STATUS[app] ?? "recruiting";
}

function strArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export function mapProfile(row: DbProfile): Student & { role: string; isActive: boolean; email: string } {
  return {
    id: row.id,
    fullName: row.full_name ?? "",
    avatarUrl: row.avatar_url ?? undefined,
    university: "",
    program: row.academic_program ?? "",
    year: row.year ?? 1,
    bio: row.bio ?? "",
    skills: strArray(row.skills),
    interests: strArray(row.interests),
    availability: strArray(row.availability) as Student["availability"],
    experienceLevel: (row.experience_level as Student["experienceLevel"]) ?? "Beginner",
    profileCompletion: row.profile_completed ? 100 : 40,
    createdAt: row.created_at,
    role: row.role ?? "student",
    isActive: row.is_active ?? true,
    email: row.email ?? "",
  };
}

export function mapProject(row: DbProject, creatorName: string, memberCount: number): Project {
  return {
    id: row.id,
    title: row.name,
    description: row.description ?? "",
    category: (row.category as Project["category"]) ?? "Web Development",
    projectType: "Coursework",
    creatorId: row.creator_id,
    creatorName,
    requiredSkills: strArray(row.required_skills),
    interests: [],
    program: "",
    maxTeamSize: row.required_team_size,
    currentMembers: memberCount,
    status: toAppProjectStatus(row.status),
    deadline: row.deadline ?? row.created_at,
    createdAt: row.created_at,
  };
}

export function mapTeam(row: DbTeam, members: TeamMember[], projectTitle: string): Team {
  return {
    id: row.id,
    projectId: row.project_id,
    projectTitle,
    ownerId: row.owner_id,
    status: toAppTeamStatus(row.status),
    members,
    maxMembers: 0, // filled by caller from project.required_team_size
    skillsCovered: [...new Set(members.flatMap((m) => m.skills))].slice(0, 6),
    progress: row.progress ?? 0,
    deadline: row.updated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTeamMember(row: DbTeamMember, name: string, matchScore = 75): TeamMember {
  return {
    studentId: row.user_id,
    name,
    role: row.project_role ?? (row.team_role === "owner" ? "Project Lead" : "Member"),
    skills: [],
    matchScore,
    status: "active",
  };
}

export function mapTeamRequest(row: DbTeamRequest): TeamRequest {
  return {
    id: row.id,
    projectId: row.project_id,
    teamId: row.team_id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    type: row.type === "join_request" ? "join_request" : "invitation",
    status: (["pending", "accepted", "rejected", "cancelled"] as const).includes(
      row.status as TeamRequest["status"]
    )
      ? (row.status as TeamRequest["status"])
      : "pending",
    message: row.message ?? undefined,
    createdAt: row.created_at,
    respondedAt: row.responded_at ?? undefined,
  };
}

export function mapNotification(row: DbNotification): AppNotification {
  return {
    id: row.id,
    userId: row.user_id,
    type: (row.type as AppNotification["type"]) ?? "system",
    title: row.title,
    body: row.message ?? "",
    isRead: row.read ?? false,
    createdAt: row.created_at,
    linkHref: row.action_url ?? undefined,
    relatedId: row.related_id ?? undefined,
  };
}

export function mapTeamMessage(row: DbTeamMessage): Message {
  return {
    id: row.id,
    teamId: row.team_id,
    senderId: row.sender_id,
    type: row.message_type === "system" ? "system" : "user",
    content: row.content,
    createdAt: row.created_at,
  };
}
