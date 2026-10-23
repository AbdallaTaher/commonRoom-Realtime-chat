-- Enforce message abuse limits in Postgres so they also apply to direct RPC
-- callers, not just requests made through the Next.js UI.
create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

create table if not exists app_private.message_rate_limits (
  user_id uuid primary key references auth.users (id) on delete cascade,
  window_started_at timestamptz not null,
  message_count integer not null check (message_count between 1 and 31)
);

alter table app_private.message_rate_limits enable row level security;
revoke all on table app_private.message_rate_limits from public, anon, authenticated;

create or replace function public.enforce_message_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_window timestamptz := date_trunc('minute', statement_timestamp());
  current_count integer;
begin
  if new.sender_id is distinct from (select auth.uid()) then
    raise exception using errcode = '42501', message = 'Authentication required';
  end if;

  insert into app_private.message_rate_limits (user_id, window_started_at, message_count)
  values (new.sender_id, current_window, 1)
  on conflict (user_id) do update
    set window_started_at = excluded.window_started_at,
        message_count = case
          when app_private.message_rate_limits.window_started_at = excluded.window_started_at
            then app_private.message_rate_limits.message_count + 1
          else 1
        end
  returning message_count into current_count;

  if current_count > 30 then
    raise exception using errcode = 'P0001', message = 'Message rate limit exceeded';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_message_rate_limit() from public, anon, authenticated;
drop trigger if exists enforce_message_rate_limit on public.messages;
create trigger enforce_message_rate_limit
  before insert on public.messages
  for each row execute function public.enforce_message_rate_limit();

-- Workspace presence exposes presence state only. Broadcasts remain limited to
-- conversation members so arbitrary private payloads cannot be sent workspace-wide.
drop policy if exists "Members can receive private realtime" on realtime.messages;
create policy "Members can receive private realtime"
  on realtime.messages for select
  to authenticated
  using (
    (
      realtime.topic() = 'members:online'
      and realtime.messages.extension = 'presence'
      and (select auth.uid()) is not null
    )
    or (
      realtime.messages.extension in ('broadcast', 'presence')
      and (select public.is_conversation_realtime_member())
    )
  );

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
