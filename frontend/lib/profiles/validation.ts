export type ProfileValidationResult =
  | { success: true; value: string }
  | { success: false; error: string };

export function validateDisplayName(value: FormDataEntryValue | null): ProfileValidationResult {
  if (typeof value !== "string") {
    return { success: false, error: "Enter a display name." };
  }

  const displayName = value.trim();
  if (
    displayName.length < 2 ||
    displayName.length > 60 ||
    /[\u0000-\u001f\u007f]/.test(displayName)
  ) {
    return { success: false, error: "Your name must be between 2 and 60 characters." };
  }

  return { success: true, value: displayName };
}

export function validateMemberSearch(value: FormDataEntryValue | null): ProfileValidationResult {
  if (typeof value !== "string") {
    return { success: false, error: "Enter a name to search." };
  }

  const query = value.trim();
  if (query.length < 2 || query.length > 40 || /[%_\\\u0000-\u001f\u007f]/.test(query)) {
    return { success: false, error: "Search with 2 to 40 letters or numbers." };
  }

  return { success: true, value: query };
}

export function validateBio(value: FormDataEntryValue | null): ProfileValidationResult {
  if (typeof value !== "string") return { success: false, error: "Enter a short bio." };
  const bio = value.trim();
  if (bio.length > 160 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(bio)) {
    return { success: false, error: "Your bio must be 160 characters or fewer." };
  }
  return { success: true, value: bio };
}

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export type AvatarFormat = "image/png" | "image/jpeg" | "image/webp";

export function detectAvatarFormat(bytes: Uint8Array): AvatarFormat | null {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}
