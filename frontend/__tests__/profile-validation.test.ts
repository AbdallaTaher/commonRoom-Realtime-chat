import {
  detectAvatarFormat,
  validateBio,
  validateDisplayName,
  validateMemberSearch,
} from "@/lib/profiles/validation";

describe("profile input validation", () => {
  it("trims valid display names and permits the supported length limits", () => {
    expect(validateDisplayName("  Alex Morgan  ")).toEqual({ success: true, value: "Alex Morgan" });
    expect(validateDisplayName("A".repeat(60)).success).toBe(true);
  });

  it.each([null, "", "A", "A".repeat(61), "Alex\nMorgan"])(
    "rejects invalid display name %s",
    (name) => {
      expect(validateDisplayName(name).success).toBe(false);
    },
  );

  it("trims valid member searches", () => {
    expect(validateMemberSearch("  Alex  ")).toEqual({ success: true, value: "Alex" });
  });

  it.each([null, "A", "A".repeat(41), "%", "A_B", "Alex\nMorgan"])(
    "rejects invalid member search %s",
    (query) => {
      expect(validateMemberSearch(query).success).toBe(false);
    },
  );

  it("trims valid bios and enforces the supported bio rules", () => {
    expect(validateBio("  A short bio  ")).toEqual({ success: true, value: "A short bio" });
    expect(validateBio("A".repeat(160)).success).toBe(true);
    expect(validateBio("A".repeat(161)).success).toBe(false);
    expect(validateBio("line\nbreak").success).toBe(true);
    expect(validateBio("bad\u0000control").success).toBe(false);
    expect(validateBio(null).success).toBe(false);
  });

  it("detects only supported avatar file signatures", () => {
    expect(detectAvatarFormat(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe("image/png");
    expect(detectAvatarFormat(new Uint8Array([0xff, 0xd8, 0xff]))).toBe("image/jpeg");
    expect(detectAvatarFormat(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))).toBe("image/webp");
    expect(detectAvatarFormat(new Uint8Array([0x89, 0x50, 0x4e]))).toBeNull();
    expect(detectAvatarFormat(new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBeNull();
  });
});
