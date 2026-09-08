import * as React from "react";
import { SystemBubble, UserBubble } from "./MessageBubble";
import { DateSeparator } from "./DateSeparator";
import { groupMessagesByDay } from "@/lib/services/chat";
import type { Message } from "@/types";

export function MessageList({
  messages,
  currentUserId,
  namesById,
  onDelete,
  deletingId,
  bottomRef,
}: {
  messages: Message[];
  currentUserId: string;
  namesById: Map<string, string>;
  onDelete: (messageId: string) => void;
  deletingId: string | null;
  bottomRef: React.RefObject<HTMLDivElement | null>;
}) {
  const groups = React.useMemo(() => groupMessagesByDay(messages), [messages]);

  return (
    <div className="space-y-1" aria-live="polite" aria-label="Team messages">
      {groups.map((g) => (
        <div key={g.key}>
          <DateSeparator label={g.label} />
          {g.messages.map((m) =>
            m.type === "system" ? (
              <SystemBubble key={m.id} content={m.content} createdAt={m.createdAt} />
            ) : (
              <UserBubble
                key={m.id}
                messageId={m.id}
                senderId={m.senderId ?? ""}
                senderName={namesById.get(m.senderId ?? "") ?? "Unknown"}
                content={m.content}
                createdAt={m.createdAt}
                own={m.senderId === currentUserId}
                onDelete={onDelete}
                deleting={deletingId === m.id}
              />
            )
          )}
        </div>
      ))}
      <div ref={bottomRef} aria-hidden />
    </div>
  );
}
