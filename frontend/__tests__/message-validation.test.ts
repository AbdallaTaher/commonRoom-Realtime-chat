import {
  MESSAGE_MAX_LENGTH,
  validateClientMessageId,
  validateMessageContent,
  validateMessageCursor,
} from "@/lib/messages/validation";

describe("message input validation", () => {
  it("trims valid text and rejects missing or whitespace-only messages", () => {
    expect(validateMessageContent("  Hello there  ")).toEqual({ success: true, value: "Hello there" });
    expect(validateMessageContent(null).success).toBe(false);
    expect(validateMessageContent(" \n\t ").success).toBe(false);
  });

  it("rejects oversized content and unsupported control characters", () => {
    expect(validateMessageContent("a".repeat(MESSAGE_MAX_LENGTH)).success).toBe(true);
    expect(validateMessageContent("a".repeat(MESSAGE_MAX_LENGTH + 1))).toEqual({
      success: false,
      error: `Messages can be up to ${MESSAGE_MAX_LENGTH} characters.`,
    });
    expect(validateMessageContent("hello\u0000world").success).toBe(false);
  });

  it("accepts only UUID request identifiers and safe history cursors", () => {
    expect(validateClientMessageId("c0a8012a-7b3e-4c7f-9d2a-123456789abc").success).toBe(true);
    expect(validateClientMessageId("not-a-uuid").success).toBe(false);
    expect(validateMessageCursor("2026-10-21T12:30:45.123Z", "c0a8012a-7b3e-4c7f-9d2a-123456789abc")).toBe(true);
    expect(validateMessageCursor("2026-10-21T12:30:45Z),id.lt.anything", "c0a8012a-7b3e-4c7f-9d2a-123456789abc")).toBe(false);
  });
});
