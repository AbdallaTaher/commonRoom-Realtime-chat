import { validateConversationId, validateMemberId } from "@/lib/conversations/validation";

export function validateGroupName(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return { success: false as const, error: "Enter a group name." };
  }

  const name = value.trim();
  if (name.length < 2 || name.length > 60 || /[\u0000-\u001f\u007f]/.test(name)) {
    return { success: false as const, error: "Group names must be 2 to 60 characters." };
  }

  return { success: true as const, value: name };
}

export function validateGroupMemberIds(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return { success: false as const, error: "Choose at least one member for the group." };
  }

  let memberIds: unknown;
  try {
    memberIds = JSON.parse(value);
  } catch {
    return { success: false as const, error: "Choose valid members for the group." };
  }

  if (
    !Array.isArray(memberIds) ||
    memberIds.length < 1 ||
    memberIds.length > 20 ||
    !memberIds.every((memberId) => validateMemberId(memberId).success) ||
    new Set(memberIds).size !== memberIds.length
  ) {
    return { success: false as const, error: "Select 1 to 20 different members." };
  }

  return { success: true as const, value: memberIds as string[] };
}

export function validateGroupId(value: FormDataEntryValue | null) {
  return typeof value === "string" && validateConversationId(value)
    ? { success: true as const, value }
    : { success: false as const, error: "This group could not be found." };
}

export function validateGroupMemberId(value: FormDataEntryValue | null) {
  return validateMemberId(value);
}
