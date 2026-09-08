"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { UsersRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ErrorState } from "@/components/ui/States";
import { useToast } from "@/components/ui/Toast";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMembers } from "@/components/chat/ChatMembers";
import {
  ChatAccessDenied,
  ChatEmptyState,
  ChatHeaderLoading,
  ChatLoadingState,
  ChatMembersLoading,
} from "@/components/chat/ChatStates";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList } from "@/components/chat/MessageList";
import {
  CHAT_ERROR_MESSAGES,
  canAccessChat,
  deleteMessage,
  getTeamMessages,
  markChatAsRead,
  sendMessage,
} from "@/lib/services/chat";
import { getTeamById } from "@/lib/services/teams";
import { listStudents } from "@/lib/services/students";
import type { Message, Student, Team } from "@/types";

const CURRENT_USER = "me";

/**
 * Team-only chat. Membership gates everything: non-members see an
 * access-denied state and messages are never fetched for them.
 */
export default function TeamChatPage() {
  const params = useParams<{ id: string }>();
  const { success, error } = useToast();

  const [team, setTeam] = React.useState<Team | null | undefined>(undefined);
  const [students, setStudents] = React.useState<Student[] | null>(null);
  const [messages, setMessages] = React.useState<Message[] | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [membersOpen, setMembersOpen] = React.useState(false);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);
  const didInitialScroll = React.useRef(false);

  React.useEffect(() => {
    let cancelled = false;
    Promise.all([getTeamById(params.id), listStudents()])
      .then(async ([t, s]) => {
        if (cancelled) return;
        setTeam(t);
        setStudents(s);
        if (t && canAccessChat(t, CURRENT_USER)) {
          setMessages(await getTeamMessages(t.id));
          markChatAsRead(t.id);
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const namesById = React.useMemo(
    () => new Map((students ?? []).map((s) => [s.id, s.fullName])),
    [students]
  );
  const studentsById = React.useMemo(
    () => new Map((students ?? []).map((s) => [s.id, s])),
    [students]
  );

  function scrollToBottom() {
    // Wait a tick so the new message paints before scrolling.
    window.setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 50);
  }

  React.useEffect(() => {
    if (messages && messages.length > 0 && !didInitialScroll.current) {
      didInitialScroll.current = true;
      bottomRef.current?.scrollIntoView({ block: "end" });
    }
  }, [messages]);

  async function handleSend(content: string): Promise<boolean> {
    if (!team) return false;
    setSending(true);
    const res = await sendMessage(team.id, CURRENT_USER, content);
    setSending(false);
    if (!res.ok) {
      error("Couldn't send the message", CHAT_ERROR_MESSAGES[res.error]);
      return false;
    }
    setMessages((prev) => [...(prev ?? []), res.message]);
    markChatAsRead(team.id);
    scrollToBottom();
    return true;
  }

  async function handleDelete(messageId: string) {
    setDeletingId(messageId);
    const res = await deleteMessage(messageId, CURRENT_USER);
    setDeletingId(null);
    if (!res.ok) {
      error(
        "Couldn't delete the message",
        res.error === "FORBIDDEN"
          ? "You can only delete your own messages."
          : "Please try again."
      );
      return;
    }
    setMessages((prev) => (prev ?? []).filter((m) => m.id !== messageId));
    success("Message deleted", undefined);
  }

  if (team === undefined || !students) {
    if (failed) {
      return (
        <div className="space-y-4">
          <ChatHeaderLoading />
          <ErrorState
            title="Chat unavailable"
            description="Something went wrong. Please try again."
            onRetry={() => window.location.reload()}
          />
        </div>
      );
    }
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
        <ChatHeaderLoading />
        <div className="grid lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="px-4 py-4 sm:px-6">
            <ChatLoadingState />
          </div>
          <div className="hidden border-l border-slate-100 px-4 py-4 lg:block">
            <ChatMembersLoading />
          </div>
        </div>
      </div>
    );
  }

  if (team === null) {
    return (
      <ErrorState
        title="Team not found"
        description="This team doesn't exist or is no longer available."
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!canAccessChat(team, CURRENT_USER)) {
    return <ChatAccessDenied teamTitle={team.projectTitle} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[var(--shadow-card)]">
      <ChatHeader team={team} />
      <div className="grid lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex min-w-0 flex-col">
          <div className="slim-scroll min-h-[40vh] max-h-[55dvh] flex-1 overflow-y-auto bg-[#f6f8fb] px-3 py-3 sm:px-5">
            {messages === null ? (
              <ChatLoadingState />
            ) : messages.length === 0 ? (
              <ChatEmptyState />
            ) : (
              <MessageList
                messages={messages}
                currentUserId={CURRENT_USER}
                namesById={namesById}
                onDelete={handleDelete}
                deletingId={deletingId}
                bottomRef={bottomRef}
              />
            )}
          </div>
          <div className="border-t border-slate-200/80 bg-white px-3 py-3 sm:px-5">
            <MessageInput onSend={handleSend} sending={sending} />
          </div>
        </div>
        <aside className="hidden min-w-0 border-l border-slate-100 px-4 py-4 lg:block" aria-label="Team members">
          <ChatMembers
            members={team.members}
            studentsById={studentsById}
            ownerId={team.ownerId}
            currentUserId={CURRENT_USER}
          />
        </aside>
      </div>
      <div className="border-t border-slate-100 bg-white px-4 py-2.5 lg:hidden">
        <Button variant="ghost" size="sm" onClick={() => setMembersOpen(true)} className="w-full">
          <UsersRound className="h-4 w-4" /> View {team.members.length} members
        </Button>
      </div>

      <Modal
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        title="Team Members"
        size="sm"
      >
        <ChatMembers
          members={team.members}
          studentsById={studentsById}
          ownerId={team.ownerId}
          currentUserId={CURRENT_USER}
        />
      </Modal>
    </div>
  );
}
