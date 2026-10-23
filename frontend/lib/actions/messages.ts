"use server";

import { revalidatePath } from "next/cache";

import { validateConversationId } from "@/lib/conversations/validation";
import { listConversationReadReceipts, listMessages, searchMessages, sendMessage } from "@/lib/messages/service";
import {
  validateClientMessageId,
  validateMessageContent,
  validateMessageCursor,
} from "@/lib/messages/validation";
import { createClient } from "@/lib/supabase/server";

export type SendMessageResult = {
  error: string | null;
  message: Awaited<ReturnType<typeof sendMessage>>["data"];
};

export async function sendMessageAction(formData: FormData): Promise<SendMessageResult> {
  const conversationId = formData.get("conversationId");
  if (typeof conversationId !== "string" || !validateConversationId(conversationId)) {
    return { error: "This conversation could not be found.", message: null };
  }

  const clientMessageId = validateClientMessageId(formData.get("clientMessageId"));
  const content = validateMessageContent(formData.get("content"));
  if (!clientMessageId.success) return { error: clientMessageId.error, message: null };
  if (!content.success) return { error: content.error, message: null };

  try {
    const client = await createClient();
    const result = await sendMessage(client, conversationId, clientMessageId.value, content.value);
    if (result.error?.message === "Message rate limit exceeded") {
      return { error: "You’re sending messages too quickly. Wait a minute and try again.", message: null };
    }
    if (result.error || !result.data) {
      return { error: "Your message couldn’t be sent. Check your connection and try again.", message: null };
    }

    revalidatePath("/protected");
    revalidatePath(`/protected/conversations/${conversationId}`);
    revalidatePath(`/protected/groups/${conversationId}`);
    return { error: null, message: result.data };
  } catch {
    return { error: "Your message couldn’t be sent. Check your connection and try again.", message: null };
  }
}

export async function loadOlderMessagesAction(
  conversationId: string,
  beforeCreatedAt: string,
  beforeMessageId: string,
) {
  if (!validateConversationId(conversationId)
    || !validateMessageCursor(beforeCreatedAt, beforeMessageId)) {
    return { error: "Couldn’t load earlier messages. Refresh the conversation and try again.", page: null };
  }

  try {
    const client = await createClient();
    const { data, error } = await listMessages(client, conversationId, {
      created_at: beforeCreatedAt,
      id: beforeMessageId,
    });

    if (error || !data) {
      return { error: "Couldn’t load earlier messages. Check your connection and try again.", page: null };
    }

    return { error: null, page: data };
  } catch {
    return { error: "Couldn’t load earlier messages. Check your connection and try again.", page: null };
  }
}

export async function syncLatestMessagesAction(conversationId: string) {
  if (!validateConversationId(conversationId)) {
    return { error: "Couldn’t refresh this conversation. Reload and try again.", page: null };
  }

  try {
    const client = await createClient();
    const { data, error } = await listMessages(client, conversationId);
    if (error || !data) {
      return { error: "Couldn’t refresh messages. Check your connection and try again.", page: null };
    }

    return { error: null, page: data };
  } catch {
    return { error: "Couldn’t refresh messages. Check your connection and try again.", page: null };
  }
}

export async function markConversationReadAction(conversationId: string) {
  if (!validateConversationId(conversationId)) return { error: "Conversation not found." };

  try {
    const client = await createClient();
    const { error } = await client.rpc("mark_conversation_read", {
      target_conversation_id: conversationId,
    });
    if (!error) revalidatePath("/protected");
    return error ? { error: "Couldn’t update the conversation’s read status." } : { error: null };
  } catch {
    return { error: "Couldn’t update the conversation’s read status." };
  }
}

export async function searchConversationMessagesAction(conversationId: string, rawQuery: string) {
  const query = rawQuery.trim();
  if (!validateConversationId(conversationId) || query.length < 2 || query.length > 100) {
    return { error: "Enter between 2 and 100 characters to search.", messages: null };
  }

  try {
    const client = await createClient();
    const { data, error } = await searchMessages(client, conversationId, query);
    if (error || !data) return { error: "Couldn’t search these messages. Try again.", messages: null };
    return { error: null, messages: data };
  } catch {
    return { error: "Couldn’t search these messages. Try again.", messages: null };
  }
}

export async function getConversationReadReceiptsAction(conversationId: string) {
  if (!validateConversationId(conversationId)) return { receipts: null };

  try {
    const client = await createClient();
    const { data, error } = await listConversationReadReceipts(client, conversationId);
    return { receipts: error ? null : data };
  } catch {
    return { receipts: null };
  }
}
