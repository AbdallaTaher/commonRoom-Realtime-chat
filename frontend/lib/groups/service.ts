import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

export type GroupConversation = {
  conversation_id: string;
  group_name: string;
  owner_id: string;
  started_at: string;
  member_count: number;
  member_ids: string[];
  last_message_sender_id: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
};

export type GroupMember = {
  conversation_id: string;
  group_name: string;
  owner_id: string;
  member_id: string;
  display_name: string;
  is_owner: boolean;
};

type RpcResult<T> = { data: T | null; error: PostgrestError | null };

async function uuidRpc(
  request: PromiseLike<{ data: unknown; error: PostgrestError | null }>,
): Promise<RpcResult<string>> {
  const result = await request;
  return { data: result.data as string | null, error: result.error };
}

export async function getGroups(client: SupabaseClient): Promise<RpcResult<GroupConversation[]>> {
  const result = await client.rpc("list_group_conversations");
  return { data: result.data as unknown as GroupConversation[] | null, error: result.error };
}

export async function getGroup(client: SupabaseClient, groupId: string): Promise<RpcResult<GroupMember[]>> {
  const result = await client.rpc("get_group_conversation", { target_conversation_id: groupId });
  return { data: result.data as unknown as GroupMember[] | null, error: result.error };
}

export function createGroup(client: SupabaseClient, name: string, memberIds: string[]) {
  return uuidRpc(client.rpc("create_group_conversation", {
    requested_name: name,
    target_member_ids: memberIds,
  }));
}

export function renameGroup(client: SupabaseClient, groupId: string, name: string) {
  return uuidRpc(client.rpc("rename_group_conversation", {
    target_conversation_id: groupId,
    requested_name: name,
  }));
}

export function addGroupMember(client: SupabaseClient, groupId: string, memberId: string) {
  return uuidRpc(client.rpc("add_group_member", {
    target_conversation_id: groupId,
    target_member_id: memberId,
  }));
}

export function removeGroupMember(client: SupabaseClient, groupId: string, memberId: string) {
  return uuidRpc(client.rpc("remove_group_member", {
    target_conversation_id: groupId,
    target_member_id: memberId,
  }));
}

export function leaveGroup(client: SupabaseClient, groupId: string) {
  return uuidRpc(client.rpc("leave_group_conversation", {
    target_conversation_id: groupId,
  }));
}
