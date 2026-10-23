-- Realtime channels are private and scoped to a conversation. The authorization
-- helper runs as the database owner because conversation_members is not directly
-- readable by authenticated clients.
create or replace function public.is_conversation_realtime_member()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  requested_topic text := realtime.topic();
  target_conversation_id uuid;
  current_member_id uuid := (select auth.uid());
begin
  if current_member_id is null
    or requested_topic is null
    or requested_topic !~ '^conversation:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$' then
    return false;
  end if;

  target_conversation_id := split_part(requested_topic, ':', 2)::uuid;

  return exists (
    select 1
    from public.conversation_members as member_row
    where member_row.conversation_id = target_conversation_id
      and member_row.user_id = current_member_id
  );
end;
$$;

revoke all on function public.is_conversation_realtime_member() from public, anon;
grant execute on function public.is_conversation_realtime_member() to authenticated;

drop policy if exists "Conversation members can receive private realtime"
  on realtime.messages;
create policy "Conversation members can receive private realtime"
  on realtime.messages for select
  to authenticated
  using (
    realtime.messages.extension in ('broadcast', 'presence')
    and (select public.is_conversation_realtime_member())
  );

drop policy if exists "Conversation members can publish their presence"
  on realtime.messages;
create policy "Conversation members can publish their presence"
  on realtime.messages for insert
  to authenticated
  with check (
    realtime.messages.extension = 'presence'
    and (select public.is_conversation_realtime_member())
  );

create or replace function public.broadcast_new_conversation_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.broadcast_changes(
    'conversation:' || new.conversation_id::text,
    'INSERT',
    'INSERT',
    tg_table_name,
    tg_table_schema,
    new,
    null
  );

  return new;
exception when others then
  raise warning 'Realtime broadcast failed for message % (SQLSTATE %)', new.id, SQLSTATE;
  return new;
end;
$$;

revoke all on function public.broadcast_new_conversation_message() from public, anon, authenticated;

drop trigger if exists broadcast_new_conversation_message on public.messages;
create trigger broadcast_new_conversation_message
  after insert on public.messages
  for each row execute function public.broadcast_new_conversation_message();
