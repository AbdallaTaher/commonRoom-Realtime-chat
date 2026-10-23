const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateMemberId(value: FormDataEntryValue | null) {
  return typeof value === "string" && UUID_PATTERN.test(value)
    ? { success: true as const, value }
    : { success: false as const, error: "Choose a valid member to start a conversation." };
}

export function validateConversationId(value: string) {
  return UUID_PATTERN.test(value);
}
