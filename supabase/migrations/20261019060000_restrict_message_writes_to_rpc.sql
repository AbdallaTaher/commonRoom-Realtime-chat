-- Prevent direct table inserts from bypassing the validated message RPC.
revoke insert on table public.messages from authenticated;
drop policy if exists "Conversation members can send their own messages"
  on public.messages;

create or replace function public.send_conversation_message(
  target_conversation_id uuid,
  requested_client_message_id uuid,
  requested_content text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_member_id uuid := (select auth.uid());
  cleaned_content text := btrim(coalesce(requested_content, ''));
  saved_message_id uuid;
begin
  if current_member_id is null then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  if not exists (
    select 1 from public.conversation_members
    where conversation_id = target_conversation_id
      and user_id = current_member_id
  ) then
    raise exception using errcode = '42501', message = 'Conversation not found';
  end if;

  if requested_client_message_id is null
    or char_length(cleaned_content) not between 1 and 4000
    or regexp_replace(cleaned_content, E'[\t\n\r]', '', 'g') ~ '[[:cntrl:]]' then
    raise exception using errcode = '22023', message = 'Invalid message';
  end if;

  insert into public.messages (
    conversation_id, sender_id, client_message_id, content
  ) values (
    target_conversation_id, current_member_id, requested_client_message_id, cleaned_content
  )
  on conflict (conversation_id, sender_id, client_message_id)
  do update set client_message_id = excluded.client_message_id
  returning id into saved_message_id;

  return saved_message_id;
end;
$$;

revoke all on function public.send_conversation_message(uuid, uuid, text) from public, anon;
grant execute on function public.send_conversation_message(uuid, uuid, text) to authenticated;
