import type { AppNotification, NotificationType } from "@/types";
import { mockNotifications } from "@/lib/mock/notifications";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { mapNotification, type DbNotification } from "@/lib/supabase/mappers";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/notifications";

/**
 * Notification service — session-scoped mock store, or Supabase.
 * Every request/team event funnels through `createNotification`, so the
 * center always reflects real mock events (never decorative).
 *
 * Supabase mode: reads/writes via RLS (own rows only); creation happens
 * server-side through notify_user (see requests flows).
 */

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

const STORE_KEY = "pm.notifications.session.v1";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

let session: AppNotification[] | null = null;

function seed(): AppNotification[] {
  if (isBrowser()) {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppNotification[];
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fall through
    }
  }
  return clone(mockNotifications);
}

function store(): AppNotification[] {
  if (!session) session = seed();
  return session;
}

function persist(): void {
  if (!isBrowser() || !session) return;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(session));
  } catch {
    // ignore — memory still works
  }
}

function byNewest(a: AppNotification, b: AppNotification): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

async function delay(ms = 250): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function listNotificationsDb(): Promise<AppNotification[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error || !data) return [];
  return (data as DbNotification[]).map(mapNotification);
}

export async function getNotifications(userId: string): Promise<AppNotification[]> {
  if (isSupabaseConfigured()) {
    // RLS already scopes to the caller; filter defensively by userId.
    return (await listNotificationsDb()).filter((n) => n.userId === userId);
  }
  await delay();
  return clone(store().filter((n) => n.userId === userId).sort(byNewest));
}

export async function getUnreadCount(userId: string): Promise<number> {
  if (isSupabaseConfigured()) {
    return (await listNotificationsDb()).filter((n) => n.userId === userId && !n.isRead).length;
  }
  await delay(150);
  return store().filter((n) => n.userId === userId && !n.isRead).length;
}

export async function markAsRead(id: string, userId: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const res = await markNotificationReadAction(id);
    return res.ok;
  }
  await delay(150);
  const item = store().find((n) => n.id === id && n.userId === userId);
  if (!item) return false;
  item.isRead = true;
  persist();
  return true;
}

export async function markAllAsRead(userId: string): Promise<number> {
  if (isSupabaseConfigured()) {
    const res = await markAllNotificationsReadAction();
    if (!res.ok) return 0;
    return res.data.count;
  }
  await delay(250);
  let count = 0;
  for (const n of store()) {
    if (n.userId === userId && !n.isRead) {
      n.isRead = true;
      count++;
    }
  }
  persist();
  return count;
}

export interface NewNotification {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkHref?: string;
  relatedId?: string;
}

/**
 * Realtime inbox for one user (Supabase mode only). Caller refreshes on
 * insert; cleanup unsubscribes. No-op in mock mode.
 *
 * NOTE: each call uses a unique channel name. supabase-js reuses cached
 * channels by topic, and calling .on() on an already-subscribed channel
 * throws — unique names make StrictMode remounts safe.
 */
let notificationChannelSeq = 0;

export function subscribeToNotifications(
  userId: string,
  onInsert: (notification: AppNotification) => void
): () => void {
  if (!isSupabaseConfigured()) return () => {};
  const supabase = createClient();
  const channel = supabase
    .channel(`notifications:${userId}:${++notificationChannelSeq}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      (payload) => {
        onInsert(mapNotification(payload.new as DbNotification));
      }
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

export function createNotification(input: NewNotification): AppNotification {
  const item: AppNotification = {
    id: `notif-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`,
    ...input,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  store().unshift(item);
  persist();
  return clone(item);
}
