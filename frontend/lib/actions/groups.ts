"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  addGroupMember,
  createGroup,
  leaveGroup,
  removeGroupMember,
  renameGroup,
} from "@/lib/groups/service";
import {
  validateGroupId,
  validateGroupMemberId,
  validateGroupMemberIds,
  validateGroupName,
} from "@/lib/groups/validation";

export type GroupCreateState = { error: string | null; groupId: string | null };
export type GroupActionState = { error: string | null; success: string | null };

export async function createGroupAction(
  _previousState: GroupCreateState,
  formData: FormData,
): Promise<GroupCreateState> {
  const name = validateGroupName(formData.get("groupName"));
  if (!name.success) return { error: name.error, groupId: null };
  const members = validateGroupMemberIds(formData.get("memberIds"));
  if (!members.success) return { error: members.error, groupId: null };

  try {
    const supabase = await createClient();
    const { data, error } = await createGroup(supabase, name.value, members.value);
    if (error || !data) return { error: "We couldn’t create the group. Check your selections and try again.", groupId: null };
    revalidatePath("/protected");
    return { error: null, groupId: data };
  } catch {
    return { error: "We couldn’t create the group. Check your connection and try again.", groupId: null };
  }
}

export async function renameGroupAction(
  _previousState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const groupId = validateGroupId(formData.get("groupId"));
  const name = validateGroupName(formData.get("groupName"));
  if (!groupId.success) return { error: groupId.error, success: null };
  if (!name.success) return { error: name.error, success: null };

  try {
    const { error } = await renameGroup(await createClient(), groupId.value, name.value);
    if (error) return { error: "Only the group owner can change this group name.", success: null };
    revalidatePath(`/protected/groups/${groupId.value}`);
    revalidatePath("/protected");
    return { error: null, success: "Group name updated." };
  } catch {
    return { error: "We couldn’t update the group name. Try again.", success: null };
  }
}

export async function addGroupMemberAction(
  _previousState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const groupId = validateGroupId(formData.get("groupId"));
  const memberId = validateGroupMemberId(formData.get("memberId"));
  if (!groupId.success) return { error: groupId.error, success: null };
  if (!memberId.success) return { error: memberId.error, success: null };

  try {
    const { error } = await addGroupMember(await createClient(), groupId.value, memberId.value);
    if (error) return { error: "Only the group owner can add members. Check that the member is valid.", success: null };
    revalidatePath(`/protected/groups/${groupId.value}`);
    revalidatePath("/protected");
    return { error: null, success: "Member added to the group." };
  } catch {
    return { error: "We couldn’t add this member. Try again.", success: null };
  }
}

export async function removeGroupMemberAction(
  _previousState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const groupId = validateGroupId(formData.get("groupId"));
  const memberId = validateGroupMemberId(formData.get("memberId"));
  if (!groupId.success) return { error: groupId.error, success: null };
  if (!memberId.success) return { error: memberId.error, success: null };

  try {
    const { error } = await removeGroupMember(await createClient(), groupId.value, memberId.value);
    if (error) return { error: "Only the group owner can remove members, and the owner can’t remove themself.", success: null };
    revalidatePath(`/protected/groups/${groupId.value}`);
    revalidatePath("/protected");
    return { error: null, success: "Member removed from the group." };
  } catch {
    return { error: "We couldn’t remove this member. Try again.", success: null };
  }
}

export async function leaveGroupAction(
  _previousState: GroupActionState,
  formData: FormData,
): Promise<GroupActionState> {
  const groupId = validateGroupId(formData.get("groupId"));
  if (!groupId.success) return { error: groupId.error, success: null };

  try {
    const { error } = await leaveGroup(await createClient(), groupId.value);
    if (error) return { error: "You can’t leave as the owner. Group owners can’t leave their own group.", success: null };
    revalidatePath("/protected");
  } catch {
    return { error: "We couldn’t leave the group. Try again.", success: null };
  }

  redirect("/protected");
}
