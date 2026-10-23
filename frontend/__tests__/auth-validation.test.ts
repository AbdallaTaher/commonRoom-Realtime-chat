import {
  validateEmail,
  validateNewPassword,
  validateSignIn,
  validateSignUp,
} from "@/lib/auth/validation";

function formData(values: Record<string, string>): FormData {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}

describe("auth input validation", () => {
  it("normalizes email casing and surrounding spaces for sign-in", () => {
    const result = validateSignIn(formData({ email: "  PERSON@EXAMPLE.COM ", password: "valid-pass-1" }));
    expect(result).toEqual({
      success: true,
      data: { email: "person@example.com", password: "valid-pass-1" },
    });
  });

  it.each(["", "not-an-email", "person@", `${"a".repeat(245)}@example.com`])(
    "rejects invalid sign-in email %s",
    (email) => {
      const result = validateSignIn(formData({ email, password: "valid-pass-1" }));
      expect(result.success).toBe(false);
    },
  );

  it("rejects passwords outside the supported length", () => {
    expect(validateSignIn(formData({ email: "person@example.com", password: "short" })).success).toBe(false);
    expect(validateSignIn(formData({ email: "person@example.com", password: "x".repeat(73) })).success).toBe(false);
  });

  it("requires a valid display name, password, and consent at sign-up", () => {
    const valid = {
      displayName: " Alex Morgan ",
      email: "ALEX@example.com",
      password: "valid-pass-1",
      terms: "on",
    };
    expect(validateSignUp(formData(valid))).toEqual({
      success: true,
      data: { displayName: "Alex Morgan", email: "alex@example.com", password: "valid-pass-1" },
    });
    expect(validateSignUp(formData({ ...valid, displayName: "A" })).success).toBe(false);
    expect(validateSignUp(formData({ ...valid, displayName: `Alex\nMorgan` })).success).toBe(false);
    expect(validateSignUp(formData({ ...valid, terms: "" })).success).toBe(false);
  });

  it("validates reset email and matching new passwords", () => {
    expect(validateEmail(formData({ email: "reset@example.com" })).success).toBe(true);
    expect(validateEmail(formData({ email: "broken" })).success).toBe(false);
    expect(validateNewPassword(formData({ password: "new-password", confirmPassword: "new-password" })).success).toBe(true);
    expect(validateNewPassword(formData({ password: "new-password", confirmPassword: "mismatch" })).success).toBe(false);
  });
});
