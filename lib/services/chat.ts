import type { Message, Team } from "@/types";
import { MAX_MESSAGE_LENGTH } from "@/types";
import { mockMessages } from "@/lib/mock/messages";

/**
 * Chat service — session-scoped mock store for team-only messaging.
 *
 * Access rule (single source of truth): only team members may read or
 * write a team's chat. UI pages enforce it via `canAccessChat`.
 *
 * TODO (Supabase): `team_messages` table (id, team_id → teams.id,
 * sender_id → profiles.id, content, message_type, created_at) with RLS
 * (members-only read/insert; own-message delete), plus Realtime
 * subscriptions replacing the polling-free local reads used here.
 */

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

const STORE_KEY = "pm.chat.session.v1";
const LAST_READ_KEY = "pm.chat.lastread.v1";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

let session: Message[] | null = null;

function seed(): Message[] {
  if (isBrowser()) {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Message[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fall through
    }
  }
  return clone(mockMessages);
}

function store(): Message[] {
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

function readLastRead(): Record<string, string> {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(LAST_READ_KEY);
    if (raw) return JSON.parse(raw) as Record<string, string>;
  } catch {
    // ignore
  }
  return {};
}

async function delay(ms = 300): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/* ------------------------------- access ---------------------------------- */

/** Team membership determines access — owners are members, nothing else does. */
export function canAccessChat(
  team: Team | null | undefined,
  userId: string
): boolean {
  if (!team || !userId) return false;
  return team.members.some((m) => m.studentId === userId);
}

/* --------------------------------- reads ---------------------------------- */

export async function getTeamMessages(teamId: string): Promise<Message[]> {
  await delay();
  return clone(
    store()
      .filter((m) => m.teamId === teamId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  );
}

export function getUnreadMessageCount(teamId: string, userId: string): number {
  const lastRead = readLastRead()[teamId];
  const since = lastRead ?? new Date(Date.now() - 48 * 3_600_000).toISOString();
  return store().filter(
    (m) =>
      m.teamId === teamId &&
      m.type === "user" &&
      m.senderId !== userId &&
      m.createdAt > since
  ).length;
}

export function markChatAsRead(teamId: string): void {
  if (!isBrowser()) return;
  try {
    const map = readLastRead();
    map[teamId] = new Date().toISOString();
    window.localStorage.setItem(LAST_READ_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

/* --------------------------------- writes ---------------------------------- */

export type ChatSendError = "EMPTY" | "TOO_LONG" | "DUPLICATE";

export const CHAT_ERROR_MESSAGES: Record<ChatSendError, string> = {
  EMPTY: "Message cannot be empty.",
  TOO_LONG: `Messages are limited to ${MAX_MESSAGE_LENGTH} characters.`,
  DUPLICATE: "This message was just sent — waiting to avoid a duplicate.",
};

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`;
}

export async function sendMessage(
  teamId: string,
  senderId: string,
  content: string
): Promise<{ ok: true; message: Message } | { ok: false; error: ChatSendError }> {
  await delay(250);
  const text = content.trim();
  if (!text) return { ok: false, error: "EMPTY" };
  if (text.length > MAX_MESSAGE_LENGTH) return { ok: false, error: "TOO_LONG" };
  const recent = store().find(
    (m) =>
      m.teamId === teamId &&
      m.senderId === senderId &&
      m.type === "user" &&
      m.content === text &&
      Date.now() - new Date(m.createdAt).getTime() < 10_000
  );
  if (recent) return { ok: false, error: "DUPLICATE" };

  const message: Message = {
    id: newId("msg"),
    teamId,
    senderId,
    type: "user",
    content: text,
    createdAt: new Date().toISOString(),
  };
  store().push(message);
  persist();
  return { ok: true, message: clone(message) };
}

export type ChatDeleteError = "NOT_FOUND" | "FORBIDDEN";

export async function deleteMessage(
  messageId: string,
  userId: string
): Promise<{ ok: true } | { ok: false; error: ChatDeleteError }> {
  await delay(250);
  const list = store();
  const idx = list.findIndex((m) => m.id === messageId);
  if (idx < 0) return { ok: false, error: "NOT_FOUND" };
  const target = list[idx];
  // Only the author's own user messages — never system messages or others'.
  if (target.type !== "user" || target.senderId !== userId)
    return { ok: false, error: "FORBIDDEN" };
  list.splice(idx, 1);
  persist();
  return { ok: true };
}

/**
 * Append a team-event system message (called by the teams service when
 * membership/roles/status change — keeps chat in sync without UI edits).
 */
export function postSystemMessage(teamId: string, content: string): Message {
  const message: Message = {
    id: newId("sys"),
    teamId,
    senderId: null,
    type: "system",
    content,
    createdAt: new Date().toISOString(),
  };
  store().push(message);
  persist();
  return clone(message);
}

/* --------------------------- pure view helpers ---------------------------- */

export interface MessageDayGroup {
  key: string;
  label: string;
  messages: Message[];
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function dayLabel(iso: string, now: Date = new Date()): string {
  const day = startOfDay(new Date(iso)).getTime();
  const today = startOfDay(now).getTime();
  const diffDays = Math.round((today - day) / 86_400_000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

export function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Group ascending messages under Today / Yesterday / date separators. */
export function groupMessagesByDay(messages: Message[], now: Date = new Date()): MessageDayGroup[] {
  const groups: MessageDayGroup[] = [];
  for (const m of messages) {
    const key = startOfDay(new Date(m.createdAt)).toISOString();
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.messages.push(m);
    else groups.push({ key, label: dayLabel(m.createdAt, now), messages: [m] });
  }
  return groups;
}

export interface TextSegment {
  text: string;
  url?: string;
}

const URL_RE = /(https?:\/\/[^\s<>"')\]]+)/g;

/** Split text into plain/link segments (basic, safe: http/https only). */
export function linkifySegments(content: string): TextSegment[] {
  const out: TextSegment[] = [];
  let last = 0;
  for (const match of content.matchAll(URL_RE)) {
    const index = match.index ?? 0;
    if (index > last) out.push({ text: content.slice(last, index) });
    const url = match[0];
    // Trim trailing punctuation that is rarely part of a URL.
    const trimmed = url.replace(/[.,;:!?]+$/, "");
    out.push({ text: trimmed, url: trimmed });
    if (trimmed.length < url.length) out.push({ text: url.slice(trimmed.length) });
    last = index + url.length;
  }
  if (last < content.length) out.push({ text: content.slice(last) });
  return out;
}
