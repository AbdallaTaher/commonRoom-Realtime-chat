import {
  validateGroupId,
  validateGroupMemberIds,
  validateGroupMemberId,
  validateGroupName,
} from "@/lib/groups/validation";

describe("group input validation", () => {
  const firstMember = "c0a8012a-7b3e-4c7f-9d2a-123456789abc";
  const secondMember = "c0a8012a-7b3e-4c7f-9d2a-123456789abd";

  it("trims valid group names and rejects invalid names", () => {
    expect(validateGroupName("  Weekend plans  ")).toEqual({ success: true, value: "Weekend plans" });
    expect(validateGroupName(null).success).toBe(false);
    expect(validateGroupName("A").success).toBe(false);
    expect(validateGroupName("Trip\nplans").success).toBe(false);
    expect(validateGroupName("A".repeat(61)).success).toBe(false);
  });

  it("accepts between one and twenty distinct member IDs", () => {
    expect(validateGroupMemberIds(JSON.stringify([firstMember, secondMember]))).toEqual({
      success: true,
      value: [firstMember, secondMember],
    });
    expect(validateGroupMemberIds(JSON.stringify([firstMember, firstMember])).success).toBe(false);
    expect(validateGroupMemberIds(JSON.stringify(["not-a-uuid"])).success).toBe(false);
    expect(validateGroupMemberIds(JSON.stringify([])).success).toBe(false);
    expect(validateGroupMemberIds(JSON.stringify(Array(21).fill(firstMember))).success).toBe(false);
    expect(validateGroupMemberIds("not-json").success).toBe(false);
    expect(validateGroupMemberIds(null).success).toBe(false);
    expect(validateGroupMemberIds(JSON.stringify({ memberId: firstMember })).success).toBe(false);
  });

  it("validates group route identifiers", () => {
    expect(validateGroupId(firstMember)).toEqual({ success: true, value: firstMember });
    expect(validateGroupId("invalid").success).toBe(false);
    expect(validateGroupMemberId(firstMember)).toEqual({ success: true, value: firstMember });
    expect(validateGroupMemberId("invalid").success).toBe(false);
  });
});
