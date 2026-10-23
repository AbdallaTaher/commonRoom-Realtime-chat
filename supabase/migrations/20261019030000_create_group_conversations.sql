alter table public.conversations
  add column if not exists kind text not null default 'direct'
    check (kind in ('direct', 'group')),
  add column if not exists group_name text,
  add column if not exists owner_id uuid references public.profiles (id) on delete cascade;

alter table public.conversations
  add constraint group_conversation_details_match_kind
  check (
    (kind = 'direct' and group_name is null and owner_id is null)
    or
    (kind = 'group' and group_name is not null and owner_id is not null)
  );

create or replace function public.create_group_conversation(
  requested_name text,
  target_member_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_member_id uuid := (select auth.uid());
  cleaned_name text := btrim(coalesce(requested_name, ''));
  new_conversation_id uuid;
begin
  if current_member_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if char_length(cleaned_name) not between 2 and 60
    or cleaned_name ~ '[[:cntrl:]]' then
    raise exception using errcode = '22023', message = 'Invalid group name';
  end if;

  if target_member_ids is null
    or cardinality(target_member_ids) < 1
    or cardinality(target_member_ids) > 20 then
    raise exception using errcode = '22023', message = 'Choose between 1 and 20 other members';
  end if;

  if cardinality(target_member_ids) <> (
    select count(distinct selected.member_id)
    from unnest(target_member_ids) as selected(member_id)
  ) then
    raise exception using errcode = '22023', message = 'Duplicate members are not allowed';
  end if;

  if current_member_id = any(target_member_ids) then
    raise exception using errcode = '22023', message = 'The group owner is added automatically';
  end if;

  if exists (
    select 1
    from unnest(target_member_ids) as selected(member_id)
    left join public.profiles as profile on profile.id = selected.member_id
    where profile.id is null
  ) then
    raise exception using errcode = '22023', message = 'A selected member does not exist';
  end if;

  insert into public.conversations (kind, group_name, owner_id)
  values ('group', cleaned_name, current_member_id)
  returning id into new_conversation_id;

  insert into public.conversation_members (conversation_id, user_id)
  values (new_conversation_id, current_member_id);

  insert into public.conversation_members (conversation_id, user_id)
  select new_conversation_id, selected.member_id
  from unnest(target_member_ids) as selected(member_id);

  return new_conversation_id;
end;
$$;

revoke all on function public.create_group_conversation(text, uuid[]) from public, anon;
grant execute on function public.create_group_conversation(text, uuid[]) to authenticated;

create or replace function public.list_group_conversations()
returns table (
  conversation_id uuid,
  group_name text,
  owner_id uuid,
  member_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select conversation_row.id, conversation_row.group_name, conversation_row.owner_id,
    count(member_row.user_id)
  from public.conversation_members as own_membership
  join public.conversations as conversation_row
    on conversation_row.id = own_membership.conversation_id
   and conversation_row.kind = 'group'
  join public.conversation_members as member_row
    on member_row.conversation_id = conversation_row.id
  where own_membership.user_id = (select auth.uid())
  group by conversation_row.id, conversation_row.group_name, conversation_row.owner_id,
    conversation_row.created_at
  order by conversation_row.created_at desc
  limit 100;
$$;

revoke all on function public.list_group_conversations() from public, anon;
grant execute on function public.list_group_conversations() to authenticated;

create or replace function public.get_group_conversation(target_conversation_id uuid)
returns table (
  conversation_id uuid,
  group_name text,
  owner_id uuid,
  member_id uuid,
  display_name text,
  is_owner boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select conversation_row.id, conversation_row.group_name, conversation_row.owner_id,
    member_row.user_id, profile.display_name,
    conversation_row.owner_id = (select auth.uid())
  from public.conversation_members as own_membership
  join public.conversations as conversation_row
    on conversation_row.id = own_membership.conversation_id
   and conversation_row.kind = 'group'
  join public.conversation_members as member_row
    on member_row.conversation_id = conversation_row.id
  join public.profiles as profile on profile.id = member_row.user_id
  where own_membership.user_id = (select auth.uid())
    and conversation_row.id = target_conversation_id
  order by member_row.joined_at asc;
$$;

revoke all on function public.get_group_conversation(uuid) from public, anon;
grant execute on function public.get_group_conversation(uuid) to authenticated;

create or replace function public.add_group_member(
  target_conversation_id uuid,
  target_member_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_member_id uuid := (select auth.uid());
  group_owner_id uuid;
begin
  select conversation_row.owner_id into group_owner_id
  from public.conversations as conversation_row
  where conversation_row.id = target_conversation_id
    and conversation_row.kind = 'group';

  if current_member_id is null or group_owner_id is distinct from current_member_id then
    raise exception using errcode = '42501', message = 'Only the group owner can add members';
  end if;

  if target_member_id is null or not exists (
    select 1 from public.profiles where id = target_member_id
  ) then
    raise exception using errcode = '22023', message = 'Member not found';
  end if;

  if not exists (
    select 1 from public.conversation_members
    where conversation_id = target_conversation_id and user_id = target_member_id
  ) and (
    select count(*) from public.conversation_members
    where conversation_id = target_conversation_id
  ) >= 21 then
    raise exception using errcode = '22023', message = 'This group has reached its member limit';
  end if;

  insert into public.conversation_members (conversation_id, user_id)
  values (target_conversation_id, target_member_id)
  on conflict (conversation_id, user_id) do nothing;

  return target_conversation_id;
end;
$$;

revoke all on function public.add_group_member(uuid, uuid) from public, anon;
grant execute on function public.add_group_member(uuid, uuid) to authenticated;

create or replace function public.remove_group_member(
  target_conversation_id uuid,
  target_member_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_member_id uuid := (select auth.uid());
  group_owner_id uuid;
  deleted_count integer;
begin
  select conversation_row.owner_id into group_owner_id
  from public.conversations as conversation_row
  where conversation_row.id = target_conversation_id
    and conversation_row.kind = 'group';

  if current_member_id is null or group_owner_id is distinct from current_member_id then
    raise exception using errcode = '42501', message = 'Only the group owner can remove members';
  end if;

  if target_member_id = group_owner_id then
    raise exception using errcode = '22023', message = 'The owner cannot be removed';
  end if;

  delete from public.conversation_members
  where conversation_id = target_conversation_id
    and user_id = target_member_id;
  get diagnostics deleted_count = row_count;

  if deleted_count = 0 then
    raise exception using errcode = '22023', message = 'Member is not in this group';
  end if;

  return target_conversation_id;
end;
$$;

revoke all on function public.remove_group_member(uuid, uuid) from public, anon;
grant execute on function public.remove_group_member(uuid, uuid) to authenticated;

create or replace function public.leave_group_conversation(target_conversation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_member_id uuid := (select auth.uid());
  group_owner_id uuid;
  deleted_count integer;
begin
  select conversation_row.owner_id into group_owner_id
  from public.conversations as conversation_row
  where conversation_row.id = target_conversation_id
    and conversation_row.kind = 'group';

  if current_member_id is null or group_owner_id is null then
    raise exception using errcode = '22023', message = 'Group not found';
  end if;

  if group_owner_id = current_member_id then
    raise exception using errcode = '22023', message = 'Group owners cannot leave their own group';
  end if;

  delete from public.conversation_members
  where conversation_id = target_conversation_id
    and user_id = current_member_id;
  get diagnostics deleted_count = row_count;

  if deleted_count = 0 then
    raise exception using errcode = '42501', message = 'You are not a member of this group';
  end if;

  return target_conversation_id;
end;
$$;

revoke all on function public.leave_group_conversation(uuid) from public, anon;
grant execute on function public.leave_group_conversation(uuid) to authenticated;

create or replace function public.rename_group_conversation(
  target_conversation_id uuid,
  requested_name text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_member_id uuid := (select auth.uid());
  cleaned_name text := btrim(coalesce(requested_name, ''));
  group_owner_id uuid;
begin
  if char_length(cleaned_name) not between 2 and 60
    or cleaned_name ~ '[[:cntrl:]]' then
    raise exception using errcode = '22023', message = 'Invalid group name';
  end if;

  select conversation_row.owner_id into group_owner_id
  from public.conversations as conversation_row
  where conversation_row.id = target_conversation_id
    and conversation_row.kind = 'group';

  if current_member_id is null or group_owner_id is distinct from current_member_id then
    raise exception using errcode = '42501', message = 'Only the group owner can rename this group';
  end if;

  update public.conversations
  set group_name = cleaned_name
  where id = target_conversation_id;

  return target_conversation_id;
end;
$$;

revoke all on function public.rename_group_conversation(uuid, text) from public, anon;
grant execute on function public.rename_group_conversation(uuid, text) to authenticated;
