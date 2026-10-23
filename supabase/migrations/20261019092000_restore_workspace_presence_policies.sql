-- Reapply the authenticated workspace-presence rules. The earlier inbox
-- migration may not have completed if its last_read_at column was missing.
drop policy if exists "Conversation members can receive private realtime"
  on realtime.messages;
drop policy if exists "Members can receive private realtime"
  on realtime.messages;

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

drop policy if exists "Conversation members can publish their presence"
  on realtime.messages;
drop policy if exists "Members can publish private presence"
  on realtime.messages;

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
