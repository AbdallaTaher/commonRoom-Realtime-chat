import type { SupabaseClient } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  display_name: string;
  bio?: string;
  avatar_path?: string | null;
};

export async function getProfile(client: SupabaseClient, userId: string) {
  return client
    .from("profiles")
    .select("id, display_name, bio, avatar_path")
    .eq("id", userId)
    .maybeSingle<Profile>();
}

export async function updateProfile(
  client: SupabaseClient,
  userId: string,
  values: { display_name: string; bio: string; avatar_path: string | null },
) {
  return client
    .from("profiles")
    .update(values)
    .eq("id", userId)
    .select("id, display_name, bio, avatar_path")
    .maybeSingle();
}

export async function searchMembers(
  client: SupabaseClient,
  userId: string,
  query: string,
) {
  return client
    .from("profiles")
    .select("id, display_name")
    .neq("id", userId)
    .ilike("display_name", `%${query}%`)
    .order("display_name", { ascending: true })
    .limit(20);
}
