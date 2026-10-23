"use client";

import { useActionState } from "react";
import { Search, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageThread } from "@/components/protected/message-thread";
import {
  addGroupMemberAction,
  leaveGroupAction,
  removeGroupMemberAction,
  renameGroupAction,
} from "@/lib/actions/groups";
import { searchMembersAction } from "@/lib/actions/profiles";
import type { GroupMember } from "@/lib/groups/service";
import type { Message } from "@/lib/messages/service";
import type { Profile } from "@/lib/profiles/service";
import { useWorkspacePresence } from "@/lib/realtime/workspace-presence";

const initialGroupActionState = { error: null, success: null };
const initialSearchState = { error: null, query: "", members: [] };

function MemberActions({
  groupId,
  member,
  owner,
  isOwner,
  isOnline,
}: {
  groupId: string;
  member: Profile;
  owner: boolean;
  isOwner: boolean;
  isOnline: boolean;
}) {
  const [removeState, removeAction, removePending] = useActionState(
    removeGroupMemberAction,
    initialGroupActionState,
  );

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-background/55 px-4 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary" aria-hidden="true">
        {member.display_name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase() ?? "").join("") || <UserRound className="size-4" />}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{member.display_name}</span>
      {isOnline && <span className="presence-label"><span className="presence-indicator-inline" />Online</span>}
      {owner && <span className="text-xs text-muted-foreground">Owner</span>}
      {isOwner && !owner && (
        <form action={removeAction}>
          <input type="hidden" name="groupId" value={groupId} />
          <input type="hidden" name="memberId" value={member.id} />
          <Button type="submit" size="sm" variant="outline" disabled={removePending}>
            {removePending ? "Removing…" : "Remove"}
          </Button>
        </form>
      )}
      {removeState.error && <p className="basis-full text-xs text-destructive" role="status">{removeState.error}</p>}
    </li>
  );
}

function AddMemberResult({ groupId, member }: { groupId: string; member: Profile }) {
  const [state, action, pending] = useActionState(addGroupMemberAction, initialGroupActionState);
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/55 px-3 py-2">
      <span className="min-w-0 flex-1 truncate text-sm">{member.display_name}</span>
      {state.success ? <span className="text-xs text-emerald-600 dark:text-emerald-400">Added</span> : (
        <form action={action}>
          <input type="hidden" name="groupId" value={groupId} />
          <input type="hidden" name="memberId" value={member.id} />
          <Button type="submit" size="sm" variant="outline" disabled={pending}>{pending ? "Adding…" : "Add"}</Button>
        </form>
      )}
      {state.error && <p className="basis-full text-xs text-destructive" role="status">{state.error}</p>}
    </li>
  );
}

export function GroupDetails({
  members,
  currentUserId,
  messages,
  hasMoreMessages,
}: {
  members: GroupMember[];
  currentUserId: string;
  messages: Message[];
  hasMoreMessages: boolean;
}) {
  const group = members[0];
  const { onlineUserIds } = useWorkspacePresence();
  const [renameState, renameAction, renamePending] = useActionState(renameGroupAction, initialGroupActionState);
  const [searchState, searchAction, searchPending] = useActionState(searchMembersAction, initialSearchState);
  const [leaveState, leaveAction, leavePending] = useActionState(leaveGroupAction, initialGroupActionState);
  if (!group) return null;

  const isOwner = group.is_owner;
  const memberIds = new Set(members.map((member) => member.member_id));
  const addableMembers = searchState.members.filter((member) => !memberIds.has(member.id));

  return (
    <div className="group-conversation-layout">
      <div className="group-management-panel">
      <section className="glass-panel rounded-[2rem] p-6 sm:p-8" aria-labelledby="group-title">
        <p className="text-sm font-semibold text-primary">{isOwner ? "You own this group" : "Group details"}</p>
        <h1 id="group-title" className="mt-2 text-3xl font-extrabold tracking-tight">{group.group_name}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{members.length} {members.length === 1 ? "member" : "members"} · {members.filter((member) => member.member_id !== currentUserId && onlineUserIds.includes(member.member_id)).length} online</p>
        {isOwner ? (
          <form action={renameAction} className="mt-7 space-y-3">
            <input type="hidden" name="groupId" value={group.conversation_id} />
            <label htmlFor="rename-group" className="text-sm font-semibold">Group name</label>
            <Input id="rename-group" name="groupName" defaultValue={group.group_name} minLength={2} maxLength={60} required />
            <Button type="submit" variant="outline" disabled={renamePending}>{renamePending ? "Saving…" : "Save group name"}</Button>
            <p className="min-h-5 text-sm" aria-live="polite">{renameState.error ? <span className="text-destructive">{renameState.error}</span> : renameState.success ? <span className="text-emerald-600 dark:text-emerald-400">{renameState.success}</span> : null}</p>
          </form>
        ) : (
          <form action={leaveAction} className="mt-7">
            <input type="hidden" name="groupId" value={group.conversation_id} />
            <Button type="submit" variant="outline" disabled={leavePending}>{leavePending ? "Leaving…" : "Leave group"}</Button>
            {leaveState.error && <p className="mt-2 text-sm text-destructive" role="status">{leaveState.error}</p>}
          </form>
        )}
      </section>

      <section className="glass-panel rounded-[2rem] p-6 sm:p-8" aria-labelledby="group-members-title">
        <h2 id="group-members-title" className="text-xl font-extrabold">Members</h2>
        <ul className="mt-5 space-y-2">
          {members.map((member) => (
            <MemberActions
              key={member.member_id}
              groupId={group.conversation_id}
              member={{ id: member.member_id, display_name: member.display_name }}
              owner={member.member_id === group.owner_id}
              isOwner={isOwner}
              isOnline={member.member_id !== currentUserId && onlineUserIds.includes(member.member_id)}
            />
          ))}
        </ul>

        {isOwner && (
          <div className="mt-8 border-t border-border/70 pt-6">
            <h3 className="font-bold">Add members</h3>
            <p className="mt-1 text-sm text-muted-foreground">Search by display name. Existing members are hidden from the results.</p>
            <form action={searchAction} className="mt-4 flex gap-2">
              <label className="sr-only" htmlFor="add-member-query">Search people to add</label>
              <Input id="add-member-query" name="query" defaultValue={searchState.query} placeholder="Search names…" minLength={2} maxLength={40} />
              <Button type="submit" aria-label="Search people to add" disabled={searchPending}><Search aria-hidden="true" /></Button>
            </form>
            <div className="mt-4" aria-live="polite">
              {searchState.error ? <p className="text-sm text-destructive">{searchState.error}</p> : searchState.query && addableMembers.length === 0 ? <p className="text-sm text-muted-foreground">No new members found.</p> : addableMembers.length > 0 ? (
                <ul className="space-y-2">
                  {addableMembers.map((member) => <AddMemberResult key={member.id} groupId={group.conversation_id} member={member} />)}
                </ul>
              ) : <p className="text-sm text-muted-foreground">Search for a person to add to this group.</p>}
            </div>
          </div>
        )}
      </section>
      </div>

      <div className="group-message-panel">
        <MessageThread
          conversationId={group.conversation_id}
          currentUserId={currentUserId}
          initialMessages={messages}
          hasMore={hasMoreMessages}
          headerTitle={group.group_name}
          headerSubtitle={`${members.length} ${members.length === 1 ? "member" : "members"}`}
          headerIsGroup
        />
      </div>
    </div>
  );
}
