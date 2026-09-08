import type { Project, Student, Team, TeamRequest, TeamRequestStatus } from "@/types";
import { mockRequests } from "@/lib/mock/requests";
import { addTeamMember, getTeamById, getTeamForProject, isTeamFull } from "./teams";
import { getProjectById } from "./projects";
import { getStudentById } from "./students";
import { createNotification } from "./notifications";

/**
 * Request service — invitations + join requests over a session-scoped store.
 *
 * Centralized flow (single place keeping teams/requests/notifications
 * consistent — UI never edits multiple stores by hand):
 *
 *   sendTeamInvitation() → createNotification(recipient)
 *   acceptRequest() → addTeamMember() → status → createNotification(other party)
 *   rejectRequest() / cancelRequest() → status → notify sender (reject only)
 *
 * TODO (Supabase): `team_requests` table with RLS (participants only).
 */

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

const STORE_KEY = "pm.requests.session.v1";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

let session: TeamRequest[] | null = null;

function seed(): TeamRequest[] {
  if (isBrowser()) {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as TeamRequest[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fall through
    }
  }
  return clone(mockRequests);
}

function store(): TeamRequest[] {
  if (!session) session = seed();
  return session;
}

function persist(): void {
  if (!isBrowser() || !session) return;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

function byNewest(a: TeamRequest, b: TeamRequest): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

async function delay(ms = 350): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export type RequestError =
  | "TEAM_NOT_FOUND"
  | "PROJECT_NOT_FOUND"
  | "RECIPIENT_NOT_FOUND"
  | "NOT_OWNER"
  | "SELF_INVITE"
  | "ALREADY_MEMBER"
  | "TEAM_FULL"
  | "DUPLICATE_PENDING"
  | "REQUEST_NOT_FOUND"
  | "NOT_PENDING"
  | "NOT_PARTICIPANT"
  | "NOT_SENDER"
  | "NOT_RECIPIENT";

export const REQUEST_ERROR_MESSAGES: Record<RequestError, string> = {
  TEAM_NOT_FOUND: "This team no longer exists.",
  PROJECT_NOT_FOUND: "This project no longer exists.",
  RECIPIENT_NOT_FOUND: "This student could not be found.",
  NOT_OWNER: "Only the team owner can send invitations.",
  SELF_INVITE: "You cannot invite yourself to a team.",
  ALREADY_MEMBER: "This student is already a member of your team.",
  TEAM_FULL: "Your team is already full.",
  DUPLICATE_PENDING: "An invitation is already pending for this student.",
  REQUEST_NOT_FOUND: "This request no longer exists.",
  NOT_PENDING: "This request has already been handled.",
  NOT_PARTICIPANT: "You are not part of this request.",
  NOT_SENDER: "Only the sender can cancel this request.",
  NOT_RECIPIENT: "Only the recipient can respond to this request.",
};

type Result<T> = { ok: true; request: T } | { ok: false; error: RequestError };

export async function getReceivedRequests(userId: string): Promise<TeamRequest[]> {
  await delay(200);
  return clone(store().filter((r) => r.recipientId === userId).sort(byNewest));
}

export async function getSentRequests(userId: string): Promise<TeamRequest[]> {
  await delay(200);
  return clone(store().filter((r) => r.senderId === userId).sort(byNewest));
}

export async function getRequestById(id: string): Promise<TeamRequest | null> {
  await delay(150);
  return clone(store().find((r) => r.id === id) ?? null);
}

/** Admin view: every request in the session store, newest first. */
export async function listAllRequests(): Promise<TeamRequest[]> {
  await delay(200);
  return clone([...store()].sort(byNewest));
}

/** Pending request between a team and a student (either direction). */
export function findPendingRequest(teamId: string, studentId: string): TeamRequest | undefined {
  return store().find(
    (r) =>
      r.teamId === teamId &&
      r.status === "pending" &&
      (r.recipientId === studentId || r.senderId === studentId)
  );
}

/** Pending request from a user for a project (join-request state on project page). */
export function findUserProjectRequest(
  projectId: string,
  userId: string
): TeamRequest | undefined {
  return store().find(
    (r) => r.projectId === projectId && r.status === "pending" && (r.senderId === userId || r.recipientId === userId)
  );
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`;
}

export async function sendTeamInvitation(args: {
  teamId: string;
  senderId: string;
  recipientId: string;
  message?: string;
  match?: number;
}): Promise<Result<TeamRequest>> {
  await delay();
  const team = await getTeamById(args.teamId);
  if (!team) return { ok: false, error: "TEAM_NOT_FOUND" };
  const project = await getProjectById(team.projectId);
  if (!project) return { ok: false, error: "PROJECT_NOT_FOUND" };
  const recipient = await getStudentById(args.recipientId);
  if (!recipient) return { ok: false, error: "RECIPIENT_NOT_FOUND" };
  if (team.ownerId !== args.senderId) return { ok: false, error: "NOT_OWNER" };
  if (args.senderId === args.recipientId) return { ok: false, error: "SELF_INVITE" };
  if (team.members.some((m) => m.studentId === args.recipientId))
    return { ok: false, error: "ALREADY_MEMBER" };
  if (isTeamFull(team)) return { ok: false, error: "TEAM_FULL" };
  if (findPendingRequest(team.id, args.recipientId))
    return { ok: false, error: "DUPLICATE_PENDING" };

  const sender = await getStudentById(args.senderId);
  const request: TeamRequest = {
    id: newId("req"),
    projectId: team.projectId,
    teamId: team.id,
    senderId: args.senderId,
    recipientId: args.recipientId,
    type: "invitation",
    status: "pending",
    message: args.message?.trim() || undefined,
    match: args.match,
    createdAt: new Date().toISOString(),
  };
  store().unshift(request);
  persist();

  createNotification({
    userId: args.recipientId,
    type: "team_invitation",
    title: "New team invitation",
    body: `${sender?.fullName ?? "A student"} invited you to join ${team.projectTitle}.`,
    linkHref: "/requests",
    relatedId: request.id,
  });
  return { ok: true, request: clone(request) };
}

export async function sendJoinRequest(args: {
  projectId: string;
  senderId: string;
  message?: string;
}): Promise<Result<TeamRequest>> {
  await delay();
  const project = await getProjectById(args.projectId);
  if (!project) return { ok: false, error: "PROJECT_NOT_FOUND" };
  const team = await getTeamForProject(args.projectId);
  if (!team) return { ok: false, error: "TEAM_NOT_FOUND" };
  if (team.members.some((m) => m.studentId === args.senderId))
    return { ok: false, error: "ALREADY_MEMBER" };
  if (isTeamFull(team)) return { ok: false, error: "TEAM_FULL" };
  if (findPendingRequest(team.id, args.senderId))
    return { ok: false, error: "DUPLICATE_PENDING" };

  const sender = await getStudentById(args.senderId);
  const request: TeamRequest = {
    id: newId("req"),
    projectId: team.projectId,
    teamId: team.id,
    senderId: args.senderId,
    recipientId: team.ownerId,
    type: "join_request",
    status: "pending",
    message: args.message?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  store().unshift(request);
  persist();

  createNotification({
    userId: team.ownerId,
    type: "team_invitation",
    title: "New join request",
    body: `${sender?.fullName ?? "A student"} requested to join ${team.projectTitle}.`,
    linkHref: "/requests",
    relatedId: request.id,
  });
  return { ok: true, request: clone(request) };
}

function setStatus(request: TeamRequest, status: TeamRequestStatus): void {
  request.status = status;
  request.respondedAt = new Date().toISOString();
  persist();
}

export async function acceptRequest(
  id: string,
  actorId: string
): Promise<Result<TeamRequest>> {
  await delay(450);
  const request = store().find((r) => r.id === id);
  if (!request) return { ok: false, error: "REQUEST_NOT_FOUND" };
  if (request.status !== "pending") return { ok: false, error: "NOT_PENDING" };
  if (request.recipientId !== actorId) return { ok: false, error: "NOT_RECIPIENT" };

  const team = await getTeamById(request.teamId);
  if (!team) return { ok: false, error: "TEAM_NOT_FOUND" };

  // Invitation → recipient joins; join request → sender joins.
  const joinerId =
    request.type === "invitation" ? request.recipientId : request.senderId;
  const joiner = await getStudentById(joinerId);
  if (!joiner) return { ok: false, error: "RECIPIENT_NOT_FOUND" };

  const added = await addTeamMember(request.teamId, {
    studentId: joiner.id,
    name: joiner.fullName,
    role: "Member",
    skills: joiner.skills.slice(0, 3),
    matchScore: request.match ?? 75,
  });
  if (!added.ok) {
    return {
      ok: false,
      error: added.error === "TEAM_FULL" ? "TEAM_FULL" : "ALREADY_MEMBER",
    };
  }

  setStatus(request, "accepted");
  const updatedTeam = added.team;
  const otherId = request.type === "invitation" ? request.senderId : request.recipientId;

  createNotification({
    userId: otherId,
    type: "invitation_accepted",
    title:
      request.type === "invitation" ? "Invitation accepted" : "Join request approved",
    body: `${joiner.fullName} joined ${updatedTeam.projectTitle}.`,
    linkHref: `/teams/${updatedTeam.id}`,
    relatedId: updatedTeam.id,
  });
  createNotification({
    userId: joinerId,
    type: "team_member_joined",
    title: "You're now a team member",
    body: `Welcome to ${updatedTeam.projectTitle}!`,
    linkHref: `/teams/${updatedTeam.id}`,
    relatedId: updatedTeam.id,
  });
  if (updatedTeam.status === "Team Complete") {
    createNotification({
      userId: updatedTeam.ownerId,
      type: "team_full",
      title: "Team complete",
      body: `${updatedTeam.projectTitle} has reached its maximum number of members.`,
      linkHref: `/teams/${updatedTeam.id}`,
      relatedId: updatedTeam.id,
    });
  }
  return { ok: true, request: clone(request) };
}

export async function rejectRequest(
  id: string,
  actorId: string
): Promise<Result<TeamRequest>> {
  await delay(400);
  const request = store().find((r) => r.id === id);
  if (!request) return { ok: false, error: "REQUEST_NOT_FOUND" };
  if (request.status !== "pending") return { ok: false, error: "NOT_PENDING" };
  if (request.recipientId !== actorId) return { ok: false, error: "NOT_RECIPIENT" };

  setStatus(request, "rejected");
  const team = await getTeamById(request.teamId);
  const actor = await getStudentById(actorId);
  createNotification({
    userId: request.senderId,
    type: "invitation_rejected",
    title: "Invitation declined",
    body: `${actor?.fullName ?? "The student"} declined your invitation to join ${team?.projectTitle ?? "the project"}.`,
    linkHref: "/requests",
    relatedId: request.id,
  });
  return { ok: true, request: clone(request) };
}

export async function cancelRequest(
  id: string,
  actorId: string
): Promise<Result<TeamRequest>> {
  await delay(400);
  const request = store().find((r) => r.id === id);
  if (!request) return { ok: false, error: "REQUEST_NOT_FOUND" };
  if (request.status !== "pending") return { ok: false, error: "NOT_PENDING" };
  if (request.senderId !== actorId) {
    if (request.recipientId !== actorId) return { ok: false, error: "NOT_PARTICIPANT" };
    return { ok: false, error: "NOT_SENDER" };
  }
  setStatus(request, "cancelled");
  return { ok: true, request: clone(request) };
}

/* ------------------------------- enrichment ------------------------------ */

/**
 * Resolve IDs to display data (single lookup pass — UI never joins stores).
 * `viewerId` decides who the "counterpart" is.
 */
export interface EnrichedRequest {
  request: TeamRequest;
  counterpart?: Student;
  projectTitle: string;
  teamTitle: string;
  teamCount: string;
}

export function enrichRequests(
  requests: TeamRequest[],
  students: Student[],
  projects: Project[],
  teams: Team[],
  viewerId: string
): EnrichedRequest[] {
  const studentById = new Map(students.map((s) => [s.id, s]));
  const projectById = new Map(projects.map((p) => [p.id, p]));
  const teamById = new Map(teams.map((t) => [t.id, t]));
  // The demo user is always resolvable even when absent from the list.
  if (!studentById.has("me")) {
    studentById.set("me", {
      id: "me",
      fullName: "Alex Morgan",
      university: "",
      program: "Computer Science",
      year: 2,
      bio: "",
      skills: [],
      interests: [],
      availability: [],
      experienceLevel: "Intermediate",
      profileCompletion: 80,
      createdAt: new Date().toISOString(),
    });
  }
  return requests.map((request) => {
    const counterpartId =
      request.recipientId === viewerId ? request.senderId : request.recipientId;
    const team = teamById.get(request.teamId);
    return {
      request,
      counterpart: studentById.get(counterpartId),
      projectTitle: projectById.get(request.projectId)?.title ?? "Project",
      teamTitle: team?.projectTitle ?? projectById.get(request.projectId)?.title ?? "Team",
      teamCount: team ? `${team.members.length} / ${team.maxMembers}` : "",
    };
  });
}
