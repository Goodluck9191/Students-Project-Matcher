"use client";

import { getUnreadMessageCount } from "@/lib/services/chat";

/**
 * Demo-user unread count for a team's chat.
 * Computed synchronously from the session store; remounts and parent
 * re-renders refresh it (matching the mock-mode reactivity model).
 */
export function useChatUnread(teamId: string, userId = "me"): number {
  return getUnreadMessageCount(teamId, userId);
}
