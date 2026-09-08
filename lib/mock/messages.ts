import type { Message } from "@/types";

/**
 * Mock team chat messages — realistic coordination threads.
 * IDs reference teams/students; sender/team info resolves via services.
 * team-health intentionally has no messages (empty-state demo).
 * TODO (Supabase): `team_messages` table via lib/services/chat.ts.
 */

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const hoursAgo = (h: number) => minutesAgo(h * 60);

export const mockMessages: Message[] = [
  // ---- team-asset: University Asset Management System ----
  {
    id: "msg-a1",
    teamId: "team-asset",
    senderId: "john-michael",
    type: "user",
    content: "Hey everyone, should we meet tomorrow at 3 PM to split up the work?",
    createdAt: hoursAgo(26),
  },
  {
    id: "msg-a2",
    teamId: "team-asset",
    senderId: "me",
    type: "user",
    content: "3 PM works for me. We can meet in the library, second floor.",
    createdAt: hoursAgo(25.7),
  },
  {
    id: "msg-a3",
    teamId: "team-asset",
    senderId: "priya-nair",
    type: "user",
    content: "Library works. I'll bring the draft ER diagram so we can finalize the database schema.",
    createdAt: hoursAgo(25.4),
  },
  {
    id: "msg-a4",
    teamId: "team-asset",
    senderId: null,
    type: "system",
    content: "Priya Nair joined the team.",
    createdAt: hoursAgo(25),
  },
  {
    id: "msg-a5",
    teamId: "team-asset",
    senderId: "me",
    type: "user",
    content: "Quick update: the asset list page is done. Filtering by lab still needs backend support — John, can you take that?",
    createdAt: hoursAgo(5),
  },
  {
    id: "msg-a6",
    teamId: "team-asset",
    senderId: "john-michael",
    type: "user",
    content: "On it. I'll expose /api/assets?lab=... today. API docs are here: https://github.com/example/asset-api#readme",
    createdAt: hoursAgo(4.6),
  },
  {
    id: "msg-a7",
    teamId: "team-asset",
    senderId: "priya-nair",
    type: "user",
    content: "Can we jump on a quick call Friday? I put a slot here: https://meet.google.com/abc-defg-hij — 20 minutes max.",
    createdAt: hoursAgo(1.2),
  },
  {
    id: "msg-a8",
    teamId: "team-asset",
    senderId: "me",
    type: "user",
    content: "Friday works. I'll demo the UI progress then.",
    createdAt: minutesAgo(40),
  },
  // ---- team-library: Smart Library Management System ----
  {
    id: "msg-l1",
    teamId: "team-library",
    senderId: "grace-lee",
    type: "user",
    content: "I completed the database schema. Tables for books, seats, and reservations are ready for review.",
    createdAt: hoursAgo(30),
  },
  {
    id: "msg-l2",
    teamId: "team-library",
    senderId: "me",
    type: "user",
    content: "Great work! I'll wire the seat map to it this evening.",
    createdAt: hoursAgo(29.5),
  },
  {
    id: "msg-l3",
    teamId: "team-library",
    senderId: null,
    type: "system",
    content: "Team status changed to In Progress.",
    createdAt: hoursAgo(28),
  },
  {
    id: "msg-l4",
    teamId: "team-library",
    senderId: "priya-nair",
    type: "user",
    content: "Reminder: the supervisor demo is next week. Let's freeze new features by Friday.",
    createdAt: hoursAgo(6),
  },
  // ---- team-expense: Student Expense Budget Assistant ----
  {
    id: "msg-e1",
    teamId: "team-expense",
    senderId: "priya-nair",
    type: "user",
    content: "Welcome aboard! Our goal this sprint: expense entry + monthly summary chart.",
    createdAt: hoursAgo(50),
  },
  {
    id: "msg-e2",
    teamId: "team-expense",
    senderId: "mary-john",
    type: "user",
    content: "Thanks! I'll start with the Figma mockups for the entry form.",
    createdAt: hoursAgo(48),
  },
  {
    id: "msg-e3",
    teamId: "team-expense",
    senderId: null,
    type: "system",
    content: "Mary John was assigned the UI/UX Designer role.",
    createdAt: hoursAgo(24),
  },
  {
    id: "msg-e4",
    teamId: "team-expense",
    senderId: "me",
    type: "user",
    content: "Mockups look good. I'll build the form against the Supabase tables once they're ready.",
    createdAt: hoursAgo(3),
  },
];
