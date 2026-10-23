-- Serialize owner requests before checking the 21-member cap. Without this
-- lock, two simultaneous requests could both observe 20 members and exceed it.
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
    and conversation_row.kind = 'group'
  for update;

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
