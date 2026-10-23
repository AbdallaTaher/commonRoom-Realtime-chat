const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const UNSUPPORTED_CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
export const MESSAGE_PAGE_SIZE = 50;
export const MESSAGE_MAX_LENGTH = 4000;

export function validateMessageContent(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return { success: false as const, error: "Write a message before sending." };
  }

  const content = value.trim();
  if (!content) {
    return { success: false as const, error: "Write a message before sending." };
  }

  if (Array.from(content).length > MESSAGE_MAX_LENGTH) {
    return { success: false as const, error: `Messages can be up to ${MESSAGE_MAX_LENGTH} characters.` };
  }

  if (UNSUPPORTED_CONTROL_CHARACTERS.test(content)) {
    return { success: false as const, error: "Remove unsupported characters from your message." };
  }

  return { success: true as const, value: content };
}

export function validateClientMessageId(value: FormDataEntryValue | null) {
  return typeof value === "string" && UUID_PATTERN.test(value)
    ? { success: true as const, value }
    : { success: false as const, error: "Your message could not be sent. Please try again." };
}

export function validateMessageCursor(createdAt: string, messageId: string) {
  return TIMESTAMP_PATTERN.test(createdAt)
    && Number.isFinite(Date.parse(createdAt))
    && UUID_PATTERN.test(messageId);
}
