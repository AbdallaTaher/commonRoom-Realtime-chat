export type AuthValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type Credentials = {
  email: string;
  password: string;
};

export type SignUpDetails = Credentials & {
  displayName: string;
};

function readString(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : null;
}

function parseCredentials(formData: FormData): AuthValidationResult<Credentials> {
  const email = readString(formData, "email")?.toLowerCase();
  const passwordValue = formData.get("password");
  const password = typeof passwordValue === "string" ? passwordValue : null;

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Enter a valid email address." };
  }

  if (!password || password.length < 8 || password.length > 72) {
    return {
      success: false,
      error: "Your password must be between 8 and 72 characters.",
    };
  }

  return { success: true, data: { email, password } };
}

export function validateSignIn(formData: FormData): AuthValidationResult<Credentials> {
  return parseCredentials(formData);
}

export function validateEmail(formData: FormData): AuthValidationResult<{ email: string }> {
  const email = readString(formData, "email")?.toLowerCase();
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: "Enter a valid email address." };
  }
  return { success: true, data: { email } };
}

export function validateNewPassword(formData: FormData): AuthValidationResult<{ password: string }> {
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");
  if (typeof password !== "string" || password.length < 8 || password.length > 72) {
    return { success: false, error: "Your password must be between 8 and 72 characters." };
  }
  if (confirmPassword !== password) {
    return { success: false, error: "Your passwords do not match." };
  }
  return { success: true, data: { password } };
}

export function validateSignUp(
  formData: FormData,
): AuthValidationResult<SignUpDetails> {
  const credentials = parseCredentials(formData);
  if (!credentials.success) return credentials;

  const displayName = readString(formData, "displayName");
  if (
    !displayName ||
    displayName.length < 2 ||
    displayName.length > 60 ||
    /[\u0000-\u001f\u007f]/.test(displayName)
  ) {
    return {
      success: false,
      error: "Your name must be between 2 and 60 characters.",
    };
  }

  if (formData.get("terms") !== "on") {
    return {
      success: false,
      error: "Please agree to the terms to create an account.",
    };
  }

  return { success: true, data: { ...credentials.data, displayName } };
}
