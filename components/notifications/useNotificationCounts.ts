"use client";

import * as React from "react";
import { getUnreadCount } from "@/lib/services/notifications";
import { getReceivedRequests } from "@/lib/services/requests";

/** Live navbar/sidebar counts for the demo user (remount refreshes). */
export function useUnreadCount(userId = "me"): number {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    let cancelled = false;
    getUnreadCount(userId).then((c) => {
      if (!cancelled) setCount(c);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);
  return count;
}

export function usePendingRequestsCount(userId = "me"): number {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    let cancelled = false;
    getReceivedRequests(userId).then((rs) => {
      if (!cancelled) setCount(rs.filter((r) => r.status === "pending").length);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);
  return count;
}
