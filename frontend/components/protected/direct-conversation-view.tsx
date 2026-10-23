"use client";

import { MessageThread } from "@/components/protected/message-thread";
import type { Message } from "@/lib/messages/service";

export function DirectConversationView({
  conversationId,
  currentUserId,
  memberId,
  displayName,
  avatarPath,
  initialMessages,
  hasMore,
}: {
  conversationId: string;
  currentUserId: string;
  memberId: string;
  displayName: string;
  avatarPath?: string | null;
  initialMessages: Message[];
  hasMore: boolean;
}) {
  return (
    <div className="direct-conversation-view">
      <MessageThread
        conversationId={conversationId}
        currentUserId={currentUserId}
        initialMessages={initialMessages}
        hasMore={hasMore}
        headerTitle={displayName}
        headerAvatarPath={avatarPath}
        headerMemberId={memberId}
      />
    </div>
  );
}
