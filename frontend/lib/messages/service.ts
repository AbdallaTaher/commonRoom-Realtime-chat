import type { SupabaseClient } from "@supabase/supabase-js";

import { MESSAGE_PAGE_SIZE } from "@/lib/messages/validation";

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export type MessageCursor = Pick<Message, "created_at" | "id">;

export type MessagePage = {
  messages: Message[];
  hasMore: boolean;
};

export type MessageReadReceipt = {
  message_id: string;
  read_by_count: number;
  recipient_count: number;
};

export async function listMessages(
  client: SupabaseClient,
  conversationId: string,
  before?: MessageCursor,
): Promise<{ data: MessagePage | null; error: Error | null }> {
  let query = client
    .from("messages")
    .select("id, conversation_id, sender_id, content, created_at")
    .eq("conversation_id", conversationId);

  if (before) {
    query = query.or(
      `created_at.lt.${before.created_at},and(created_at.eq.${before.created_at},id.lt.${before.id})`,
    );
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(MESSAGE_PAGE_SIZE + 1);

  if (error) return { data: null, error };

  const newestFirst = (data ?? []) as Message[];
  const hasMore = newestFirst.length > MESSAGE_PAGE_SIZE;
  return {
    data: {
      messages: newestFirst.slice(0, MESSAGE_PAGE_SIZE).reverse(),
      hasMore,
    },
    error: null,
  };
}

export async function sendMessage(
  client: SupabaseClient,
  conversationId: string,
  clientMessageId: string,
  content: string,
): Promise<{ data: Message | null; error: Error | null }> {
  const { data: messageId, error: rpcError } = await client.rpc("send_conversation_message", {
    target_conversation_id: conversationId,
    requested_client_message_id: clientMessageId,
    requested_content: content,
  });

  if (rpcError || !messageId) return { data: null, error: rpcError ?? new Error("Message was not saved") };

  const { data, error } = await client
    .from("messages")
    .select("id, conversation_id, sender_id, content, created_at")
    .eq("id", messageId)
    .single();

  return { data: data as Message | null, error };
}

export async function searchMessages(
  client: SupabaseClient,
  conversationId: string,
  searchText: string,
): Promise<{ data: Message[] | null; error: Error | null }> {
  const escaped = searchText.replace(/[\\%_]/g, "\\$&");
  const { data, error } = await client
    .from("messages")
    .select("id, conversation_id, sender_id, content, created_at")
    .eq("conversation_id", conversationId)
    .ilike("content", `%${escaped}%`)
    .order("created_at", { ascending: false })
    .limit(100);

  return { data: data as Message[] | null, error };
}

export async function listConversationReadReceipts(
  client: SupabaseClient,
  conversationId: string,
): Promise<{ data: MessageReadReceipt[] | null; error: Error | null }> {
  const { data, error } = await client.rpc("list_conversation_read_receipts", {
    target_conversation_id: conversationId,
  });
  return { data: data as MessageReadReceipt[] | null, error };
}
