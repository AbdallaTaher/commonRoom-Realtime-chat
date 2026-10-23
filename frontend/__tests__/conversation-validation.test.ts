import { validateConversationId, validateMemberId } from "@/lib/conversations/validation";

describe("direct conversation identifiers", () => {
  const validId = "c0a8012a-7b3e-4c7f-9d2a-123456789abc";

  it("accepts a UUID member ID from a form", () => {
    expect(validateMemberId(validId)).toEqual({ success: true, value: validId });
  });

  it.each([null, "", "not-a-uuid", "1; drop table profiles"])(
    "rejects an invalid member ID %s",
    (memberId) => {
      expect(validateMemberId(memberId).success).toBe(false);
    },
  );

  it("accepts valid conversation UUIDs and rejects malformed route values", () => {
    expect(validateConversationId(validId)).toBe(true);
    expect(validateConversationId("not-a-uuid")).toBe(false);
  });
});
