import type { TeamRequest } from "@/types";

/**
 * Mock requests — Stage 8 ID-based dataset.
 * IDs reference students/projects/teams; names resolve via services.
 * TODO (Supabase): `team_requests` table via lib/services/requests.ts.
 */

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

export const mockRequests: TeamRequest[] = [
  {
    id: "req-1",
    projectId: "asset-management",
    teamId: "team-asset",
    senderId: "john-michael",
    recipientId: "me",
    type: "join_request",
    status: "pending",
    message: "I'd like to bring my backend experience to this project.",
    match: 91,
    createdAt: hoursAgo(26),
  },
  {
    id: "req-2",
    projectId: "asset-management",
    teamId: "team-asset",
    senderId: "grace-lee",
    recipientId: "me",
    type: "join_request",
    status: "pending",
    message: "I'd love to help with testing and documentation.",
    match: 78,
    createdAt: hoursAgo(7),
  },
  {
    id: "req-3",
    projectId: "iot-weather",
    teamId: "team-iot",
    senderId: "tom-becker",
    recipientId: "me",
    type: "invitation",
    status: "pending",
    message: "Your React skills would be perfect for our sensor dashboard.",
    match: 66,
    createdAt: hoursAgo(3),
  },
  {
    id: "req-4",
    projectId: "asset-management",
    teamId: "team-asset",
    senderId: "me",
    recipientId: "sarah-michael",
    type: "invitation",
    status: "pending",
    message: "Hi Sarah, we'd like you to join our project team — your UI/UX skills would fill our biggest gap.",
    match: 94,
    createdAt: hoursAgo(30),
  },
  {
    id: "req-5",
    projectId: "asset-management",
    teamId: "team-asset",
    senderId: "me",
    recipientId: "david-kim",
    type: "invitation",
    status: "accepted",
    message: "We could use your data experience for the reporting module.",
    match: 72,
    createdAt: hoursAgo(50),
    respondedAt: hoursAgo(26),
  },
  {
    id: "req-6",
    projectId: "asset-management",
    teamId: "team-asset",
    senderId: "me",
    recipientId: "neema-shayo",
    type: "invitation",
    status: "rejected",
    match: 79,
    createdAt: hoursAgo(74),
    respondedAt: hoursAgo(50),
  },
  {
    id: "req-7",
    projectId: "asset-management",
    teamId: "team-asset",
    senderId: "me",
    recipientId: "samwel-kessy",
    type: "invitation",
    status: "cancelled",
    match: 73,
    createdAt: hoursAgo(100),
    respondedAt: hoursAgo(90),
  },
];
