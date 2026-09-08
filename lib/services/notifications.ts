import type { AppNotification, NotificationType } from "@/types";
import { mockNotifications } from "@/lib/mock/notifications";

/**
 * Notification service — session-scoped mock store.
 * Every request/team event funnels through `createNotification`, so the
 * center always reflects real mock events (never decorative).
 *
 * TODO (Supabase): `notifications` table with RLS (owner-only reads).
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

export async function getNotifications(userId: string): Promise<AppNotification[]> {
  await delay();
  return clone(store().filter((n) => n.userId === userId).sort(byNewest));
}

export async function getUnreadCount(userId: string): Promise<number> {
  await delay(150);
  return store().filter((n) => n.userId === userId && !n.isRead).length;
}

export async function markAsRead(id: string, userId: string): Promise<boolean> {
  await delay(150);
  const item = store().find((n) => n.id === id && n.userId === userId);
  if (!item) return false;
  item.isRead = true;
  persist();
  return true;
}

export async function markAllAsRead(userId: string): Promise<number> {
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
