"use client";

import * as React from "react";
import { getUnreadCount, subscribeToNotifications } from "@/lib/services/notifications";
import { getReceivedRequests, subscribeToRequests } from "@/lib/services/requests";
import { getSessionIdentity } from "@/lib/services/session";

function useResolvedUserId(userId?: string): string | null {
  const [resolvedId, setResolvedId] = React.useState<string | null>(userId ?? null);
  React.useEffect(() => {
    if (userId) return;
    let cancelled = false;
    getSessionIdentity().then((identity) => {
      if (!cancelled) setResolvedId(identity.id);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);
  return resolvedId;
}

/** Live navbar/sidebar counts for the current user (remount + realtime refresh). */
export function useUnreadCount(userId?: string): number {
  const resolvedId = useResolvedUserId(userId);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!resolvedId) return;
    let cancelled = false;
    getUnreadCount(resolvedId).then((c) => {
      if (!cancelled) setCount(c);
    });
    const unsubscribe = subscribeToNotifications(resolvedId, () => {
      getUnreadCount(resolvedId).then((c) => {
        if (!cancelled) setCount(c);
      });
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [resolvedId]);
  return count;
}

export function usePendingRequestsCount(userId?: string): number {
  const resolvedId = useResolvedUserId(userId);
  const [count, setCount] = React.useState(0);

  const refresh = React.useCallback((id: string) => {
    getReceivedRequests(id).then((rs) => {
      setCount(rs.filter((r) => r.status === "pending").length);
    });
  }, []);

  React.useEffect(() => {
    if (!resolvedId) return;
    refresh(resolvedId);
    return subscribeToRequests(resolvedId, () => refresh(resolvedId));
  }, [resolvedId, refresh]);
  return count;
}
