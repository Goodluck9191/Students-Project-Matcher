"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MAX_MESSAGE_LENGTH } from "@/types";
import { cn } from "@/lib/utils";

export function MessageInput({
  onSend,
  sending,
}: {
  onSend: (content: string) => Promise<boolean>;
  sending: boolean;
}) {
  const [value, setValue] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const trimmed = value.trim();

  // Enter sends, Shift+Enter adds a newline.
  async function submit() {
    if (!trimmed || sending) return;
    const sent = await onSend(trimmed);
    if (sent) {
      setValue("");
      setTouched(false);
    } else {
      setTouched(true);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  }

  const overLimit = value.length > MAX_MESSAGE_LENGTH;

  return (
    <div>
      <div className="flex items-end gap-2">
        <label htmlFor="chat-composer" className="sr-only">
          Write a message
        </label>
        <textarea
          id="chat-composer"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => setTouched(true)}
          placeholder="Write a message..."
          rows={1}
          maxLength={MAX_MESSAGE_LENGTH + 200}
          aria-invalid={touched && (!trimmed || overLimit)}
          aria-describedby="chat-composer-hint"
          className={cn(
            "max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400",
            "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          )}
        />
        <Button
          onClick={() => void submit()}
          loading={sending}
          disabled={!trimmed || overLimit}
          aria-label="Send message"
          className="h-11 shrink-0 px-4"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">Send</span>
        </Button>
      </div>
      <p id="chat-composer-hint" className="mt-1 text-xs text-slate-400" aria-live="polite">
        {touched && !trimmed ? (
          <span className="text-rose-600">Message cannot be empty.</span>
        ) : overLimit ? (
          <span className="text-rose-600">
            Messages are limited to {MAX_MESSAGE_LENGTH} characters.
          </span>
        ) : (
          <>Enter to send · Shift+Enter for a new line</>
        )}
      </p>
    </div>
  );
}
