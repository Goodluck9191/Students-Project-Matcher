"use client";

import * as React from "react";
import { getUnreadMessageCount, getUnreadMessageCountAsync } from "@/lib/services/chat";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Demo-user unread count for a team's chat (remount refreshes). */
export function useChatUnread(teamId: string, userId = "me"): number {
  const [count, setCount] = React.useState(() =>
    isSupabaseConfigured() ? 0 : getUnreadMessageCount(teamId, userId)
  );
  React.useEffect(() => {
    let cancelled = false;
    getUnreadMessageCountAsync(teamId, userId).then((c) => {
      if (!cancelled) setCount(c);
    });
    return () => {
      cancelled = true;
    };
  }, [teamId, userId]);
  return count;
}
