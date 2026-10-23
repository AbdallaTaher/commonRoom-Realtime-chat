"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ArrowLeft, MessageCircle, MessagesSquare, Mountain, SlidersHorizontal, UserRound, UsersRound } from "lucide-react";

import { LogoutButton } from "@/components/logout-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { appConfig } from "@/data/app-config";
import type { DirectConversation } from "@/lib/conversations/service";
import type { GroupConversation } from "@/lib/groups/service";
import type { Profile } from "@/lib/profiles/service";
import { getAvatarUrl } from "@/lib/profiles/avatar-url";
import { useWorkspacePresence, WorkspacePresenceProvider } from "@/lib/realtime/workspace-presence";

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase() ?? "").join("");
}

export function WorkspaceShell({
  children,
  conversations,
  groups,
  profile,
  currentUserId,
}: {
  children: React.ReactNode;
  conversations: DirectConversation[];
  groups: GroupConversation[];
  profile: Profile | null;
  currentUserId: string;
}) {
  return (
    <WorkspacePresenceProvider currentUserId={currentUserId}>
      <WorkspaceShellContent conversations={conversations} groups={groups} profile={profile}>
        {children}
      </WorkspaceShellContent>
    </WorkspacePresenceProvider>
  );
}

function WorkspaceShellContent({ children, conversations, groups, profile }: {
  children: React.ReactNode;
  conversations: DirectConversation[];
  groups: GroupConversation[];
  profile: Profile | null;
}) {
  const pathname = usePathname();
  const isInbox = pathname === "/protected";
  const isChats = isInbox || pathname.startsWith("/protected/conversations/");
  const isContacts = pathname === "/protected/contacts";
  const isGroups = pathname === "/protected/groups" || pathname.startsWith("/protected/groups/");
  const { onlineUserIds } = useWorkspacePresence();

  return (
    <main className="app-wallpaper workspace-viewport">
      <header className="workspace-mobile-header">
        <Link href="/protected" className="workspace-brand" aria-label={`${appConfig.name} inbox`}>
          <span><MessagesSquare aria-hidden="true" /></span>{appConfig.name.toLowerCase()}
        </Link>
        <div className="flex items-center gap-2">{!isInbox && <ThemeSwitcher />}<LogoutButton /></div>
      </header>
      <div className="workspace-shell">
        <nav className="workspace-rail" aria-label="Main navigation">
          <Link href="/protected" className="workspace-mark" aria-label={`${appConfig.name} home`}>
            <MessagesSquare aria-hidden="true" />
          </Link>
          <Link href="/protected" className={`workspace-rail-link${isChats ? " active" : ""}`} aria-label="Chats" title="Chats" aria-current={isChats ? "page" : undefined}>
            <MessageCircle aria-hidden="true" />
          </Link>
          <Link href="/protected/contacts" className={`workspace-rail-link${isContacts ? " active" : ""}`} aria-label="Contacts" title="Contacts" aria-current={isContacts ? "page" : undefined}>
            <UsersRound aria-hidden="true" />
          </Link>
          <Link href="/protected/groups" className={`workspace-rail-link${isGroups ? " active" : ""}`} aria-label="Groups" title="Groups" aria-current={isGroups ? "page" : undefined}>
            <Mountain aria-hidden="true" />
          </Link>
          <Link href="/protected#profile" className="workspace-rail-link" aria-label="Settings" title="Settings">
            <SlidersHorizontal aria-hidden="true" />
          </Link>
          <div className="workspace-rail-bottom">
            <Link href="/protected#profile" className="workspace-profile-link" aria-label="Your profile" title="Your profile">
              <span>{profile && getAvatarUrl(profile.avatar_path) ? <Image src={getAvatarUrl(profile.avatar_path)!} alt="" width={40} height={40} unoptimized /> : profile ? initials(profile.display_name) : <UserRound aria-hidden="true" />}</span>
            </Link>
            {!isInbox && <ThemeSwitcher />}
            <LogoutButton />
          </div>
        </nav>
        {!isInbox && (
          <aside className="workspace-pinned" aria-label="Pinned conversations">
            <header className="workspace-pinned-brand">
              <span>{appConfig.name.toLowerCase()}</span>
              <Link href="/protected" aria-label="Back to inbox"><ArrowLeft aria-hidden="true" /></Link>
            </header>
            <div className="workspace-pinned-list">
              <p>Pinned</p>
              {conversations.slice(0, 5).map((conversation) => (
                <Link
                  key={conversation.conversation_id}
                  href={`/protected/conversations/${conversation.conversation_id}`}
                  className={pathname.endsWith(conversation.conversation_id) ? "selected" : ""}
                >
                  <span className="workspace-pinned-avatar-wrap">
                    <span className="workspace-pinned-avatar">
                      {getAvatarUrl(conversation.avatar_path) ? <Image src={getAvatarUrl(conversation.avatar_path)!} alt="" width={40} height={40} unoptimized /> : initials(conversation.display_name)}
                    </span>
                    {onlineUserIds.includes(conversation.member_id) && <span className="presence-indicator" aria-label="Online" />}
                  </span>
                  <span><strong>{conversation.display_name}</strong><small className={onlineUserIds.includes(conversation.member_id) ? "online" : ""}>{onlineUserIds.includes(conversation.member_id) ? "Online now" : "Direct conversation"}</small></span>
                </Link>
              ))}
              {groups.slice(0, 5).map((group) => (
                <Link
                  key={group.conversation_id}
                  href={`/protected/groups/${group.conversation_id}`}
                  className={pathname.endsWith(group.conversation_id) ? "selected" : ""}
                >
                  <span className="workspace-pinned-avatar-wrap">
                    <span className="workspace-pinned-avatar group"><Mountain aria-hidden="true" /></span>
                    {(group.member_ids ?? []).some((id) => id !== profile?.id && onlineUserIds.includes(id)) && <span className="presence-indicator" aria-label="A member is online" />}
                  </span>
                  <span><strong>{group.group_name}</strong><small>{group.member_count} members</small></span>
                </Link>
              ))}
              {!conversations.length && !groups.length && <small className="workspace-pinned-empty">Your chats will appear here.</small>}
            </div>
            <div className="workspace-pinned-note">
              <span aria-hidden="true">✦</span>
              <strong>Make time for your people</strong>
              <small>A small hello can make someone’s day.</small>
            </div>
          </aside>
        )}
        <section className="workspace-main">{children}</section>
      </div>
    </main>
  );
}
