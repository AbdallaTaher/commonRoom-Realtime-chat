import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { DirectConversationView } from "@/components/protected/direct-conversation-view";
import { Button } from "@/components/ui/button";
import { getDirectConversation } from "@/lib/conversations/service";
import { validateConversationId } from "@/lib/conversations/validation";
import { listMessages } from "@/lib/messages/service";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

async function DirectConversationRoom({ conversationId }: { conversationId: string }) {
  await connection();
  if (!validateConversationId(conversationId)) notFound();

  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  const currentUserId = claims?.claims?.sub;
  if (claimsError || typeof currentUserId !== "string") redirect("/auth/login");

  const { data: conversation, error } = await getDirectConversation(supabase, conversationId);

  if (error) {
    return (
      <article className="glass-panel mx-auto w-full max-w-2xl rounded-[2rem] p-8 text-center" role="alert">
        <h1 className="text-2xl font-extrabold">Conversation unavailable</h1>
        <p className="mt-3 text-sm text-muted-foreground">We couldn’t load this conversation. Check your connection and try again.</p>
        <Button asChild className="mt-6" variant="outline"><Link href="/protected">Back to inbox</Link></Button>
      </article>
    );
  }

  if (!conversation) notFound();

  const { data: messagePage, error: messagesError } = await listMessages(supabase, conversationId);
  if (messagesError || !messagePage) {
    return (
      <article className="glass-panel mx-auto w-full max-w-2xl rounded-[2rem] p-8 text-center" role="alert">
        <h1 className="text-2xl font-extrabold">Messages unavailable</h1>
        <p className="mt-3 text-sm text-muted-foreground">We couldn’t load this conversation’s messages. Check your connection and try again.</p>
        <Button asChild className="mt-6" variant="outline"><Link href="/protected">Back to inbox</Link></Button>
      </article>
    );
  }

  return (
    <div className="direct-conversation-page">
      <DirectConversationView
        conversationId={conversationId}
        currentUserId={currentUserId}
        memberId={conversation.member_id}
        displayName={conversation.display_name}
        avatarPath={conversation.avatar_path}
        initialMessages={messagePage.messages}
        hasMore={messagePage.hasMore}
      />
    </div>
  );
}

async function DirectConversationPageContent({ params }: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return <DirectConversationRoom conversationId={conversationId} />;
}

export default function DirectConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  return (
    <Suspense fallback={<article className="glass-panel mx-auto w-full max-w-2xl rounded-[2rem] p-12 text-center text-sm text-muted-foreground">Opening conversation…</article>}>
      <DirectConversationPageContent params={params} />
    </Suspense>
  );
}
