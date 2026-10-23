import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { MemberDashboard } from "@/components/protected/member-dashboard";
import { getDirectConversations } from "@/lib/conversations/service";
import { getGroups } from "@/lib/groups/service";
import { getProfile } from "@/lib/profiles/service";
import { createClient } from "@/lib/supabase/server";

async function ProfileAndDiscovery() {
  await connection();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;

  if (error || typeof userId !== "string") redirect("/auth/login");

  const { data: profile, error: profileError } = await getProfile(supabase, userId);
  const { data: conversations, error: conversationsError } = await getDirectConversations(supabase);
  const { data: groups, error: groupsError } = await getGroups(supabase);

  return (
    <MemberDashboard
      profile={profile ?? null}
      currentUserId={userId}
      email={email}
      conversations={conversations ?? []}
      conversationsLoadFailed={Boolean(conversationsError)}
      groups={groups ?? []}
      groupsLoadFailed={Boolean(groupsError)}
      profileLoadFailed={Boolean(profileError)}
    />
  );
}

export default function ProtectedPage() {
  return (
    <Suspense
      fallback={
        <article className="glass-panel mx-auto w-full max-w-2xl rounded-[2rem] p-12 text-center text-sm text-muted-foreground">
          Preparing your room…
        </article>
      }
    >
      <ProfileAndDiscovery />
    </Suspense>
  );
}
