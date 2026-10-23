"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState, useEffect, useMemo, useState } from "react";
import { MessagesSquare, Search, SquarePen, UserRound, UsersRound, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { startDirectConversationAction } from "@/lib/actions/conversations";
import { createGroupAction } from "@/lib/actions/groups";
import { saveProfileAction, searchMembersAction } from "@/lib/actions/profiles";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { useWorkspacePresence } from "@/lib/realtime/workspace-presence";
import type { DirectConversation } from "@/lib/conversations/service";
import type { GroupConversation } from "@/lib/groups/service";
import type { Profile } from "@/lib/profiles/service";
import { getAvatarUrl } from "@/lib/profiles/avatar-url";

const initialProfileActionState = { error: null, success: null, profile: null };
const initialMemberSearchState = { error: null, query: "", members: [] };
const initialStartConversationState = { error: null, conversationId: null };
const initialGroupCreateState = { error: null, groupId: null };

function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase() ?? "").join("");
}

function safeTimestamp(...values: Array<string | null | undefined>) {
  return values.find((value) => typeof value === "string" && Number.isFinite(Date.parse(value))) ?? "";
}

function Avatar({ name, path, className }: { name: string; path?: string | null; className: string }) {
  const src = getAvatarUrl(path);
  return <span className={className} aria-hidden="true">
    {src ? <Image src={src} alt="" width={48} height={48} unoptimized className="size-full rounded-full object-cover" /> : getInitials(name) || <UserRound />}
  </span>;
}

function MemberResult({ member, selected, onToggle }: {
  member: Profile;
  selected: boolean;
  onToggle: (memberId: string) => void;
}) {
  const [state, action, pending] = useActionState(startDirectConversationAction, initialStartConversationState);

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl p-2 transition-colors hover:bg-accent/60">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary" aria-hidden="true">
        {getInitials(member.display_name) || <UserRound className="size-4" />}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{member.display_name}</span>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input type="checkbox" checked={selected} onChange={() => onToggle(member.id)} aria-label={`Add ${member.display_name} to group`} />
        Group
      </label>
      {state.conversationId ? (
        <Link className="text-sm font-semibold text-primary hover:underline" href={`/protected/conversations/${state.conversationId}`}>Open chat</Link>
      ) : (
        <form action={action}>
          <input type="hidden" name="memberId" value={member.id} />
          <Button type="submit" size="sm" variant="outline" disabled={pending}>{pending ? "Starting…" : "Message"}</Button>
        </form>
      )}
      {state.error && <p className="basis-full text-xs text-destructive" role="status">{state.error}</p>}
    </li>
  );
}

export function MemberDashboard({
  profile,
  email,
  currentUserId,
  conversations,
  groups,
  conversationsLoadFailed = false,
  groupsLoadFailed = false,
  profileLoadFailed = false,
}: {
  profile: Profile | null;
  email: string | null;
  currentUserId: string;
  conversations: DirectConversation[];
  groups: GroupConversation[];
  conversationsLoadFailed?: boolean;
  groupsLoadFailed?: boolean;
  profileLoadFailed?: boolean;
}) {
  const [profileState, saveAction, savePending] = useActionState(saveProfileAction, initialProfileActionState);
  const [searchState, searchAction, searchPending] = useActionState(searchMembersAction, initialMemberSearchState);
  const [groupState, createGroup, groupPending] = useActionState(createGroupAction, initialGroupCreateState);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "groups">("all");
  const [dialog, setDialog] = useState<"new" | "profile" | null>(null);
  const [todayLabel, setTodayLabel] = useState("");
  const [nowMs, setNowMs] = useState(0);
  const { onlineUserIds } = useWorkspacePresence();

  useEffect(() => {
    setTodayLabel(new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date()).toUpperCase());
    setNowMs(Date.now());
    const timer = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const openDialogFromHash = () => {
      if (window.location.hash === "#profile") setDialog("profile");
      if (window.location.hash === "#new") setDialog("new");
      if (window.location.hash === "#groups") { setDialog(null); setFilter("groups"); }
    };
    openDialogFromHash();
    window.addEventListener("hashchange", openDialogFromHash);
    return () => window.removeEventListener("hashchange", openDialogFromHash);
  }, []);

  const rows = useMemo(() => [
    ...conversations.map((conversation) => ({
      id: conversation.conversation_id,
      name: conversation.display_name,
      kind: "direct" as const,
      detail: conversation.last_message
        ? `${conversation.last_message_sender_id === currentUserId ? "You: " : ""}${conversation.last_message}`
        : "Start a conversation",
      href: `/protected/conversations/${conversation.conversation_id}`,
      initials: getInitials(conversation.display_name),
      avatarPath: conversation.avatar_path ?? null,
      startedAt: safeTimestamp(conversation.last_message_at, conversation.started_at),
      unreadCount: Number(conversation.unread_count),
      isOnline: onlineUserIds.includes(conversation.member_id),
      hasOnlineMember: onlineUserIds.includes(conversation.member_id),
    })),
    ...groups.map((group) => ({
      id: group.conversation_id,
      name: group.group_name,
      kind: "group" as const,
      detail: group.last_message
        ? `${group.last_message_sender_id === currentUserId ? "You: " : ""}${group.last_message}`
        : `${group.member_count} members`,
      href: `/protected/groups/${group.conversation_id}`,
      initials: getInitials(group.group_name),
      avatarPath: null,
      startedAt: safeTimestamp(group.last_message_at, group.started_at),
      unreadCount: Number(group.unread_count),
      isOnline: false,
      hasOnlineMember: (group.member_ids ?? []).some((id) => id !== currentUserId && onlineUserIds.includes(id)),
    })),
  ].filter((row) => (filter === "all" || (filter === "groups" && row.kind === "group") || (filter === "unread" && row.unreadCount > 0))
    && row.name.toLocaleLowerCase().includes(searchText.trim().toLocaleLowerCase()))
    .sort((left, right) => right.startedAt.localeCompare(left.startedAt)), [conversations, currentUserId, filter, groups, onlineUserIds, searchText]);

  function toggleGroupMember(memberId: string) {
    setSelectedMemberIds((current) => {
      if (current.includes(memberId)) return current.filter((id) => id !== memberId);
      if (current.length >= 20) return current;
      return [...current, memberId];
    });
  }

  function closeDialog() {
    setDialog(null);
    if (dialog === "new") setSelectedMemberIds([]);
    if (["#new", "#profile", "#groups"].includes(window.location.hash)) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }

  return (
    <div className="inbox-workspace" aria-label="Commonroom inbox">
      <aside className="inbox-sidebar" aria-label="Conversations">
        <header className="inbox-heading">
          <div>
            <p className="inbox-kicker">{todayLabel || "YOUR COMMONROOM"}</p>
            <h1>Messages</h1>
          </div>
          <div className="inbox-heading-actions">
            <Button type="button" size="icon" aria-label="New conversation" title="New conversation" onClick={() => setDialog("new")}>
              <SquarePen aria-hidden="true" />
            </Button>
            <ThemeSwitcher />
          </div>
        </header>
        <label className="inbox-search">
          <Search aria-hidden="true" />
          <span className="sr-only">Search conversations</span>
          <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search conversations" />
        </label>
        <div className="inbox-filters" aria-label="Filter conversations">
          <button type="button" className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All <span>{conversations.length + groups.length}</span></button>
          <button type="button" className={filter === "unread" ? "active" : ""} onClick={() => setFilter("unread")}>Unread <span>{rows.filter((row) => row.unreadCount > 0).length}</span></button>
          <button type="button" className={filter === "groups" ? "active" : ""} onClick={() => setFilter("groups")}>Groups</button>
        </div>
        <section className="inbox-list scrollbar-thin" aria-label="Recent conversations">
          <p className="inbox-list-label">Recent</p>
          {conversationsLoadFailed || groupsLoadFailed ? (
            <p className="inbox-empty" role="status">We couldn’t load all your conversations. Refresh the page to try again.</p>
          ) : rows.length === 0 ? (
            <p className="inbox-empty">{searchText ? "No conversations found. Try another name." : "Your conversations will appear here."}</p>
          ) : rows.map((row) => (
            <Link key={row.id} href={row.href} className={`inbox-row ${row.unreadCount ? "unread" : ""}`}>
              <span className="inbox-avatar-wrap" aria-hidden="true">
                {row.kind === "direct" && row.avatarPath
                  ? <Avatar name={row.name} path={row.avatarPath} className="inbox-avatar" />
                  : <span className={`inbox-avatar ${row.kind === "group" ? "group" : ""}`}>
                    {row.kind === "group" ? <UsersRound /> : row.initials || <UserRound />}
                  </span>}
                {row.hasOnlineMember && <span className="presence-indicator" />}
              </span>
              <span className="inbox-row-copy">
                <strong>{row.name}</strong>
                <small>{row.detail}</small>
              </span>
              <span className="inbox-row-meta">
                  <time dateTime={row.startedAt}>{formatInboxTime(row.startedAt, nowMs)}</time>
                {row.unreadCount > 0 && <span className="inbox-unread-count">{row.unreadCount}</span>}
              </span>
            </Link>
          ))}
        </section>
        <footer id="profile" className="inbox-profile">
          <button type="button" className="inbox-profile-button" onClick={() => setDialog("profile")} aria-label="Your profile">
            {profile ? <Avatar name={profileState.profile?.display_name ?? profile.display_name} path={profileState.profile?.avatar_path ?? profile.avatar_path} className="profile-avatar" /> : <span className="profile-avatar"><UserRound /></span>}
            <span className="inbox-row-copy"><strong>{profileState.profile?.display_name ?? profile?.display_name ?? "Your profile"}</strong><small>{email ?? profileState.profile?.bio ?? profile?.bio ?? "Edit profile"}</small></span>
          </button>
        </footer>
      </aside>

      <section className="inbox-welcome" aria-label="Inbox welcome">
        <div className="inbox-welcome-overlay" />
        <div className="inbox-welcome-content">
          <span className="inbox-welcome-icon"><MessagesSquare aria-hidden="true" /></span>
          <h2>Room for a good conversation</h2>
          <p>Choose a chat from your inbox, or start a new one. Your best conversations are just a hello away.</p>
          <Button type="button" onClick={() => setDialog("new")}><SquarePen aria-hidden="true" />Start a conversation</Button>
          <div className="inbox-privacy-note"><span aria-hidden="true">✓</span><span><strong>Your space stays yours</strong><small>Private chats, only for your people.</small></span></div>
        </div>
      </section>

      {dialog && (
        <div className="workspace-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
          <section className="workspace-modal" role="dialog" aria-modal="true" aria-labelledby="workspace-modal-title">
            <header className="workspace-modal-header">
              <div>
                <h2 id="workspace-modal-title">{dialog === "new" ? "Start a conversation" : "Your profile"}</h2>
              <p>{dialog === "new" ? "Find someone or make a group." : "Update the details other members see."}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label="Close" onClick={closeDialog}><X aria-hidden="true" /></Button>
            </header>

            {dialog === "new" ? (
              <div className="workspace-modal-body">
                <form action={searchAction} className="inbox-search modal-search">
                  <Search aria-hidden="true" />
                  <label className="sr-only" htmlFor="member-query">Search members by display name</label>
                  <input id="member-query" name="query" defaultValue={searchState.query} minLength={2} maxLength={40} placeholder="Search by name" />
                  <Button type="submit" size="sm" disabled={searchPending}>{searchPending ? "Searching…" : "Search"}</Button>
                </form>
                <div className="modal-results" aria-live="polite">
                  {searchState.error ? <p className="text-sm text-destructive" role="status">{searchState.error}</p> : searchState.members.length ? (
                    <ul>{searchState.members.map((member) => <MemberResult key={member.id} member={member} selected={selectedMemberIds.includes(member.id)} onToggle={toggleGroupMember} />)}</ul>
                  ) : <p className="text-sm text-muted-foreground">Search by display name. Email addresses stay private.</p>}
                </div>
                <form action={createGroup} className="create-group-form">
                  <input type="hidden" name="memberIds" value={JSON.stringify(selectedMemberIds)} />
                  <label htmlFor="groupName">Create a group</label>
                  <div className="flex gap-2"><Input id="groupName" name="groupName" placeholder="Group name" minLength={2} maxLength={60} required /><Button type="submit" disabled={groupPending || selectedMemberIds.length === 0}>{groupPending ? "Creating…" : `Create (${selectedMemberIds.length}/20)`}</Button></div>
                  {groupState.error && <p className="text-xs text-destructive" role="status">{groupState.error}</p>}
                  {groupState.groupId && <Link className="text-sm font-semibold text-primary hover:underline" href={`/protected/groups/${groupState.groupId}`}>Open your group</Link>}
                </form>
              </div>
            ) : (
              <div className="workspace-modal-body">
                {email && <p className="mb-4 break-all text-sm text-muted-foreground">Signed in as {email}</p>}
                {profileLoadFailed && <p role="status" className="mb-3 text-sm text-destructive">We couldn’t load your profile. Check that the profile database setup has been applied.</p>}
                <form action={saveAction} className="space-y-3">
                  <label htmlFor="displayName" className="text-sm font-semibold">Your display name</label>
                  <Input id="displayName" name="displayName" defaultValue={profileState.profile?.display_name ?? profile?.display_name ?? ""} minLength={2} maxLength={60} autoComplete="name" required disabled={!profile} />
                  <label htmlFor="bio" className="block text-sm font-semibold">Bio <span className="font-normal text-muted-foreground">(160 characters max)</span></label>
                  <textarea id="bio" name="bio" defaultValue={profileState.profile?.bio ?? profile?.bio ?? ""} maxLength={160} rows={3} placeholder="A little about you" className="w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" disabled={!profile} />
                  <label htmlFor="avatar" className="block text-sm font-semibold">Profile photo <span className="font-normal text-muted-foreground">(PNG, JPG, WebP; up to 2 MB)</span></label>
                  <input id="avatar" name="avatar" type="file" accept="image/png,image/jpeg,image/webp" className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-semibold file:text-foreground" disabled={!profile} />
                  {profileState.error && <p className="text-sm text-destructive" role="alert">{profileState.error}</p>}
                  {profileState.success && <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">{profileState.success}</p>}
                  <Button type="submit" disabled={savePending || !profile}>{savePending ? "Saving…" : "Save profile"}</Button>
                </form>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function formatInboxTime(value: string, nowMs: number) {
  if (!value || !nowMs) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const age = Math.max(0, nowMs - date.getTime());
  const minutes = Math.floor(age / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  if (hours < 48) return "Yesterday";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}
