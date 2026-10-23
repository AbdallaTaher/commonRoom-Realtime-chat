import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

export type DirectConversation = {
  conversation_id: string;
  started_at: string;
  member_id: string;
  display_name: string;
  avatar_path?: string | null;
  last_message_sender_id: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
};

type RpcResult<T> = {
  data: T | null;
  error: PostgrestError | null;
};

export async function getDirectConversations(
  client: SupabaseClient,
): Promise<RpcResult<DirectConversation[]>> {
  const result = await client.rpc("list_direct_conversations");
  return {
    data: result.data as unknown as DirectConversation[] | null,
    error: result.error,
  };
}

export async function startDirectConversation(
  client: SupabaseClient,
  memberId: string,
) {
  const result = await client.rpc("create_direct_conversation", {
    target_member_id: memberId,
  });
  return { data: result.data as unknown as string | null, error: result.error };
}

export async function getDirectConversation(
  client: SupabaseClient,
  conversationId: string,
) {
  return client
    .rpc("get_direct_conversation", { target_conversation_id: conversationId })
    .maybeSingle<DirectConversation>();
}
