"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getProfile, searchMembers as searchMemberProfiles, updateProfile } from "@/lib/profiles/service";
import { AVATAR_MAX_BYTES, detectAvatarFormat, validateBio, validateDisplayName, validateMemberSearch } from "@/lib/profiles/validation";
import type { Profile } from "@/lib/profiles/service";

export type ProfileActionState = {
  error: string | null;
  success: string | null;
  profile?: Profile | null;
};

export type MemberSearchState = {
  error: string | null;
  query: string;
  members: Profile[];
};

async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  return !error && typeof userId === "string" ? userId : null;
}

export async function saveProfileAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const validation = validateDisplayName(formData.get("displayName"));
  const bioValidation = validateBio(formData.get("bio"));
  if (!validation.success) return { error: validation.error, success: null };
  if (!bioValidation.success) return { error: bioValidation.error, success: null };

  let uploadedPath: string | null = null;
  let supabase: Awaited<ReturnType<typeof createClient>> | null = null;
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { error: "Your session expired. Sign in again to update your profile.", success: null };

    supabase = await createClient();
    const { data: currentProfile } = await getProfile(supabase, userId);
    const avatarEntry = formData.get("avatar");
    let verifiedFormat: ReturnType<typeof detectAvatarFormat> = null;

    if (avatarEntry instanceof File && avatarEntry.size > 0) {
      if (avatarEntry.size > AVATAR_MAX_BYTES) {
        return { error: "Choose an image smaller than 2 MB.", success: null };
      }
      const bytes = new Uint8Array(await avatarEntry.arrayBuffer());
      verifiedFormat = detectAvatarFormat(bytes);
      if (!verifiedFormat || avatarEntry.type !== verifiedFormat) {
        return { error: "Upload a valid PNG, JPG, or WebP image.", success: null };
      }

      const extension = verifiedFormat === "image/jpeg" ? "jpg" : verifiedFormat.slice("image/".length);
      uploadedPath = `${userId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(uploadedPath, bytes, {
        contentType: verifiedFormat,
        upsert: false,
      });
      if (uploadError) return { error: "We couldn’t upload that image. Try again.", success: null };
    }

    const { data, error } = await updateProfile(supabase, userId, {
      display_name: validation.value,
      bio: bioValidation.value,
      avatar_path: uploadedPath ?? currentProfile?.avatar_path ?? null,
    });
    if (error || !data) {
      if (uploadedPath) await supabase.storage.from("avatars").remove([uploadedPath]);
      return { error: "We couldn’t save your profile. Refresh the page and try again.", success: null };
    }

    if (uploadedPath && currentProfile?.avatar_path) {
      await supabase.storage.from("avatars").remove([currentProfile.avatar_path]);
    }
    revalidatePath("/protected");
    return { error: null, success: "Your profile has been updated.", profile: data as Profile };
  } catch {
    if (uploadedPath && supabase) await supabase.storage.from("avatars").remove([uploadedPath]);
    return { error: "We couldn’t save your profile. Check your connection and try again.", success: null };
  }
}

export async function searchMembersAction(
  _previousState: MemberSearchState,
  formData: FormData,
): Promise<MemberSearchState> {
  const rawQuery = formData.get("query");
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";
  if (query.length === 0) return { error: null, query: "", members: [] };

  const validation = validateMemberSearch(rawQuery);
  if (!validation.success) return { error: validation.error, query, members: [] };

  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) return { error: "Your session expired. Sign in again to search members.", query, members: [] };

    const supabase = await createClient();
    const { data, error } = await searchMemberProfiles(supabase, userId, validation.value);
    if (error) return { error: "We couldn’t search members. Please try again.", query, members: [] };

    return { error: null, query, members: (data ?? []) as Profile[] };
  } catch {
    return { error: "We couldn’t search members. Check your connection and try again.", query, members: [] };
  }
}
