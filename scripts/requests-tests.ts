/**
 * Requests + notifications tests — run with:  npm run test:requests
 * (Plain Node via scripts/ts-resolve-loader.mjs; no test framework.)
 *
 * Verifies invitation flows, guards, team integration, permissions,
 * and event-driven notifications against the session stores.
 */
import {
  acceptRequest,
  cancelRequest,
  getReceivedRequests,
  getSentRequests,
  rejectRequest,
  sendJoinRequest,
  sendTeamInvitation,
} from "../lib/services/requests";
import {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from "../lib/services/notifications";
import { getTeamById } from "../lib/services/teams";

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failed++;
    console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

// Guards (team-asset owned by "me", 3/5, holds pending req-4 → sarah)
{
  const dup = await sendTeamInvitation({ teamId: "team-asset", senderId: "me", recipientId: "sarah-michael" });
  check("Guard — duplicate pending blocked", !dup.ok && dup.error === "DUPLICATE_PENDING");

  const self = await sendTeamInvitation({ teamId: "team-asset", senderId: "me", recipientId: "me" });
  check("Guard — self-invite blocked", !self.ok && self.error === "SELF_INVITE");

  const member = await sendTeamInvitation({ teamId: "team-asset", senderId: "me", recipientId: "john-michael" });
  check("Guard — existing member blocked", !member.ok && member.error === "ALREADY_MEMBER");

  const perm = await sendTeamInvitation({ teamId: "team-asset", senderId: "grace-lee", recipientId: "neema-shayo" });
  check("Guard — non-owner cannot invite", !perm.ok && perm.error === "NOT_OWNER");

  const ghost = await sendTeamInvitation({ teamId: "nope", senderId: "me", recipientId: "neema-shayo" });
  check("Guard — unknown team blocked", !ghost.ok && ghost.error === "TEAM_NOT_FOUND");
}

// Full-team protection (team-library is 3/3 owned by "me")
{
  const full = await sendTeamInvitation({ teamId: "team-library", senderId: "me", recipientId: "neema-shayo" });
  check("Guard — full team blocks invites", !full.ok && full.error === "TEAM_FULL");
}

// Send invitation creates request + recipient notification
{
  const before = await getUnreadCount("neema-shayo");
  const sent = await sendTeamInvitation({
    teamId: "team-asset",
    senderId: "me",
    recipientId: "neema-shayo",
    message: "Join us!",
    match: 80,
  });
  check("Send — invitation created pending", sent.ok && sent.request.status === "pending");
  const after = await getUnreadCount("neema-shayo");
  check("Send — recipient notified", after === before + 1, `${before}→${after}`);
  if (sent.ok) {
    const mine = await getSentRequests("me");
    check("Send — visible in sender outbox", mine.some((r) => r.id === sent.request.id));
    // duplicate now blocked
    const dup2 = await sendTeamInvitation({ teamId: "team-asset", senderId: "me", recipientId: "neema-shayo" });
    check("Send — second invite blocked while pending", !dup2.ok && dup2.error === "DUPLICATE_PENDING");
    // recipient can cancel? no — only sender
    const cancelByRecipient = await cancelRequest(sent.request.id, "neema-shayo");
    check("Cancel — recipient cannot cancel", !cancelByRecipient.ok && cancelByRecipient.error === "NOT_SENDER");
    // sender cancels
    const cancelled = await cancelRequest(sent.request.id, "me");
    check("Cancel — sender cancels pending", cancelled.ok && cancelled.request.status === "cancelled");
    // re-invite allowed after cancel
    const again = await sendTeamInvitation({ teamId: "team-asset", senderId: "me", recipientId: "neema-shayo" });
    check("Send — re-invite allowed after cancel", again.ok);
    if (again.ok) await cancelRequest(again.request.id, "me");
  }
}

// Accept flow: team membership + capacity + notifications (req-3 tom→me, team-iot 1/4)
{
  const teamBefore = await getTeamById("team-iot");
  const accepted = await acceptRequest("req-3", "me");
  check("Accept — succeeds", accepted.ok && accepted.request.status === "accepted");
  const teamAfter = await getTeamById("team-iot");
  check(
    "Accept — member added + capacity updated",
    (teamAfter?.members.length ?? 0) === (teamBefore?.members.length ?? 0) + 1 &&
      (teamAfter?.members.some((m) => m.studentId === "me") ?? false),
    `${teamBefore?.members.length}→${teamAfter?.members.length}`
  );
  const senderInbox = await getNotifications("tom-becker");
  check(
    "Accept — sender notified",
    senderInbox.some((n) => n.type === "invitation_accepted" && n.relatedId === "team-iot")
  );
  const myInbox = await getNotifications("me");
  check(
    "Accept — joiner welcomed",
    myInbox.some((n) => n.type === "team_member_joined" && n.relatedId === "team-iot")
  );
  // double-accept blocked
  const twice = await acceptRequest("req-3", "me");
  check("Accept — already-handled blocked", !twice.ok && twice.error === "NOT_PENDING");
  // stranger cannot accept
  const stranger = await acceptRequest("req-1", "neema-shayo");
  check("Accept — only recipient responds", !stranger.ok && stranger.error === "NOT_RECIPIENT");
}

// Reject flow keeps history + notifies sender (req-1 john→me)
{
  const rejected = await rejectRequest("req-1", "me");
  check("Reject — succeeds, history kept", rejected.ok && rejected.request.status === "rejected");
  const received = await getReceivedRequests("me");
  check("Reject — still listed in received", received.some((r) => r.id === "req-1"));
  const senderInbox = await getNotifications("john-michael");
  check(
    "Reject — sender notified",
    senderInbox.some((n) => n.type === "invitation_rejected")
  );
}

// Join request flow (elias → asset-management owner "me")
{
  const jr = await sendJoinRequest({ projectId: "asset-management", senderId: "elias-mbise" });
  check("Join — request created for owner", jr.ok && jr.request.recipientId === "me", jr.ok ? "" : jr.error);
}

// Notifications: read states + counts
{
  const unreadBefore = await getUnreadCount("me");
  check("Notifications — unread count positive", unreadBefore > 0, `${unreadBefore}`);
  const all = await getNotifications("me");
  const first = all.find((n) => !n.isRead)!;
  const marked = await markAsRead(first.id, "me");
  const unreadAfter = await getUnreadCount("me");
  check("Notifications — mark one as read", marked && unreadAfter === unreadBefore - 1);
  const foreign = await markAsRead(first.id, "neema-shayo");
  check("Notifications — cannot read another user's item", foreign === false);
  const cleared = await markAllAsRead("me");
  check("Notifications — mark all as read", cleared === unreadAfter && (await getUnreadCount("me")) === 0);
  const created = createNotification({ userId: "me", type: "system", title: "T", body: "B" });
  check("Notifications — create works", created.id.length > 0 && !created.isRead);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
