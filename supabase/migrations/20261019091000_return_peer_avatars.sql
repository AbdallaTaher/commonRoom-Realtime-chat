-- Expose only the other participant's public avatar path through membership-
-- checked direct conversation functions.
-- Keep this migration safe if the unread-receipts migration was not applied yet.
alter table public.conversation_members
  add column if not exists last_read_at timestamptz not null default now();

drop function if exists public.list_direct_conversations();
create function public.list_direct_conversations()
returns table (
  conversation_id uuid,
  started_at timestamptz,
  member_id uuid,
  display_name text,
  avatar_path text,
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
    other_member.user_id, profile.display_name, profile.avatar_path,
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

drop function if exists public.get_direct_conversation(uuid);
create function public.get_direct_conversation(target_conversation_id uuid)
returns table (
  conversation_id uuid,
  started_at timestamptz,
  member_id uuid,
  display_name text,
  avatar_path text,
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
    other_member.user_id, profile.display_name, profile.avatar_path,
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
    and conversation_row.id = target_conversation_id
  limit 1;
$$;
revoke all on function public.get_direct_conversation(uuid) from public, anon;
grant execute on function public.get_direct_conversation(uuid) to authenticated;
