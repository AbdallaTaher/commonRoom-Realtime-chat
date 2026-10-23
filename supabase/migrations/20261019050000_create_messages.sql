create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  client_message_id uuid not null,
  content text not null
    check (char_length(content) between 1 and 4000 and content ~ '[^[:space:]]'),
  created_at timestamptz not null default now(),
  constraint messages_request_is_unique
    unique (conversation_id, sender_id, client_message_id)
);

create index if not exists messages_conversation_history_idx
  on public.messages (conversation_id, created_at desc, id desc);

alter table public.messages enable row level security;
revoke all on table public.messages from anon, authenticated;
grant select on table public.messages to authenticated;

create policy "Conversation members can read messages"
  on public.messages for select
  to authenticated
  using ((select public.is_conversation_member(conversation_id)));

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
