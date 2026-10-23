import { connection } from "next/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { WorkspaceShell } from "@/components/protected/workspace-shell";
import { getDirectConversations } from "@/lib/conversations/service";
import { getGroups } from "@/lib/groups/service";
import { getProfile } from "@/lib/profiles/service";
import { createClient } from "@/lib/supabase/server";

async function WorkspaceContent({ children }: { children: React.ReactNode }) {
  await connection();
  const client = await createClient();
  const { data: claims, error } = await client.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (error || typeof userId !== "string") redirect("/auth/login");

  const [{ data: profile }, { data: conversations }, { data: groups }] = await Promise.all([
    getProfile(client, userId),
    getDirectConversations(client),
    getGroups(client),
  ]);

  return (
    <WorkspaceShell
      profile={profile ?? null}
      currentUserId={userId}
      conversations={conversations ?? []}
      groups={groups ?? []}
    >
      {children}
    </WorkspaceShell>
  );
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<main className="app-wallpaper min-h-svh grid place-items-center"><p className="rounded-2xl bg-background/85 px-5 py-3 text-sm text-muted-foreground">Opening your Commonroom…</p></main>}>
      <WorkspaceContent>{children}</WorkspaceContent>
    </Suspense>
  );
}
