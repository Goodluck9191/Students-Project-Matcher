import type { AppNotification } from "@/types";

/**
 * Mock notifications — Stage 8 event-driven dataset.
 * userId scopes ownership (future RLS); relatedId deep-links.
 * TODO (Supabase): `notifications` table via lib/services/notifications.ts.
 */

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const hoursAgo = (h: number) => minutesAgo(h * 60);

export const mockNotifications: AppNotification[] = [
  {
    id: "notif-1",
    userId: "me",
    type: "team_invitation",
    title: "New team invitation",
    body: "Tom Becker invited you to join IoT Campus Weather Station.",
    isRead: false,
    createdAt: minutesAgo(10),
    linkHref: "/requests",
    relatedId: "req-3",
  },
  {
    id: "notif-2",
    userId: "me",
    type: "match",
    title: "Your project has a new match",
    body: "Sarah Michael (94%) matches University Asset Management System.",
    isRead: false,
    createdAt: hoursAgo(2),
    linkHref: "/matches",
    relatedId: "asset-management",
  },
  {
    id: "notif-3",
    userId: "me",
    type: "invitation_accepted",
    title: "Invitation accepted",
    body: "David Kim accepted your invitation to join University Asset Management System.",
    isRead: false,
    createdAt: hoursAgo(2.5),
    linkHref: "/teams/team-asset",
    relatedId: "team-asset",
  },
  {
    id: "notif-4",
    userId: "me",
    type: "invitation_rejected",
    title: "Invitation declined",
    body: "Neema Shayo declined your invitation to join University Asset Management System.",
    isRead: false,
    createdAt: hoursAgo(6),
    linkHref: "/requests",
    relatedId: "req-6",
  },
  {
    id: "notif-5",
    userId: "me",
    type: "team_member_joined",
    title: "New team member",
    body: "Mary John joined Student Expense Budget Assistant.",
    isRead: true,
    createdAt: hoursAgo(26),
    linkHref: "/teams/team-expense",
    relatedId: "team-expense",
  },
  {
    id: "notif-6",
    userId: "me",
    type: "team_full",
    title: "Team complete",
    body: "Smart Library Management System has reached its maximum number of members.",
    isRead: true,
    createdAt: hoursAgo(49),
    linkHref: "/teams/team-library",
    relatedId: "team-library",
  },
  {
    id: "notif-7",
    userId: "me",
    type: "system",
    title: "Matching improved",
    body: "Your profile is 80% complete — add availability for better recommendations.",
    isRead: true,
    createdAt: hoursAgo(120),
    linkHref: "/profile/setup",
  },
];
