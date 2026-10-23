"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  ArrowLeft,
  ArrowUp,
  MessageCircle,
  MessagesSquare,
  Mountain,
  Search,
  UsersRound,
} from "lucide-react";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { initialDemoConversations, type DemoConversation, type DemoMessage } from "@/data/demo-workspace";

type ConversationFilter = "all" | "unread" | "groups" | "contacts";

function previewFor(conversation: DemoConversation) {
  const latest = conversation.messages.at(-1);
  if (!latest) return "No sample messages";
  return `${latest.mine ? "You: " : ""}${latest.content}`;
}

function unreadTotal(conversations: DemoConversation[]) {
  return conversations.reduce((total, conversation) => total + conversation.unreadCount, 0);
}

export function DemoWorkspace() {
  const [conversations, setConversations] = useState(initialDemoConversations);
  const [activeId, setActiveId] = useState(initialDemoConversations[0].id);
  const [filter, setFilter] = useState<ConversationFilter>("all");
  const [searchText, setSearchText] = useState("");
  const [draft, setDraft] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "conversation">("list");
  const [sendError, setSendError] = useState("");
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const activeConversation = conversations.find((conversation) => conversation.id === activeId) ?? conversations[0];
  const visibleConversations = useMemo(() => {
    const normalizedSearch = searchText.trim().toLocaleLowerCase();
    return conversations.filter((conversation) => {
      const matchesFilter = filter === "all"
        || (filter === "unread" && conversation.unreadCount > 0)
        || (filter === "groups" && conversation.kind === "group")
        || (filter === "contacts" && conversation.kind === "direct");
      return matchesFilter && conversation.name.toLocaleLowerCase().includes(normalizedSearch);
    });
  }, [conversations, filter, searchText]);

  function openConversation(conversation: DemoConversation) {
    setActiveId(conversation.id);
    setMobileView("conversation");
    setConversations((current) => current.map((item) => item.id === conversation.id
      ? { ...item, unreadCount: 0 }
      : item));
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) {
      setSendError("Write a demo message before sending.");
      composerRef.current?.focus();
      return;
    }

    const message: DemoMessage = {
      id: `demo-${Date.now()}-${activeId}`,
      sender: "Alex",
      content,
      time: "Just now · demo",
      mine: true,
    };
    setConversations((current) => current.map((conversation) => conversation.id === activeId
      ? { ...conversation, messages: [...conversation.messages, message] }
      : conversation));
    setDraft("");
    setSendError("");
    composerRef.current?.focus();
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function changeFilter(nextFilter: ConversationFilter) {
    setFilter(nextFilter);
    setMobileView("list");
  }

  return (
    <main className="app-wallpaper workspace-viewport demo-viewport" aria-label="Portfolio demo">
      <div className="demo-preview-banner" role="status">
        <div className="demo-preview-copy">
          <span className="demo-preview-badge">Demo mode</span>
          <span>Fictional sample data. Your messages stay in this browser and reset when you leave.</span>
        </div>
        <div className="demo-preview-actions">
          <Link href="/auth/sign-up" className="demo-create-account">Create account</Link>
          <Link href="/" className="demo-exit-link">Exit demo</Link>
        </div>
      </div>

      <div className={`workspace-shell demo-shell demo-mobile-${mobileView}`}>
        <nav className="workspace-rail" aria-label="Demo navigation">
          <Link href="/" className="workspace-mark" aria-label="Back to Commonroom home">
            <MessagesSquare aria-hidden="true" />
          </Link>
          <Button type="button" variant="ghost" className={`workspace-rail-link${filter === "all" || filter === "unread" ? " active" : ""}`} aria-label="Chats" aria-current={filter === "all" || filter === "unread" ? "page" : undefined} onClick={() => changeFilter("all")}>
            <MessageCircle aria-hidden="true" />
          </Button>
          <Button type="button" variant="ghost" className={`workspace-rail-link${filter === "contacts" ? " active" : ""}`} aria-label="Contacts" aria-current={filter === "contacts" ? "page" : undefined} onClick={() => changeFilter("contacts")}>
            <UsersRound aria-hidden="true" />
          </Button>
          <Button type="button" variant="ghost" className={`workspace-rail-link${filter === "groups" ? " active" : ""}`} aria-label="Groups" aria-current={filter === "groups" ? "page" : undefined} onClick={() => changeFilter("groups")}>
            <Mountain aria-hidden="true" />
          </Button>
          <span className="demo-profile-avatar" aria-label="Sample profile Alex Morgan">A</span>
        </nav>

        <aside className="inbox-sidebar demo-sidebar" aria-label="Demo conversations">
          <header className="inbox-heading demo-inbox-heading">
            <div>
              <p className="inbox-kicker">Portfolio preview</p>
              <h1>Messages</h1>
            </div>
            <div className="inbox-heading-actions">
              <ThemeSwitcher />
            </div>
          </header>

          <label className="inbox-search demo-search">
            <Search aria-hidden="true" />
            <span className="sr-only">Search demo conversations</span>
            <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search conversations" />
          </label>

          <div className="inbox-filters" aria-label="Filter demo conversations">
            <button type="button" className={filter === "all" ? "active" : ""} aria-pressed={filter === "all"} onClick={() => changeFilter("all")}>All <span>{conversations.length}</span></button>
            <button type="button" className={filter === "unread" ? "active" : ""} aria-pressed={filter === "unread"} onClick={() => changeFilter("unread")}>Unread <span>{unreadTotal(conversations)}</span></button>
            <button type="button" className={filter === "groups" ? "active" : ""} aria-pressed={filter === "groups"} onClick={() => changeFilter("groups")}>Groups</button>
          </div>

          <section className="inbox-list demo-conversation-list" aria-label="Recent demo conversations">
            <p className="inbox-list-label">Recent · fictional members</p>
            {visibleConversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                className={`inbox-row demo-conversation-row${conversation.id === activeId ? " selected" : ""}${conversation.unreadCount ? " unread" : ""}`}
                onClick={() => openConversation(conversation)}
                aria-current={conversation.id === activeId ? "true" : undefined}
              >
                <span className="demo-avatar-wrap">
                  <span className={`inbox-avatar${conversation.kind === "group" ? " group" : ""}`} aria-hidden="true">{conversation.initials}</span>
                  {conversation.online && <span className="presence-indicator" aria-hidden="true" />}
                </span>
                <span className="inbox-row-copy">
                  <strong>{conversation.name}</strong>
                  <small>{previewFor(conversation)}</small>
                </span>
                <span className="inbox-row-meta">
                  <time>{conversation.messages.at(-1)?.time.split(" · ")[0] ?? ""}</time>
                  {conversation.unreadCount > 0 && <span className="inbox-unread-count">{conversation.unreadCount}</span>}
                </span>
              </button>
            ))}
            {visibleConversations.length === 0 && (
              <p className="inbox-empty" role="status">No demo conversations match. Try another name or filter.</p>
            )}
          </section>

          <div className="demo-sidebar-note">
            <strong>Make time for your people</strong>
            <span>Try the chat controls. Nothing here reaches a real person.</span>
          </div>
        </aside>

        <section className="workspace-main demo-main" aria-label="Demo chat">
          <section className="message-thread demo-thread" aria-label={`${activeConversation.name} demo conversation`}>
            <header className="direct-conversation-header demo-chat-header">
              <Button type="button" variant="ghost" size="icon" className="demo-back-to-list" aria-label="Back to conversations" onClick={() => setMobileView("list")}>
                <ArrowLeft aria-hidden="true" />
              </Button>
              <span className="direct-conversation-avatar-wrap">
                <span className={`direct-conversation-avatar${activeConversation.kind === "group" ? " group" : ""}`} aria-hidden="true">{activeConversation.initials}</span>
                {activeConversation.online && <span className="presence-indicator" aria-hidden="true" />}
              </span>
              <div className="direct-conversation-heading min-w-0">
                <h2 className="truncate text-lg font-bold">{activeConversation.name}</h2>
                <p className={activeConversation.online ? "direct-presence online" : "direct-presence"} role="status">
                  {activeConversation.online && <span className="presence-indicator-inline" aria-hidden="true" />}
                  {activeConversation.status} · demo
                </p>
              </div>
              <span className="demo-chat-tools" aria-hidden="true"><Search /><span>⋯</span></span>
            </header>

            <div className="demo-message-wall">
              <div className="demo-message-wall-overlay" />
              <div className="message-list" aria-live="polite" aria-label={`${activeConversation.name} sample messages`}>
                <div className="message-list-content">
                  <div className="message-day-divider"><span>Today · May 20</span></div>
                  {activeConversation.messages.map((message) => (
                    <div className={`message-row ${message.mine ? "mine" : "theirs"}`} key={message.id}>
                      <article className={`message-bubble ${message.mine ? "mine" : "theirs"}`}>
                        {activeConversation.kind === "group" && !message.mine && <span className="demo-message-sender">{message.sender}</span>}
                        <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
                      </article>
                      <div className="message-meta"><time>{message.time}</time>{message.mine && <span className="message-read-checks seen" aria-label="Demo message seen">✓✓</span>}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <form className="message-composer demo-composer" onSubmit={sendMessage}>
              <label className="sr-only" htmlFor="demo-message">Write a demo message</label>
              <div className="message-composer-inner">
                <textarea
                  ref={composerRef}
                  id="demo-message"
                  value={draft}
                  onChange={(event) => { setDraft(event.target.value); if (sendError) setSendError(""); }}
                  onKeyDown={handleComposerKeyDown}
                  rows={1}
                  maxLength={1000}
                  placeholder="Write a demo message…"
                  aria-describedby="demo-message-help demo-message-error"
                />
                <Button type="submit" size="icon" aria-label="Send demo message" className="size-10 shrink-0 rounded-xl"><ArrowUp aria-hidden="true" /></Button>
              </div>
              <p id="demo-message-help" className="demo-composer-help">Simulated locally · only visible in this demo · Enter sends, Shift+Enter adds a line</p>
              <p id="demo-message-error" className="demo-composer-error" role="status">{sendError}</p>
            </form>
          </section>
        </section>
      </div>
    </main>
  );
}
