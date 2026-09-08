"use client";

import * as React from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { formatMessageTime, linkifySegments } from "@/lib/services/chat";
import { cn } from "@/lib/utils";

function LinkedText({ content }: { content: string }) {
  const segments = linkifySegments(content);
  return (
    <>
      {segments.map((s, i) =>
        s.url ? (
          <a
            key={i}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline decoration-brand-300 underline-offset-2 break-all hover:text-brand-700"
          >
            {s.text}
          </a>
        ) : (
          <span key={i}>{s.text}</span>
        )
      )}
    </>
  );
}

export function SystemBubble({ content, createdAt }: { content: string; createdAt: string }) {
  return (
    <div className="flex justify-center px-2 py-1">
      <p className="max-w-full rounded-full bg-slate-100 px-3.5 py-1.5 text-center text-xs text-slate-500">
        {content}{" "}
        <span className="whitespace-nowrap text-slate-400">
          · {formatMessageTime(createdAt)}
        </span>
      </p>
    </div>
  );
}

export function UserBubble({
  messageId,
  senderId,
  senderName,
  content,
  createdAt,
  own,
  onDelete,
  deleting,
}: {
  messageId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  own: boolean;
  onDelete: (messageId: string) => void;
  deleting: boolean;
}) {
  return (
    <div className={cn("flex gap-2 px-1 py-1", own && "flex-row-reverse")}>
      {!own && (
        <Link href={`/profile/${senderId}`} aria-label={`View ${senderName}'s profile`} className="shrink-0 self-end">
          <Avatar name={senderName} size="sm" />
        </Link>
      )}
      <div className={cn("min-w-0 max-w-[80%] sm:max-w-[70%]", own && "flex flex-col items-end")}>
        {!own && (
          <p className="mb-0.5 ml-1 text-xs font-semibold text-slate-600">{senderName}</p>
        )}
        <div
          className={cn(
            "group relative whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
            own
              ? "rounded-br-md bg-brand-600 text-white"
              : "rounded-bl-md bg-white text-slate-800 ring-1 ring-inset ring-slate-200"
          )}
        >
          <LinkedText content={content} />
          {own && (
            <button
              type="button"
              onClick={() => onDelete(messageId)}
              disabled={deleting}
              aria-label="Delete this message"
              title="Delete this message"
              className="absolute -left-8 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 opacity-100 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className={cn("mt-0.5 text-[11px] text-slate-400", own ? "mr-1" : "ml-1")}>
          {formatMessageTime(createdAt)}
        </p>
      </div>
    </div>
  );
}
