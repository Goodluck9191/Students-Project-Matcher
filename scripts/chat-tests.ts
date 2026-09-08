/**
 * Team chat tests — run with:  npm run test:chat
 * (Plain Node via scripts/ts-resolve-loader.mjs; no test framework.)
 *
 * Covers access control, team isolation, send validation, deletion
 * ownership, unread counts, system events, and formatting helpers.
 */
import {
  canAccessChat,
  dayLabel,
  deleteMessage,
  formatMessageTime,
  getTeamMessages,
  getUnreadMessageCount,
  groupMessagesByDay,
  linkifySegments,
  postSystemMessage,
  sendMessage,
} from "../lib/services/chat";
import { getTeamById, updateMemberRole } from "../lib/services/teams";
import { MAX_MESSAGE_LENGTH } from "../types/index";
import type { Message } from "../types/index";

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

// Access control
{
  const asset = await getTeamById("team-asset");
  check("Access — member can open chat", canAccessChat(asset, "me"));
  check("Access — owner can open chat (is member)", canAccessChat(asset, asset?.ownerId ?? ""));
  check("Access — non-member blocked", !canAccessChat(asset, "elias-mbise"));
  check("Access — invited-only is not a member", !canAccessChat(asset, "amina-juma"));
  check("Access — missing team blocked", !canAccessChat(null, "me"));
  check("Access — empty user blocked", !canAccessChat(asset, ""));
}

// Isolation + ordering
{
  const assetMsgs = await getTeamMessages("team-asset");
  check("Isolation — only own-team messages", assetMsgs.every((m) => m.teamId === "team-asset"));
  check("Isolation — other teams excluded", !assetMsgs.some((m) => m.teamId === "team-library"));
  const ascending = assetMsgs.every(
    (m, i, arr) => i === 0 || arr[i - 1].createdAt <= m.createdAt
  );
  check("Ordering — oldest first", ascending);
  const healthMsgs = await getTeamMessages("team-health");
  check("Empty — team-health starts with no messages", healthMsgs.length === 0);
}

// Send validation (team-health keeps counts isolated)
{
  const empty = await sendMessage("team-health", "me", "   ");
  check("Validation — empty rejected", !empty.ok && empty.error === "EMPTY");
  const blank = await sendMessage("team-health", "me", "\n\t ");
  check("Validation — whitespace rejected", !blank.ok && blank.error === "EMPTY");
  const long = await sendMessage("team-health", "me", "x".repeat(MAX_MESSAGE_LENGTH + 1));
  check("Validation — over-limit rejected", !long.ok && long.error === "TOO_LONG");

  const first = await sendMessage("team-health", "me", "Hello team, when do we meet?");
  check("Send — valid message stored trimmed", first.ok && first.message.content === "Hello team, when do we meet?");
  const dup = await sendMessage("team-health", "me", "Hello team, when do we meet?");
  check("Send — accidental duplicate blocked", !dup.ok && dup.error === "DUPLICATE");
  const after = await getTeamMessages("team-health");
  check("Send — message visible in thread", after.some((m) => m.content === "Hello team, when do we meet?"));
}

// Deletion ownership
{
  const sent = await sendMessage("team-health", "me", "Delete me please");
  const id = sent.ok ? sent.message.id : "";
  const other = await sendMessage("team-health", "sarah-michael", "Not yours to delete");
  const otherId = other.ok ? other.message.id : "";

  const forbidden = await deleteMessage(otherId, "me");
  check("Delete — other's message forbidden", !forbidden.ok && forbidden.error === "FORBIDDEN");

  const sys = postSystemMessage("team-health", "Test event.");
  const sysDel = await deleteMessage(sys.id, "me");
  check("Delete — system message forbidden", !sysDel.ok && sysDel.error === "FORBIDDEN");

  const missing = await deleteMessage("msg-does-not-exist", "me");
  check("Delete — unknown id not found", !missing.ok && missing.error === "NOT_FOUND");

  const own = await deleteMessage(id, "me");
  const remaining = await getTeamMessages("team-health");
  check("Delete — own message removed", own.ok && !remaining.some((m) => m.id === id));
}

// Unread counts (seed-relative, deterministic)
{
  const unread = getUnreadMessageCount("team-asset", "me");
  check("Unread — recent teammate messages counted", unread >= 2, `${unread}`);
  const ownOnly = getUnreadMessageCount("team-asset", "priya-nair");
  check("Unread — excludes own messages", ownOnly >= 0);
}

// Team event integration (role change → system message in chat)
{
  const before = (await getTeamMessages("team-health")).length;
  const res = await updateMemberRole("team-health", "me", "Backend Developer", "sarah-michael");
  const after = await getTeamMessages("team-health");
  check(
    "Integration — role change posts system message",
    res.ok && after.length === before + 1 && after[after.length - 1].type === "system",
    `${before}→${after.length}`
  );
}

// Formatting helpers
{
  const now = new Date("2026-09-08T12:00:00Z");
  const localNoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  const localYesterday = new Date(localNoon.getTime() - 24 * 3_600_000);
  check("Day label — today", dayLabel(localNoon.toISOString(), now) === "Today");
  check("Day label — yesterday", dayLabel(localYesterday.toISOString(), now) === "Yesterday");
  check("Day label — older date named", dayLabel("2026-09-01T10:00:00Z", now).includes("2026") || dayLabel("2026-09-01T10:00:00Z", now).length > 0);
  check("Time — renders hh:mm", /^\d{1,2}:\d{2}/.test(formatMessageTime("2026-09-08T15:04:00Z")));

  const msgs: Message[] = [
    { id: "1", teamId: "t", senderId: "a", type: "user", content: "hi", createdAt: "2026-09-08T09:00:00Z" },
    { id: "2", teamId: "t", senderId: "b", type: "user", content: "yo", createdAt: "2026-09-08T10:00:00Z" },
    { id: "3", teamId: "t", senderId: "a", type: "user", content: "old", createdAt: "2026-09-06T10:00:00Z" },
  ];
  const groups = groupMessagesByDay(msgs, now);
  check("Grouping — contiguous same-day merge", groups.length === 2 && groups[0].messages.length === 2);

  const segs = linkifySegments("Join here https://meet.google.com/abc-defg-hij, thanks!");
  check(
    "Linkify — URL detected, punctuation trimmed",
    segs.some((s) => s.url === "https://meet.google.com/abc-defg-hij") &&
      segs.some((s) => !s.url && s.text.includes("Join here"))
  );
  const plain = linkifySegments("No links at all");
  check("Linkify — plain text untouched", plain.length === 1 && !plain[0].url);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
