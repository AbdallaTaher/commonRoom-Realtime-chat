import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { GroupDetails } from "@/components/protected/group-details";
import { Button } from "@/components/ui/button";
import { getGroup } from "@/lib/groups/service";
import { validateGroupId } from "@/lib/groups/validation";
import { listMessages } from "@/lib/messages/service";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function GroupPageContent({ groupId }: { groupId: string }) {
  await connection();
  if (!validateGroupId(groupId)) notFound();

  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  const currentUserId = claims?.claims?.sub;
  if (claimsError || typeof currentUserId !== "string") redirect("/auth/login");

  const { data: members, error } = await getGroup(supabase, groupId);

  if (error) {
    return (
      <article className="glass-panel mx-auto w-full max-w-2xl rounded-[2rem] p-8 text-center" role="alert">
        <h1 className="text-2xl font-extrabold">Group unavailable</h1>
        <p className="mt-3 text-sm text-muted-foreground">We couldn’t load this group. Check your connection and try again.</p>
        <Button asChild className="mt-6" variant="outline"><Link href="/protected">Back to your inbox</Link></Button>
      </article>
    );
  }

  if (!members?.length) notFound();

  const { data: messagePage, error: messagesError } = await listMessages(supabase, groupId);
  if (messagesError || !messagePage) {
    return (
      <article className="glass-panel mx-auto w-full max-w-2xl rounded-[2rem] p-8 text-center" role="alert">
        <h1 className="text-2xl font-extrabold">Messages unavailable</h1>
        <p className="mt-3 text-sm text-muted-foreground">We couldn’t load this group’s messages. Check your connection and try again.</p>
        <Button asChild className="mt-6" variant="outline"><Link href="/protected">Back to inbox</Link></Button>
      </article>
    );
  }

  return (
    <GroupDetails
      members={members}
      currentUserId={currentUserId}
      messages={messagePage.messages}
      hasMoreMessages={messagePage.hasMore}
    />
  );
}

async function GroupRoute({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  return <GroupPageContent groupId={groupId} />;
}

export default function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  return (
    <Suspense fallback={<article className="glass-panel mx-auto w-full max-w-2xl rounded-[2rem] p-12 text-center text-sm text-muted-foreground">Opening your group…</article>}>
      <GroupRoute params={params} />
    </Suspense>
  );
}
