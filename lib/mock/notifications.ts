import type { AppNotification } from "@/types";

/** TODO (Supabase): replace with `from("notifications").select(...)` */

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const hoursAgo = (h: number) => minutesAgo(h * 60);

export const mockNotifications: AppNotification[] = [
  {
    id: "notif-1",
    type: "invitation",
    title: "You received a team invitation",
    body: "Tom Becker invited you to join IoT Campus Weather Station.",
    isRead: false,
    createdAt: minutesAgo(10),
    linkHref: "/requests",
  },
  {
    id: "notif-2",
    type: "match",
    title: "Your project has a new match",
    body: "Sarah Michael (94%) matches University Asset Management System.",
    isRead: false,
    createdAt: hoursAgo(2),
    linkHref: "/matches",
  },
  {
    id: "notif-3",
    type: "request_accepted",
    title: "Sarah accepted your invitation",
    body: "Sarah Michael joined University Asset Management System.",
    isRead: false,
    createdAt: hoursAgo(2.5),
    linkHref: "/teams",
  },
  {
    id: "notif-4",
    type: "project",
    title: "New project matches your profile",
    body: "Study Buddy Finder (88%) needs React and TypeScript.",
    isRead: true,
    createdAt: hoursAgo(5),
    linkHref: "/projects",
  },
  {
    id: "notif-5",
    type: "team_added",
    title: "You have been added to a team",
    body: "You joined Smart Library Management System as Frontend.",
    isRead: true,
    createdAt: hoursAgo(26),
    linkHref: "/teams",
  },
];
