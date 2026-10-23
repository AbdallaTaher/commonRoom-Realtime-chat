-- Track when each member last opened a conversation. A non-null default gives
-- existing memberships a clean starting point instead of marking old messages unread.
alter table public.conversation_members
  add column if not exists last_read_at timestamptz not null default now();

create index if not exists messages_conversation_unread_idx
  on public.messages (conversation_id, created_at, sender_id);

create or replace function public.mark_conversation_read(target_conversation_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_member_id uuid := (select auth.uid());
  new_read_at timestamptz := now();
begin
  if current_member_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  update public.conversation_members
  set last_read_at = new_read_at
  where conversation_id = target_conversation_id
    and user_id = current_member_id;

  if not found then
    raise exception using errcode = '42501', message = 'Conversation not found';
  end if;

  return new_read_at;
end;
$$;

revoke all on function public.mark_conversation_read(uuid) from public, anon;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

create or replace function public.list_conversation_read_receipts(target_conversation_id uuid)
returns table (
  message_id uuid,
  read_by_count bigint,
  recipient_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select message_row.id,
    count(member_row.user_id) filter (
      where member_row.user_id <> message_row.sender_id
        and member_row.last_read_at >= message_row.created_at
    ),
    greatest(count(member_row.user_id) - 1, 0)
  from public.messages as message_row
  join public.conversation_members as own_membership
    on own_membership.conversation_id = message_row.conversation_id
   and own_membership.user_id = (select auth.uid())
  join public.conversation_members as member_row
    on member_row.conversation_id = message_row.conversation_id
  where message_row.conversation_id = target_conversation_id
    and message_row.sender_id = (select auth.uid())
  group by message_row.id, message_row.created_at
  order by message_row.created_at desc, message_row.id desc
  limit 100;
$$;

revoke all on function public.list_conversation_read_receipts(uuid) from public, anon;
grant execute on function public.list_conversation_read_receipts(uuid) to authenticated;

-- Replace list functions to return real message previews and unread counts.
drop function if exists public.list_direct_conversations();
create function public.list_direct_conversations()
returns table (
  conversation_id uuid,
  started_at timestamptz,
  member_id uuid,
  display_name text,
  last_message_sender_id uuid,
  last_message text,
  last_message_at timestamptz,
  unread_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select conversation_row.id, conversation_row.created_at,
    other_member.user_id, profile.display_name,
    latest_message.sender_id, latest_message.content, latest_message.created_at,
    (select count(*)
     from public.messages as unread_message
     where unread_message.conversation_id = conversation_row.id
       and unread_message.sender_id <> own_membership.user_id
       and unread_message.created_at > own_membership.last_read_at)
  from public.conversation_members as own_membership
  join public.conversation_members as other_member
    on other_member.conversation_id = own_membership.conversation_id
   and other_member.user_id <> (select auth.uid())
  join public.conversations as conversation_row
    on conversation_row.id = own_membership.conversation_id
   and conversation_row.kind = 'direct'
  join public.direct_conversation_pairs as pair_row
    on pair_row.conversation_id = conversation_row.id
  join public.profiles as profile on profile.id = other_member.user_id
  left join lateral (
    select message_row.sender_id, message_row.content, message_row.created_at
    from public.messages as message_row
    where message_row.conversation_id = conversation_row.id
    order by message_row.created_at desc, message_row.id desc
    limit 1
  ) as latest_message on true
  where own_membership.user_id = (select auth.uid())
  order by coalesce(latest_message.created_at, conversation_row.created_at) desc
  limit 100;
$$;
revoke all on function public.list_direct_conversations() from public, anon;
grant execute on function public.list_direct_conversations() to authenticated;

drop function if exists public.list_group_conversations();
create function public.list_group_conversations()
returns table (
  conversation_id uuid,
  group_name text,
  owner_id uuid,
  started_at timestamptz,
  member_count bigint,
  member_ids uuid[],
  last_message_sender_id uuid,
  last_message text,
  last_message_at timestamptz,
  unread_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select conversation_row.id, conversation_row.group_name, conversation_row.owner_id,
    conversation_row.created_at, count(member_row.user_id), array_agg(member_row.user_id),
    latest_message.sender_id, latest_message.content, latest_message.created_at,
    (select count(*)
     from public.messages as unread_message
     where unread_message.conversation_id = conversation_row.id
       and unread_message.sender_id <> own_membership.user_id
       and unread_message.created_at > own_membership.last_read_at)
  from public.conversation_members as own_membership
  join public.conversations as conversation_row
    on conversation_row.id = own_membership.conversation_id
   and conversation_row.kind = 'group'
  join public.conversation_members as member_row
    on member_row.conversation_id = conversation_row.id
  left join lateral (
    select message_row.sender_id, message_row.content, message_row.created_at
    from public.messages as message_row
    where message_row.conversation_id = conversation_row.id
    order by message_row.created_at desc, message_row.id desc
    limit 1
  ) as latest_message on true
  where own_membership.user_id = (select auth.uid())
  group by conversation_row.id, conversation_row.group_name, conversation_row.owner_id,
    conversation_row.created_at, latest_message.content, latest_message.created_at,
    latest_message.sender_id, own_membership.user_id
  order by coalesce(latest_message.created_at, conversation_row.created_at) desc
  limit 100;
$$;
revoke all on function public.list_group_conversations() from public, anon;
grant execute on function public.list_group_conversations() to authenticated;

-- The directory channel shares only authenticated member IDs, never profile details.
drop policy if exists "Conversation members can receive private realtime" on realtime.messages;
create policy "Members can receive private realtime"
  on realtime.messages for select
  to authenticated
  using (
    realtime.messages.extension in ('broadcast', 'presence')
    and (
      (realtime.topic() = 'members:online' and (select auth.uid()) is not null)
      or (select public.is_conversation_realtime_member())
    )
  );

drop policy if exists "Conversation members can publish their presence" on realtime.messages;
drop policy if exists "Members can publish private presence" on realtime.messages;
create policy "Members can publish private presence"
  on realtime.messages for insert
  to authenticated
  with check (
    realtime.messages.extension = 'presence'
    and (
      (realtime.topic() = 'members:online' and (select auth.uid()) is not null)
      or (select public.is_conversation_realtime_member())
    )
  );

create or replace function public.broadcast_conversation_read_receipt()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.broadcast_changes(
    'conversation:' || new.conversation_id::text,
    'READ_RECEIPT',
    'UPDATE',
    tg_table_name,
    tg_table_schema,
    new,
    old
  );
  return new;
exception when others then
  raise warning 'Realtime read receipt broadcast failed for conversation % (SQLSTATE %)', new.conversation_id, SQLSTATE;
  return new;
end;
$$;

revoke all on function public.broadcast_conversation_read_receipt() from public, anon, authenticated;
drop trigger if exists broadcast_conversation_read_receipt on public.conversation_members;
create trigger broadcast_conversation_read_receipt
  after update of last_read_at on public.conversation_members
  for each row
  when (old.last_read_at is distinct from new.last_read_at)
  execute function public.broadcast_conversation_read_receipt();
