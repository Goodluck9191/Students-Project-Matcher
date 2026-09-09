"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { requireUser } from "@/lib/supabase/auth";
import { done, fail, notConfigured, type ActionResult } from "./shared";
import { MAX_MESSAGE_LENGTH } from "@/types";

export async function sendChatMessageAction(
  teamId: string,
  content: string
): Promise<ActionResult<{ id: string }>> {
  if (!isSupabaseConfigured()) return notConfigured();
  const check = await requireUser();
  if (!check.ok) return fail(check.reason, "You must be signed in.");
  const text = content.trim();
  if (!text) return fail("VALIDATION", "Message cannot be empty.");
  if (text.length > MAX_MESSAGE_LENGTH)
    return fail("VALIDATION", `Messages are limited to ${MAX_MESSAGE_LENGTH} characters.`);

  const supabase = await createClient();
  // Sender comes from the session — never from the browser payload.
  const { data, error } = await supabase
    .from("team_messages")
    .insert({ team_id: teamId, sender_id: check.profile.id, content: text, message_type: "user" })
    .select("id")
    .single();
  if (error) return fail("DB_ERROR", "Couldn't send the message. Check team membership.");
  return done({ id: (data as { id: string }).id });
}

export async function deleteChatMessageAction(messageId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return notConfigured();
  const check = await requireUser();
  if (!check.ok) return fail(check.reason, "You must be signed in.");
  const supabase = await createClient();
  const { data: msg } = await supabase
    .from("team_messages")
    .select("sender_id,message_type")
    .eq("id", messageId)
    .single();
  const m = msg as { sender_id: string | null; message_type: string } | null;
  if (!m) return fail("NOT_FOUND", "Message not found.");
  if (m.message_type !== "user" || m.sender_id !== check.profile.id)
    return fail("FORBIDDEN", "You can only delete your own messages.");
  const { error } = await supabase.from("team_messages").delete().eq("id", messageId);
  if (error) return fail("DB_ERROR", "Couldn't delete the message.");
  return done(undefined);
}
