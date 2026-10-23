"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowLeft, MessageCircle, Search, UsersRound, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createGroupAction } from "@/lib/actions/groups";
import { startDirectConversationAction } from "@/lib/actions/conversations";
import { searchMembersAction } from "@/lib/actions/profiles";
import { getAvatarUrl } from "@/lib/profiles/avatar-url";
import type { Profile } from "@/lib/profiles/service";

const initialSearchState = { error: null, query: "", members: [] };
const initialConversationState = { error: null, conversationId: null };
const initialGroupState = { error: null, groupId: null };

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase() ?? "").join("");
}

function ContactRow({ member, groupMode, selected, onToggle }: {
  member: Profile;
  groupMode: boolean;
  selected: boolean;
  onToggle: (memberId: string) => void;
}) {
  const [state, action, pending] = useActionState(startDirectConversationAction, initialConversationState);
  const avatarUrl = getAvatarUrl(member.avatar_path);

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-card/90 p-4 shadow-sm">
      <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary" aria-hidden="true">
        {avatarUrl ? <Image src={avatarUrl} alt="" width={48} height={48} unoptimized className="size-full object-cover" /> : initials(member.display_name) || <UserRound className="size-5" />}
      </span>
      <span className="min-w-0 flex-1 truncate font-semibold">{member.display_name}</span>
      {groupMode && (
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={selected} onChange={() => onToggle(member.id)} aria-label={`Select ${member.display_name} for the group`} />
          Add to group
        </label>
      )}
      {state.conversationId ? (
        <Button asChild size="sm" variant="outline"><Link href={`/protected/conversations/${state.conversationId}`}>Open chat</Link></Button>
      ) : (
        <form action={action}>
          <input type="hidden" name="memberId" value={member.id} />
          <Button type="submit" size="sm" variant="outline" disabled={pending}>
            <MessageCircle aria-hidden="true" />{pending ? "Opening…" : "Message"}
          </Button>
        </form>
      )}
      {state.error && <p className="basis-full text-sm text-destructive" role="status">{state.error}</p>}
    </li>
  );
}

export function ContactsPage({ groupMode = false }: { groupMode?: boolean }) {
  const [searchState, searchAction, searchPending] = useActionState(searchMembersAction, initialSearchState);
  const [groupState, makeGroup, groupPending] = useActionState(createGroupAction, initialGroupState);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  function toggleMember(memberId: string) {
    setSelectedMemberIds((selected) => selected.includes(memberId)
      ? selected.filter((id) => id !== memberId)
      : selected.length < 20 ? [...selected, memberId] : selected);
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-5 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-primary">People</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{groupMode ? "Create a group" : "Contacts"}</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            {groupMode ? "Search members, select up to 20 people, and name your group." : "Find members by display name and start a private conversation."}
          </p>
        </div>
        <Button asChild variant="outline"><Link href="/protected"><ArrowLeft aria-hidden="true" />Back to chats</Link></Button>
      </header>

      <form action={searchAction} className="flex gap-2 rounded-2xl border border-border/70 bg-card/90 p-3 shadow-sm">
        <label className="sr-only" htmlFor="contacts-query">Search members by display name</label>
        <Input id="contacts-query" name="query" defaultValue={searchState.query} minLength={2} maxLength={40} placeholder="Search by display name" />
        <Button type="submit" disabled={searchPending}><Search aria-hidden="true" />{searchPending ? "Searching…" : "Search"}</Button>
      </form>

      {searchState.error && <p className="text-sm text-destructive" role="alert">{searchState.error}</p>}
      {searchState.query && !searchState.error && searchState.members.length === 0 && !searchPending && (
        <p className="rounded-2xl border border-border/70 bg-card/80 p-6 text-center text-sm text-muted-foreground">No members found. Try another display name.</p>
      )}
      {searchState.members.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {searchState.members.map((member) => (
            <ContactRow key={member.id} member={member} groupMode={groupMode} selected={selectedMemberIds.includes(member.id)} onToggle={toggleMember} />
          ))}
        </ul>
      )}

      {groupMode && (
        <form action={makeGroup} className="space-y-3 rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm">
          <input type="hidden" name="memberIds" value={JSON.stringify(selectedMemberIds)} />
          <label htmlFor="new-group-name" className="text-sm font-semibold">Group name</label>
          <div className="flex flex-wrap gap-2">
            <Input id="new-group-name" name="groupName" minLength={2} maxLength={60} placeholder="For example, Weekend plans" required className="min-w-48 flex-1" />
            <Button type="submit" disabled={groupPending || selectedMemberIds.length === 0}>
              <UsersRound aria-hidden="true" />{groupPending ? "Creating…" : `Create group (${selectedMemberIds.length}/20)`}
            </Button>
          </div>
          {groupState.error && <p className="text-sm text-destructive" role="alert">{groupState.error}</p>}
          {groupState.groupId && <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">Group created. <Link className="font-semibold underline" href={`/protected/groups/${groupState.groupId}`}>Open it</Link></p>}
        </form>
      )}
    </main>
  );
}
