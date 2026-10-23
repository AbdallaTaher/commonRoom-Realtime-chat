"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type FormEvent } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Check, CheckCheck, Ellipsis, Search, Smile, X } from "lucide-react";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import {
  getConversationReadReceiptsAction,
  loadOlderMessagesAction,
  markConversationReadAction,
  searchConversationMessagesAction,
  sendMessageAction,
  syncLatestMessagesAction,
} from "@/lib/actions/messages";
import type { Message, MessageReadReceipt } from "@/lib/messages/service";
import { MESSAGE_MAX_LENGTH } from "@/lib/messages/validation";
import { useConversationRealtime } from "@/lib/realtime/use-conversation-realtime";
import { useWorkspacePresence } from "@/lib/realtime/workspace-presence";
import { getAvatarUrl } from "@/lib/profiles/avatar-url";

function dayKey(value: string) {
  return value.slice(0, 10);
}

function formatDay(value: string) {
  const key = dayKey(value);
  const atNoonUtc = new Date(`${key}T12:00:00.000Z`);
  return new Intl.DateTimeFormat("en", {
    weekday: "long", month: "long", day: "numeric", timeZone: "UTC",
  }).format(atNoonUtc);
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric", minute: "2-digit", timeZone: "UTC",
  }).format(new Date(value));
}

export function MessageThread({
  conversationId,
  currentUserId,
  initialMessages,
  hasMore,
  headerTitle = "Conversation",
  headerSubtitle,
  headerAvatarPath,
  headerMemberId,
  headerIsGroup = false,
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
  hasMore: boolean;
  memberNames?: Record<string, string>;
  headerTitle?: string;
  headerSubtitle?: string;
  headerAvatarPath?: string | null;
  headerMemberId?: string;
  headerIsGroup?: boolean;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [canLoadMore, setCanLoadMore] = useState(hasMore);
  const [sendError, setSendError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<Message[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, startSearch] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuMessage, setMenuMessage] = useState("");
  const [receipts, setReceipts] = useState<Record<string, MessageReadReceipt>>({});
  const [sending, startSend] = useTransition();
  const [loadingOlder, startLoadingOlder] = useTransition();
  const requestId = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldStickToBottomRef = useRef(true);
  const historyScrollRef = useRef<{ height: number; top: number } | null>(null);

  const appendMessage = useCallback((message: Message) => {
    if (message.conversation_id !== conversationId) return;
    const list = messageListRef.current;
    shouldStickToBottomRef.current = !list || list.scrollHeight - list.clientHeight - list.scrollTop < 120;
    setMessages((current) => current.some((item) => item.id === message.id)
      ? current
      : [...current, message].sort((left, right) => left.created_at.localeCompare(right.created_at) || left.id.localeCompare(right.id)));
    if (message.sender_id !== currentUserId && document.visibilityState === "visible") {
      void markConversationReadAction(conversationId);
    }
  }, [conversationId, currentUserId]);

  const refreshReadReceipts = useCallback(async () => {
    try {
      const result = await getConversationReadReceiptsAction(conversationId);
      if (result.receipts) {
        setReceipts(Object.fromEntries(result.receipts.map((receipt) => [receipt.message_id, receipt])));
      }
    } catch {
      // Receipt updates are informational and should not block messaging.
    }
  }, [conversationId]);

  const syncLatestMessages = useCallback(async () => {
    try {
      const result = await syncLatestMessagesAction(conversationId);
      if (result.error || !result.page) return;
      setMessages((current) => {
        const byId = new Map(current.map((message) => [message.id, message]));
        result.page!.messages.forEach((message) => byId.set(message.id, message));
        return [...byId.values()].sort((left, right) => left.created_at.localeCompare(right.created_at) || left.id.localeCompare(right.id));
      });
      setCanLoadMore(result.page.hasMore);
      if (document.visibilityState === "visible") void markConversationReadAction(conversationId);
      void refreshReadReceipts();
    } catch {
      // A transient server-action failure should not break the live channel.
    }
  }, [conversationId, refreshReadReceipts]);

  const { connectionStatus, onlineUserIds: conversationOnlineUserIds } = useConversationRealtime({
    conversationId,
    currentUserId,
    onMessage: appendMessage,
    onChannelReady: () => { void syncLatestMessages(); },
    onReadReceipt: refreshReadReceipts,
  });
  const {
    onlineUserIds: workspaceOnlineUserIds,
    ready: workspacePresenceReady,
    connectionStatus: workspacePresenceStatus,
  } = useWorkspacePresence();

  useEffect(() => {
    if (connectionStatus !== "connected") return;
    const markIfVisible = () => {
      if (document.visibilityState === "visible") {
        void markConversationReadAction(conversationId).then(() => refreshReadReceipts());
      }
    };
    markIfVisible();
    document.addEventListener("visibilitychange", markIfVisible);
    return () => document.removeEventListener("visibilitychange", markIfVisible);
  }, [connectionStatus, conversationId, refreshReadReceipts]);

  useEffect(() => {
    const list = messageListRef.current;
    if (!list || searchResults !== null) return;
    if (historyScrollRef.current) {
      const { height, top } = historyScrollRef.current;
      list.scrollTop = top + list.scrollHeight - height;
      historyScrollRef.current = null;
    } else if (shouldStickToBottomRef.current) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages.length, searchResults]);

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;

    const formData = new FormData(event.currentTarget);
    const content = formData.get("content");
    if (typeof content !== "string" || !content.trim()) {
      setSendError("Write a message before sending.");
      textareaRef.current?.focus();
      return;
    }

    requestId.current ??= crypto.randomUUID();
    formData.set("clientMessageId", requestId.current);
    setSendError(null);

    startSend(async () => {
      const result = await sendMessageAction(formData);
      if (result.error || !result.message) {
        setSendError(result.error ?? "Your message couldn’t be sent. Try again.");
        textareaRef.current?.focus();
        return;
      }

      appendMessage(result.message);
      shouldStickToBottomRef.current = true;
      requestId.current = null;
      formRef.current?.reset();
      textareaRef.current?.focus();
      void refreshReadReceipts();
    });
  }

  function searchConversation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (searchText.trim().length < 2) {
      setSearchError("Enter at least 2 characters to search.");
      setSearchResults(null);
      return;
    }
    setSearchError(null);
    startSearch(async () => {
      const result = await searchConversationMessagesAction(conversationId, searchText);
      setSearchError(result.error);
      setSearchResults(result.messages);
    });
  }

  function insertEmoji() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.setRangeText("🙂", start, end, "end");
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.focus();
  }

  function loadOlderMessages() {
    const oldest = messages[0];
    if (!oldest || loadingOlder) return;
    const list = messageListRef.current;
    if (list) historyScrollRef.current = { height: list.scrollHeight, top: list.scrollTop };
    setHistoryError(null);

    startLoadingOlder(async () => {
      const result = await loadOlderMessagesAction(conversationId, oldest.created_at, oldest.id);
      if (result.error || !result.page) {
        historyScrollRef.current = null;
        setHistoryError(result.error ?? "Couldn’t load earlier messages.");
        return;
      }
      setMessages((current) => {
        const knownIds = new Set(current.map((message) => message.id));
        return [...result.page!.messages.filter((message) => !knownIds.has(message.id)), ...current];
      });
      setCanLoadMore(result.page.hasMore);
    });
  }

  async function copyConversationLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMenuMessage("Conversation link copied");
    } catch {
      setMenuMessage("Your browser couldn’t copy the link");
    }
  }

  const visibleMessages = searchResults ?? messages;
  const headerOnline = Boolean(headerMemberId && (
    (workspacePresenceStatus === "connected" && workspaceOnlineUserIds.includes(headerMemberId))
    || (connectionStatus === "connected" && conversationOnlineUserIds.includes(headerMemberId))
  ));
  const presenceResolved = workspacePresenceReady || connectionStatus === "connected";
  const headerStatus = headerMemberId
    ? headerOnline ? "Online now" : presenceResolved ? "Offline" : workspacePresenceStatus === "disconnected" ? "Status unavailable" : "Connecting…"
    : headerSubtitle ?? "Conversation";
  const headerAvatarUrl = getAvatarUrl(headerAvatarPath);

  return (
    <section className="message-thread" aria-label="Conversation messages">
      <header className="direct-conversation-header">
        <span className="direct-conversation-avatar-wrap">
          <span className={`direct-conversation-avatar ${headerIsGroup ? "group" : ""}`} aria-hidden="true">
            {headerAvatarUrl ? <Image src={headerAvatarUrl} alt="" width={46} height={46} unoptimized className="size-full rounded-full object-cover" /> : headerTitle.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase() ?? "").join("")}
          </span>
          {headerOnline && <span className="presence-indicator" aria-label="Online" />}
        </span>
        <div className="direct-conversation-heading min-w-0">
          <h1 className="truncate text-lg font-bold">{headerTitle}</h1>
          <p className={headerOnline ? "direct-presence online" : "direct-presence"} role="status" aria-live="polite">{headerStatus}</p>
        </div>
        <div className="message-live-status">
        <ThemeSwitcher />
        <Button type="button" variant="outline" size="icon" aria-label="Search messages" aria-expanded={searchOpen} onClick={() => { setSearchOpen((open) => !open); setSearchError(null); }}><Search aria-hidden="true" /></Button>
        {searchOpen && <form className="message-search-form" onSubmit={searchConversation}>
          <label className="sr-only" htmlFor={`message-search-${conversationId}`}>Search messages</label>
          <input
            id={`message-search-${conversationId}`}
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search messages"
            aria-describedby={`message-search-feedback-${conversationId}`}
          />
          <Button type="submit" variant="outline" size="icon" aria-label="Run message search" disabled={searching}><Search aria-hidden="true" /></Button>
          {searchResults !== null && <Button type="button" variant="ghost" size="icon" aria-label="Clear message search" onClick={() => { setSearchResults(null); setSearchText(""); setSearchError(null); }}><X aria-hidden="true" /></Button>}
        </form>}
        <div className="message-options-wrap">
          <Button type="button" variant="outline" size="icon" aria-label="Conversation options" aria-expanded={menuOpen} onClick={() => { setMenuOpen((open) => !open); setMenuMessage(""); }}><Ellipsis aria-hidden="true" /></Button>
          {menuOpen && (
            <div className="message-options-menu" role="menu">
              <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); setSearchResults(null); messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight, behavior: "smooth" }); }}>Jump to latest</button>
              <button type="button" role="menuitem" onClick={() => void copyConversationLink()}>Copy conversation link</button>
              {menuMessage && <span role="status">{menuMessage}</span>}
            </div>
          )}
        </div>
        </div>
      </header>
      <p id={`message-search-feedback-${conversationId}`} className="message-search-feedback" role="status" aria-live="polite">
        {searchError ?? (searchResults !== null ? `${searchResults.length} matching messages` : "")}
      </p>

      <div className="message-list" ref={messageListRef} aria-live="polite" aria-relevant="additions text">
        <div className="message-list-content">
          {searchResults === null && canLoadMore && (
            <div className="text-center">
              <Button type="button" variant="outline" size="sm" onClick={loadOlderMessages} disabled={loadingOlder}>
                <ArrowDown aria-hidden="true" />
                {loadingOlder ? "Loading…" : "Load earlier messages"}
              </Button>
            </div>
          )}
          {historyError && <p role="status" className="text-center text-sm text-destructive">{historyError}</p>}
          {visibleMessages.length === 0 ? (
            <div className="grid min-h-56 flex-1 place-items-center text-center">
              <div>
                <h2 className="text-lg font-bold">{searchResults ? "No matches found" : "No messages yet"}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{searchResults ? "Try a different word or phrase." : "Send a message to start the conversation."}</p>
              </div>
            </div>
          ) : visibleMessages.map((message, index) => {
            const mine = message.sender_id === currentUserId;
            const prior = visibleMessages[index - 1];
            const receipt = receipts[message.id];
            const isSeen = (receipt?.read_by_count ?? 0) > 0;
            return (
              <div className="message-day-group" key={message.id}>
                {(!prior || dayKey(prior.created_at) !== dayKey(message.created_at)) && <div className="message-day-divider"><span>{formatDay(message.created_at)}</span></div>}
                <div className={`message-row ${mine ? "mine" : "theirs"}`}>
                  <article className={`message-bubble ${mine ? "mine" : "theirs"}`}>
                    <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
                  </article>
                  <div className="message-meta">
                    <time dateTime={message.created_at}>{formatMessageTime(message.created_at)}</time>
                    {mine && <span className={`message-read-checks ${isSeen ? "seen" : "sent"}`} aria-label={isSeen ? "Seen" : "Sent"} title={isSeen ? "Seen" : "Sent"}>
                      {isSeen ? <CheckCheck aria-hidden="true" /> : <Check aria-hidden="true" />}
                      {isSeen && receipt && receipt.recipient_count > 1 && <small>{receipt.read_by_count}/{receipt.recipient_count}</small>}
                    </span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <form ref={formRef} onSubmit={submitMessage} className="message-composer">
        <input type="hidden" name="conversationId" value={conversationId} />
        <label className="sr-only" htmlFor={`message-${conversationId}`}>Write a message</label>
        <div className="message-composer-inner">
          <Button type="button" variant="ghost" size="icon" className="message-emoji-button" aria-label="Insert a smile emoji" onClick={insertEmoji} disabled={sending}><Smile aria-hidden="true" /></Button>
          <textarea
            ref={textareaRef}
            id={`message-${conversationId}`}
            name="content"
            rows={1}
            maxLength={MESSAGE_MAX_LENGTH}
            placeholder="Write a message…"
            className="min-h-10 flex-1 resize-none rounded-2xl border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            disabled={sending}
            aria-describedby={`message-feedback-${conversationId}`}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <Button type="submit" size="icon" aria-label="Send message" disabled={sending} className="size-10 shrink-0 rounded-xl">
            <ArrowUp aria-hidden="true" />
          </Button>
        </div>
        <p id={`message-feedback-${conversationId}`} className="mx-auto mt-1 min-h-4 max-w-4xl text-xs" aria-live="polite">
          {sendError && <span className="text-destructive">{sendError}</span>}
        </p>
      </form>
    </section>
  );
}
